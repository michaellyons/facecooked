'use client'

import { useFaceDetectionStore, type DetectedFace } from '../stores'
import { useState } from 'react'
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react'

interface DetectedFacesListProps {
  onSeekToTime?: (timestamp: number) => void
}

export function DetectedFacesList({ onSeekToTime }: DetectedFacesListProps) {
  const {
    getActiveFaces,
    getDeletedFaces,
    softDeleteFace,
    permanentDeleteFace,
    restoreFace,
    totalActiveFaces,
    getCaptureById,
    cleanupOrphanedData
  } = useFaceDetectionStore()

  const [showDeleted, setShowDeleted] = useState(false)
  const [faceToDelete, setFaceToDelete] = useState<string | null>(null)
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false)
  
  const activeFaces = getActiveFaces()
  const deletedFaces = getDeletedFaces()
  const facesToShow = showDeleted ? deletedFaces : activeFaces

  const handleDeleteFace = async (faceId: string) => {
    await softDeleteFace(faceId)
    // Cleanup orphaned data periodically
    setTimeout(() => cleanupOrphanedData(), 100)
  }

  const handlePermanentDelete = (faceId: string) => {
    setFaceToDelete(faceId)
    setShowPermanentDeleteDialog(true)
  }

  const confirmPermanentDelete = async () => {
    if (faceToDelete) {
      await permanentDeleteFace(faceToDelete)
      setFaceToDelete(null)
      setShowPermanentDeleteDialog(false)
      // Cleanup orphaned data after permanent deletion
      setTimeout(() => cleanupOrphanedData(), 100)
    }
  }

  const handleRestoreFace = async (faceId: string) => {
    await restoreFace(faceId)
    // Cleanup orphaned data periodically
    setTimeout(() => cleanupOrphanedData(), 100)
  }

  const handleSeekToCapture = (captureId: string) => {
    const capture = getCaptureById(captureId)
    if (capture && onSeekToTime) {
      onSeekToTime(capture.timestamp)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (activeFaces.length === 0 && deletedFaces.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-4xl mb-3">👤</div>
        <h3 className="font-medium text-gray-400 mb-2">No Faces Detected Yet</h3>
        <p className="text-sm text-gray-500">
          Process some captured frames to detect faces in your video.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium text-white">{totalActiveFaces}</span>
            <span className="text-gray-400"> active faces</span>
          </div>
          {deletedFaces.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-red-400">{deletedFaces.length}</span>
              <span className="text-gray-400"> deleted</span>
            </div>
          )}
        </div>
        
        {deletedFaces.length > 0 && (
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              showDeleted 
                ? 'bg-red-900/30 text-red-400' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {showDeleted ? '👁️ Show Active' : '🗑️ Show Deleted'}
          </button>
        )}
      </div>

      {/* Faces List */}
      <div className="space-y-3">
        {facesToShow.map((face: DetectedFace) => {
          const capture = getCaptureById(face.capture_id)
          const isDeleted = !!face.deleted_at
          
          return (
            <div
              key={face.id}
              className={`p-4 rounded-lg border transition-all ${
                isDeleted 
                  ? 'border-red-900/50 bg-red-900/20 opacity-75' 
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Face info header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">
                        Face {face.id.split('_').pop()?.substring(0, 6)}
                      </span>
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                        {Math.round(face.confidence * 100)}% confidence
                      </span>
                      {isDeleted && (
                        <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded">
                          Deleted
                        </span>
                      )}
                    </div>
                    
                    {capture && (
                      <button
                        onClick={() => handleSeekToCapture(face.capture_id)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                      >
                        <span>⏯️</span>
                        <span>{formatTime(capture.timestamp)}</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Face details */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-400 mb-3">
                    <div>
                      <span className="font-medium">Position:</span>
                      <span className="ml-1">
                        {Math.round(face.box.x)}, {Math.round(face.box.y)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Size:</span>
                      <span className="ml-1">
                        {Math.round(face.box.width)} × {Math.round(face.box.height)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Expression details */}
                  {face.expressions && face.expressions.length > 0 && (
                    <div className="text-xs text-gray-400 mb-2">
                      <span className="font-medium">Expression:</span>
                      <span className="ml-1">
                        {face.expressions[0].expression} ({Math.round(face.expressions[0].probability * 100)}%)
                      </span>
                    </div>
                  )}
                  
                  {/* Age/Gender details */}
                  {(face.age || face.gender) && (
                    <div className="text-xs text-gray-400 mb-2">
                      {face.age && (
                        <span>
                          <span className="font-medium">Age:</span>
                          <span className="ml-1">~{Math.round(face.age)}</span>
                        </span>
                      )}
                      {face.age && face.gender && <span className="mx-2">•</span>}
                      {face.gender && (
                        <span>
                          <span className="font-medium">Gender:</span>
                          <span className="ml-1">{face.gender}</span>
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Landmarks count */}
                  {face.landmarks && (
                    <div className="text-xs text-gray-400">
                      <span className="font-medium">Landmarks:</span>
                      <span className="ml-1">{face.landmarks.length} points</span>
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  {!isDeleted ? (
                    <>
                      <button
                        onClick={() => handleDeleteFace(face.id)}
                        className="w-8 h-8 bg-yellow-900/30 text-yellow-400 rounded hover:bg-yellow-900/50 transition-colors text-xs flex items-center justify-center"
                        title="Hide face (soft delete)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(face.id)}
                        className="w-8 h-8 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors text-xs flex items-center justify-center"
                        title="Permanently delete face"
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRestoreFace(face.id)}
                        className="w-8 h-8 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50 transition-colors text-xs flex items-center justify-center"
                        title="Restore face"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(face.id)}
                        className="w-8 h-8 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors text-xs flex items-center justify-center"
                        title="Permanently delete face"
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Permanent Delete Confirmation Dialog */}
      {showPermanentDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-4 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Permanently Delete Face?</h3>
            </div>
            <p className="text-gray-400 mb-6">
              This will permanently remove the face and prevent similar faces from being detected in future captures. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmPermanentDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Permanently Delete
              </button>
              <button
                onClick={() => {
                  setShowPermanentDeleteDialog(false)
                  setFaceToDelete(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 