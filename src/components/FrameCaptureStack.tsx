'use client'

import { useFaceDetectionStore, useVideoStore, type CaptureShot, type DetectedFace } from '../stores'
import { useState, useEffect } from 'react'
import { 
  Camera, 
  Settings, 
  Trash2, 
  Play,
  Loader2,
  Search,
  Clock,
  AlertCircle,
  Target,
  Users
} from 'lucide-react'

interface FrameCaptureStackProps {
  onFrameSelect?: (captureId: string) => void
  onSeekToTime?: (timestamp: number) => void
  onFaceClick?: (shotId: string, faceIndex: number) => void
}

export function FrameCaptureStack({ onFrameSelect, onSeekToTime, onFaceClick }: FrameCaptureStackProps) {
  const {
    captureShots,
    selectedCaptureId,
    selectCaptureShot,
    processCaptureShot,
    processAllCaptures,
    removeCaptureShot,
    processingOptions,
    setProcessingOptions,
    isProcessing,
    processingProgress,
    totalFaces
  } = useFaceDetectionStore()

  const { currentTime } = useVideoStore()

  const [showProcessingOptions, setShowProcessingOptions] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ 
    captureId: string
    timestamp: number 
  } | null>(null)

  const handleCaptureSelect = (captureId: string) => {
    const isCurrentlySelected = selectedCaptureId === captureId
    const newSelection = isCurrentlySelected ? null : captureId
    
    selectCaptureShot(newSelection)
    
    if (newSelection && onFrameSelect) {
      onFrameSelect(newSelection)
    }
  }

  const handleProcessCapture = async (captureId: string) => {
    await processCaptureShot(captureId)
  }

  const handleProcessAll = async () => {
    await processAllCaptures()
  }

  const handleSeekToCapture = (timestamp: number) => {
    if (onSeekToTime) {
      onSeekToTime(timestamp)
    }
  }

  const handleRemoveCapture = (captureId: string, timestamp: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmation({ captureId, timestamp })
  }

  const confirmDelete = () => {
    if (deleteConfirmation) {
      removeCaptureShot(deleteConfirmation.captureId)
      setDeleteConfirmation(null)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation(null)
  }

  // Check if capture timestamp is close to current video time (within 1 second)
  const isCurrentFrame = (timestamp: number) => {
    return Math.abs(currentTime - timestamp) < 1.0
  }

  // Handle escape key for confirmation dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deleteConfirmation) {
        cancelDelete()
      }
    }
    
    if (deleteConfirmation) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [deleteConfirmation])

  const getFaceCountDisplay = (capture: CaptureShot) => {
    if (capture.isProcessing) return <Clock className="w-4 h-4 animate-pulse" />
    if (capture.error) return <AlertCircle className="w-4 h-4" />
    if (!capture.isProcessed) return <Target className="w-4 h-4" />
    return (
      <div className="flex items-center space-x-1">
        <Users className="w-4 h-4" />
        <span>{capture.detectedFaces.length}</span>
      </div>
    )
  }

  const getProcessedCount = () => {
    return captureShots.filter((shot: CaptureShot) => shot.isProcessed).length
  }

  const getUnprocessedCount = () => {
    return captureShots.filter((shot: CaptureShot) => !shot.isProcessed && !shot.isProcessing).length
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (captureShots.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-3">No Frame Captures Yet</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
        {`Use the "Capture & Detect" button while watching your video to save frames for face detection analysis.`}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Title and Controls */}
      <div className="space-y-4">
        {/* Title and Options Button Inline */}
        <div className="flex items-center space-x-3 justify-between">
          <div className="flex items-center space-x-3">
            <Camera className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Captured Frames</h3>
            <div className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm font-medium">
              {captureShots.length}
            </div>
          </div>
          <button
            onClick={() => setShowProcessingOptions(!showProcessingOptions)}
            className="px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Options</span>
          </button>
        </div>

        {/* Small Stats */}
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <div>
            <span className="font-medium text-gray-300">{captureShots.length}</span>
            <span className="ml-1">captures</span>
          </div>
          <div>
            <span className="font-medium text-green-400">{getProcessedCount()}</span>
            <span className="ml-1">processed</span>
          </div>
          <div>
            <span className="font-medium text-blue-400">{totalFaces}</span>
            <span className="ml-1">faces</span>
          </div>
        </div>

        {getUnprocessedCount() > 0 && (
          <button
            onClick={handleProcessAll}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Detect All Faces ({getUnprocessedCount()})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Processing Options Panel */}
      {showProcessingOptions && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-4 text-lg">Detection Options</h4>
          <div className="grid grid-cols-1 gap-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={processingOptions.detectFaces}
                onChange={(e) => setProcessingOptions({ detectFaces: e.target.checked })}
                className="rounded border-blue-300 w-4 h-4"
              />
              <span className="text-sm text-blue-800">Face Detection</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={processingOptions.detectLandmarks}
                onChange={(e) => setProcessingOptions({ detectLandmarks: e.target.checked })}
                className="rounded border-blue-300 w-4 h-4"
              />
              <span className="text-sm text-blue-800">Landmarks (68 points)</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={processingOptions.detectExpressions}
                onChange={(e) => setProcessingOptions({ detectExpressions: e.target.checked })}
                className="rounded border-blue-300 w-4 h-4"
              />
              <span className="text-sm text-blue-800">Expressions</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={processingOptions.detectAge}
                onChange={(e) => setProcessingOptions({ detectAge: e.target.checked })}
                className="rounded border-blue-300 w-4 h-4"
              />
              <span className="text-sm text-blue-800">Age Estimation</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={processingOptions.detectGender}
                onChange={(e) => setProcessingOptions({ detectGender: e.target.checked })}
                className="rounded border-blue-300 w-4 h-4"
              />
              <span className="text-sm text-blue-800">Gender Detection</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={processingOptions.recognizeFaces}
                onChange={(e) => setProcessingOptions({ recognizeFaces: e.target.checked })}
                className="rounded border-blue-300 w-4 h-4"
              />
              <span className="text-sm text-blue-800">Face Recognition</span>
            </label>
          </div>
        </div>
      )}

      {/* Processing Progress */}
      {isProcessing && processingProgress > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-yellow-800">Processing Captures...</span>
            <span className="text-sm text-yellow-600">{Math.round(processingProgress)}%</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-3">
            <div 
              className="bg-yellow-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Capture Grid - Much Larger Thumbnails */}
      <div className="space-y-4">
        {captureShots.map((capture: CaptureShot) => {
          const isSelected = selectedCaptureId === capture.id
          const isCurrent = isCurrentFrame(capture.timestamp)
          
          return (
            <div
              key={capture.id}
              className={`group relative cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : isCurrent
                  ? 'ring-2 ring-green-400 shadow-md'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleCaptureSelect(capture.id)}
            >
              {/* Large Thumbnail Container */}
              <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <img
                  src={capture.dataUrl}
                  alt={`Capture at ${formatTime(capture.timestamp)}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Icons and Info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                  {/* Top-left Status Icons */}
                  <div className="absolute top-3 left-3 flex space-x-2 z-10">
                    {isSelected && (
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        ✓ Selected
                      </div>
                    )}
                    
                    {isCurrent && (
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                        ▶ Current Frame
                      </div>
                    )}
                    
                    <div className={`px-2 py-1 rounded text-xs font-medium flex items-center ${
                      capture.isProcessing 
                        ? 'bg-yellow-500 text-white animate-pulse' 
                        : capture.error 
                        ? 'bg-red-500 text-white' 
                        : capture.isProcessed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {getFaceCountDisplay(capture)}
                    </div>
                  </div>

                  {/* Top-right Actions - Always clickable with high z-index */}
                  <div className={`absolute top-3 right-3 flex space-x-2 transition-opacity z-20 ${
                    isSelected 
                      ? 'opacity-100' 
                      : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSeekToCapture(capture.timestamp)
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm border border-white/20 z-30 relative"
                      title="Seek to timestamp"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => handleRemoveCapture(capture.id, capture.timestamp, e)}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm border border-white/20 z-30 relative"
                      title="Delete capture"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Info Bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <div className="flex items-center justify-between text-white">
                      <div className="text-sm font-medium">
                        {formatTime(capture.timestamp)}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {capture.isProcessed && capture.detectedFaces.length > 0 && (
                          <div className="text-xs bg-white/20 px-2 py-1 rounded">
                            {capture.detectedFaces.length} face{capture.detectedFaces.length !== 1 ? 's' : ''}
                          </div>
                        )}
                        
                        {!capture.isProcessed && !capture.isProcessing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProcessCapture(capture.id)
                            }}
                            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-medium transition-colors backdrop-blur-sm border border-white/20 flex items-center space-x-1"
                          >
                            <Search className="w-3 h-3" />
                            <span>Detect Faces</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Face Detection Overlays */}
                {capture.isProcessed && capture.detectedFaces.length > 0 && (
                  <div className="absolute inset-0 z-5">
                    {capture.detectedFaces.map((face: DetectedFace, index: number) => {
                      const isAssigned = face.character_id && face.character_name
                      const borderColor = isAssigned ? 'border-blue-400' : 'border-yellow-400'
                      const bgColor = isAssigned ? 'bg-blue-400/20' : 'bg-yellow-400/20'
                      const labelBgColor = isAssigned ? 'bg-blue-500' : 'bg-yellow-500'
                      
                      return (
                        <div
                          key={face.id}
                          className={`absolute border-2 ${borderColor} ${bgColor} transition-all duration-200 hover:shadow-lg cursor-pointer`}
                          style={{
                            left: `${(face.box.x / capture.width) * 100}%`,
                            top: `${(face.box.y / capture.height) * 100}%`,
                            width: `${(face.box.width / capture.width) * 100}%`,
                            height: `${(face.box.height / capture.height) * 100}%`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onFaceClick) {
                              onFaceClick(capture.id, index)
                            }
                          }}
                          title="Click to seek to this moment and highlight face"
                        >
                          {/* Face Info Label */}
                          <div className={`absolute -top-8 left-0 ${labelBgColor} text-white px-2 py-1 text-xs rounded shadow-lg max-w-32 truncate`}>
                            {isAssigned ? (
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">{face.character_name}</span>
                                <span className="opacity-75">({Math.round(face.confidence * 100)}%)</span>
                              </div>
                            ) : (
                              <span>Unassigned ({Math.round(face.confidence * 100)}%)</span>
                            )}
                          </div>

                          {/* Character Indicator Dot */}
                          {isAssigned && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-sm flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}

                          {/* Face Landmarks (if available) */}
                          {face.landmarks && face.landmarks.length > 0 && (
                            <div className="absolute inset-0">
                              {face.landmarks.slice(0, 5).map((landmark: { x: number; y: number }, lIndex: number) => (
                                <div
                                  key={lIndex}
                                  className="absolute w-1 h-1 bg-white rounded-full shadow-sm"
                                  style={{
                                    left: `${((landmark.x - face.box.x) / face.box.width) * 100}%`,
                                    top: `${((landmark.y - face.box.y) / face.box.height) * 100}%`,
                                  }}
                                />
                              ))}
                            </div>
                          )}

                          {/* Expression Indicator */}
                          {face.expressions && face.expressions.length > 0 && (
                            <div className="absolute -bottom-6 left-0 bg-black/70 text-white px-1 py-0.5 text-xs rounded">
                              {face.expressions[0].expression}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Error State Overlay */}
                {capture.error && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-10">
                    <div className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                      Error: {capture.error}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Delete Captured Frame?
            </h3>
            
            <p className="text-gray-300 mb-2">
              This will permanently delete the frame captured at{' '}
              <span className="font-mono text-blue-400">
                {formatTime(deleteConfirmation.timestamp)}
              </span>
            </p>
            
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 mb-6">
              <div className="flex items-center space-x-2 text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Important</span>
              </div>
              <p className="text-yellow-300 text-sm mt-1">
                This will also remove all face detections and character assignments from this frame.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Frame
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 