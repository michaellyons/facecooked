'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useVideoStore, useFaceDetectionStore, useAssetsStore } from '../stores'
import { FrameCaptureStack } from './FrameCaptureStack'
import { CharacterPanel } from './CharacterPanel'
import FaceGroupingPanel from './FaceGroupingPanel'
import { ApiTestPanel } from './ApiTestPanel'
import { ModelSelectionPanel } from './ModelSelectionPanel'
import { AssetLoader } from './AssetLoader'
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from './ui/resizable'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { 
  Play, 
  Pause, 
  Volume2, 
  Camera, 
  Users, 
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  Sparkles,
  Eye,
  EyeOff,
  Brain,
  Settings,
  RefreshCw,
  SkipForward,
  SkipBack
} from 'lucide-react'

type ViewState = 
  | 'initializing'      // Loading models and assets
  | 'models-ready'      // Models complete, showing transition
  | 'upload-ready'      // Ready to accept video uploads  
  | 'uploading'         // Processing video upload
  | 'video-ready'       // Video loaded and ready for analysis

// Face Overlay Component for real-time face detection visualization
interface FaceOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  showOverlay: boolean
  currentTime: number
  highlightedFace?: { shotId: string; faceIndex: number } | null
}

function FaceOverlay({ videoRef, showOverlay, currentTime, highlightedFace }: FaceOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { captureShots, modelsLoaded } = useFaceDetectionStore()
  const { selectedModels, getSelectedModelForCapability, isCapabilityAvailable } = useAssetsStore()
  const [isDetecting, setIsDetecting] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [forwardTimes, setForwardTimes] = useState<number[]>([])
  
  // Check if face detection models are loaded (similar to reference)
  const isFaceDetectionModelLoaded = useCallback(() => {
    const faceapi = (window as any).faceapi
    return faceapi && modelsLoaded && isCapabilityAvailable('detection')
  }, [modelsLoaded, isCapabilityAvailable])

  // Get face detector options based on selected model
  const getFaceDetectorOptions = useCallback(() => {
    const faceapi = (window as any).faceapi
    if (!faceapi) return null
    
    const selectedDetectionModel = getSelectedModelForCapability('detection')
    
    switch (selectedDetectionModel) {
      case 'tiny_face_detector':
        return new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 416, 
          scoreThreshold: 0.5 
        })
      case 'mtcnn':
        return new faceapi.MtcnnOptions({ 
          minFaceSize: 20, 
          scaleFactor: 0.709 
        })
      case 'ssd_mobilenetv1':
      default:
        return new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
    }
  }, [getSelectedModelForCapability])

  // Update time stats (from reference implementation)
  const updateTimeStats = useCallback((timeInMs: number) => {
    setForwardTimes(prev => [timeInMs, ...prev].slice(0, 30))
  }, [])

  // Main face detection function (following reference pattern)
  const onPlay = useCallback(async (videoEl: HTMLVideoElement) => {
    if (!videoEl.currentTime || videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded() || !showOverlay) {
      timeoutRef.current = setTimeout(() => onPlay(videoEl), 100)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      timeoutRef.current = setTimeout(() => onPlay(videoEl), 100)
      return
    }

    try {
      setIsDetecting(true)
      const faceapi = (window as any).faceapi
      const options = getFaceDetectorOptions()
      
      if (!faceapi || !options) {
        timeoutRef.current = setTimeout(() => onPlay(videoEl), 100)
        return
      }

      const ts = Date.now()

      // Detect faces with selected models (following reference pattern)
      let task = faceapi.detectAllFaces(videoEl, options)
      
      // Add landmarks if available and selected
      if (isCapabilityAvailable('landmarks')) {
        task = task.withFaceLandmarks()
      }
      
      // Add recognition if available and selected
      if (isCapabilityAvailable('recognition')) {
        task = task.withFaceDescriptors()
      }
      
      // Add analysis if available and selected
      if (isCapabilityAvailable('analysis')) {
        const selectedAnalysisModel = getSelectedModelForCapability('analysis')
        if (selectedAnalysisModel === 'face_expression') {
          task = task.withFaceExpressions()
        }
        if (selectedAnalysisModel === 'age_gender' || (selectedAnalysisModel === 'face_expression' && isCapabilityAvailable('analysis'))) {
          task = task.withAgeAndGender()
        }
      }
      
      const results = await task

      updateTimeStats(Date.now() - ts)

      // Match canvas dimensions to video (exactly like reference)
      const dims = faceapi.matchDimensions(canvas, videoEl, true)
      
      // Clear canvas
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }

      // Resize results to match canvas dimensions (like reference)
      const resizedResults = faceapi.resizeResults(results, dims)
      
      // Draw detections using face-api.js built-in functions (like reference)
      if (resizedResults.length > 0) {
        // Always draw face detections
        faceapi.draw.drawDetections(canvas, resizedResults)
        
        // Draw landmarks if available
        if (isCapabilityAvailable('landmarks') && resizedResults[0].landmarks) {
          faceapi.draw.drawFaceLandmarks(canvas, resizedResults)
        }
        
        // Customize drawing based on highlighted face
        if (highlightedFace) {
          // Highlight specific face if needed
          const highlightIndex = parseInt(highlightedFace.faceIndex.toString())
          if (resizedResults[highlightIndex]) {
            const detection = resizedResults[highlightIndex]
            const ctx = canvas.getContext('2d')
            if (ctx) {
              const box = detection.detection.box
              ctx.strokeStyle = '#ff4444'
              ctx.lineWidth = 4
              ctx.strokeRect(box.x, box.y, box.width, box.height)
            }
          }
        }

        // Add custom overlay for identified vs unidentified faces and analysis results
        const ctx = canvas.getContext('2d')
        if (ctx) {
          resizedResults.forEach((detection: any, index: number) => {
            const box = detection.detection.box
            
            // Check if this face is identified (you can customize this logic)
            const isIdentified = false // TODO: Check against known characters
            
            // Draw colored border for identification status
            ctx.strokeStyle = isIdentified ? '#4444ff' : '#ffaa00'
            ctx.lineWidth = 2
            ctx.strokeRect(box.x, box.y, box.width, box.height)
            
            // Prepare labels to display
            const labels: string[] = []
            
            // Always show confidence
            const confidence = Math.round(detection.detection.score * 100)
            labels.push(`${confidence}%`)
            
            // Add expression if available
            if (isCapabilityAvailable('analysis') && detection.expressions) {
              const topExpression = detection.expressions.asSortedArray()[0]
              if (topExpression) {
                labels.push(`${topExpression.expression} (${Math.round(topExpression.probability * 100)}%)`)
              }
            }
            
            // Add age and gender if available
            if (isCapabilityAvailable('analysis')) {
              if (detection.age) {
                labels.push(`Age: ${Math.round(detection.age)}`)
              }
              if (detection.gender) {
                labels.push(`${detection.gender} (${Math.round(detection.genderProbability * 100)}%)`)
              }
            }
            
            // Draw labels
            const labelHeight = 20
            const totalHeight = labels.length * labelHeight
            
            labels.forEach((label, labelIndex) => {
              const yOffset = box.y - totalHeight + (labelIndex * labelHeight)
              const labelWidth = ctx.measureText(label).width + 10
              
              // Draw background
              ctx.fillStyle = isIdentified ? '#4444ff' : '#ffaa00'
              ctx.fillRect(box.x, yOffset, labelWidth, labelHeight)
              
              // Draw text
              ctx.fillStyle = 'white'
              ctx.font = '12px sans-serif'
              ctx.fillText(label, box.x + 5, yOffset + 15)
            })
          })
        }
      }

    } catch (error) {
      console.error('Face detection error:', error)
    } finally {
      setIsDetecting(false)
    }

    // Continue the loop (like reference implementation)
    timeoutRef.current = setTimeout(() => onPlay(videoEl), 100)
  }, [showOverlay, isFaceDetectionModelLoaded, getFaceDetectorOptions, updateTimeStats, highlightedFace])

  // Start/stop detection loop
  useEffect(() => {
    if (!showOverlay || !videoRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    const video = videoRef.current
    onPlay(video)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [showOverlay, onPlay])

  // Resize canvas when video dimensions change
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas) return
    
    const updateCanvasSize = () => {
      if (video && canvas) {
        const faceapi = (window as any).faceapi
        if (faceapi) {
          faceapi.matchDimensions(canvas, video, true)
        }
      }
    }
    
    updateCanvasSize()
    
    const resizeObserver = new ResizeObserver(updateCanvasSize)
    resizeObserver.observe(video)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [videoRef])
  
  if (!showOverlay) return null
  
  return (
    <>
      {/* Canvas overlay for real-time detection */}
      <canvas
        ref={canvasRef}
        id="overlay"
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      
      {/* Static overlay for captured frame data */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {(() => {
          // Find recent capture for static overlay
          const recentCapture = captureShots
            .filter((shot: any) => Math.abs(shot.timestamp - currentTime) < 1)
            .sort((a: any, b: any) => Math.abs(a.timestamp - currentTime) - Math.abs(b.timestamp - currentTime))[0]
          
          if (!recentCapture?.detections?.length) return null
          
          return (
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span>{recentCapture.detections.length} face{recentCapture.detections.length !== 1 ? 's' : ''} detected</span>
                </div>
                
                {/* Model Status */}
                <div className="text-xs text-gray-300 space-y-0.5">
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-400">Detection:</span>
                    <span>{getSelectedModelForCapability('detection') || 'None'}</span>
                  </div>
                  {isCapabilityAvailable('landmarks') && (
                    <div className="flex items-center space-x-1">
                      <span className="text-green-400">Landmarks:</span>
                      <span>✓</span>
                    </div>
                  )}
                  {isCapabilityAvailable('analysis') && (
                    <div className="flex items-center space-x-1">
                      <span className="text-purple-400">Analysis:</span>
                      <span>✓</span>
                    </div>
                  )}
                </div>
                
                {(() => {
                  const identified = recentCapture.detections.filter((d: any) => d.character || d.identified).length
                  const unidentified = recentCapture.detections.length - identified
                  return (
                    <div className="text-xs text-gray-300 space-y-0.5 border-t border-gray-600 pt-1">
                      {identified > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>{identified} identified</span>
                        </div>
                      )}
                      {unidentified > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                          <span>{unidentified} unknown</span>
                        </div>
                      )}
                      {highlightedFace && (
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                          <span>highlighted</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })()}
      </div>
    </>
  )
}

export function UnifiedInterface() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { hasInitialized } = useAssetsStore()
  const { 
    videoFile, 
    videoUrl,
    currentTime, 
    duration, 
    isPlaying, 
    volume,
    currentFrameNumber,
    totalFrames,
    frameRate,
    showFrameInfo,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setVideoFile,
    setFrameRate,
    setTotalFrames,
    nextFrame,
    previousFrame,
    setShowFrameInfo,
    error: videoError
  } = useVideoStore()
  
  const { 
    captureShots,
    addCaptureAndProcess,
    modelsLoaded,
    loadingProgress,
    error,
    isProcessing,
    loadFaceApiModels,
    getCaptureById 
  } = useFaceDetectionStore()

  // State machine for view management
  const [viewState, setViewState] = useState<ViewState>('initializing')
  const [isDragOver, setIsDragOver] = useState(false)
  const [modelLoadStartTime, setModelLoadStartTime] = useState<number | null>(null)
  const [showFaceOverlay, setShowFaceOverlay] = useState(false)
  const [highlightedFace, setHighlightedFace] = useState<{ shotId: string; faceIndex: number } | null>(null)
  const [showModelPanel, setShowModelPanel] = useState(false)
  const [activeLeftTab, setActiveLeftTab] = useState<'characters' | 'groups'>('characters')

  // Smart overlay logic - show unidentified faces by default
  useEffect(() => {
    if (captureShots.length > 0) {
      // Check if we have any identified faces/characters
      const hasIdentifiedFaces = captureShots.some((shot: any) => 
        shot.detections?.some((detection: any) => detection.character || detection.identified)
      )
      
      // Show overlay for unidentified faces, hide if faces are identified
      setShowFaceOverlay(!hasIdentifiedFaces)
    }
  }, [captureShots])

  // Auto-load models when component mounts
  useEffect(() => {
    if (hasInitialized && !modelsLoaded && viewState === 'initializing') {
      setModelLoadStartTime(Date.now())
      loadFaceApiModels()
    }
  }, [hasInitialized, modelsLoaded, loadFaceApiModels, viewState])

  // State machine transitions
  useEffect(() => {
    const handleStateTransitions = async () => {
      switch (viewState) {
        case 'initializing':
          if (hasInitialized && modelsLoaded) {
            // Calculate minimum delay
            const loadTime = modelLoadStartTime ? Date.now() - modelLoadStartTime : 0
            const minDelay = Math.max(1200 - loadTime, 0) // Ensure at least 1.2s total
            
            setViewState('models-ready')
            
            // Transition to upload-ready after showing models-ready state
            setTimeout(() => {
              setViewState('upload-ready')
            }, Math.max(minDelay, 800)) // Show models-ready for at least 800ms
          }
          break

        case 'upload-ready':
          if (videoFile) {
            setViewState('video-ready')
          }
          break

        case 'uploading':
          if (videoFile) {
            setViewState('video-ready')
          }
          break

        case 'video-ready':
          if (!videoFile) {
            setViewState('upload-ready')
          }
          break
      }
    }

    handleStateTransitions()
  }, [viewState, hasInitialized, modelsLoaded, videoFile, modelLoadStartTime])

  // Sync video time and handle buffer connection
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.1) {
      videoRef.current.currentTime = currentTime
    }
  }, [currentTime])

  // Reset frame tracking when video changes
  useEffect(() => {
    if (videoFile) {
      // Reset frame info when new video loads
      setShowFrameInfo(false)
    }
  }, [videoFile, setShowFrameInfo])

  // Video handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration
      useVideoStore.getState().setDuration(duration)
      
      // Calculate frame rate and total frames
      const video = videoRef.current
      if (video.videoWidth && video.videoHeight) {
        // Try to get actual frame rate, fallback to 30 FPS
        const estimatedFrameRate = 30 // Most videos are 30fps, could be enhanced
        setFrameRate(estimatedFrameRate)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      useVideoStore.getState().setCurrentTime(time)
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false)
      videoRef.current?.pause()
    } else {
      setIsPlaying(true)
      videoRef.current?.play()
    }
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const handleNextFrame = () => {
    if (videoRef.current) {
      nextFrame()
      // Sync video element with store
      if (videoRef.current.currentTime !== currentTime) {
        videoRef.current.currentTime = currentTime
      }
    }
  }

  const handlePreviousFrame = () => {
    if (videoRef.current) {
      previousFrame()
      // Sync video element with store
      if (videoRef.current.currentTime !== currentTime) {
        videoRef.current.currentTime = currentTime
      }
    }
  }

  const handleCaptureFrame = async () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

    try {
      await addCaptureAndProcess({
        timestamp: video.currentTime,
        dataUrl,
        width: canvas.width,
        height: canvas.height
      })
    } catch (error) {
      console.error('Error capturing and processing frame:', error)
    }
  }

  // File upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (viewState === 'upload-ready') {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (viewState !== 'upload-ready') return
    
    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find(file => file.type.startsWith('video/'))
    
    if (videoFile) {
      setViewState('uploading')
      
      // Smooth transition timing
      setTimeout(() => {
        setVideoFile(videoFile)
        // State will automatically transition to 'video-ready' via useEffect
      }, 1200)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/') && viewState === 'upload-ready') {
      setViewState('uploading')
      
      // Smooth transition timing
      setTimeout(() => {
        setVideoFile(file)
        // State will automatically transition to 'video-ready' via useEffect
      }, 1200)
    }
  }

  const handleClick = () => {
    if (viewState === 'upload-ready') {
      fileInputRef.current?.click()
    }
  }

  const handleUseDemoVideo = async () => {
    if (viewState !== 'upload-ready') return
    
    setViewState('uploading')
    
    try {
      // Fetch the demo video file
      const response = await fetch('/spaceballs_the_movie.mp4')
      const blob = await response.blob()
      
      // Create a File object from the blob
      const demoFile = new File([blob], 'spaceballs_the_movie.mp4', {
        type: 'video/mp4',
        lastModified: Date.now()
      })
      
      // Smooth transition timing
      setTimeout(() => {
        setVideoFile(demoFile)
        // State will automatically transition to 'video-ready' via useEffect
      }, 1200)
    } catch (error) {
      console.error('Error loading demo video:', error)
      setViewState('upload-ready')
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeekToTime = (timestamp: number) => {
    handleSeek(timestamp)
  }

  const handleReloadModels = async () => {
    const { reloadFaceApiModels } = useFaceDetectionStore.getState()
    await reloadFaceApiModels()
  }

  // Render center panel content based on state machine
  const renderCenterContent = () => {
    switch (viewState) {
      case 'initializing':
        return (
          <div className="flex items-center justify-center h-full bg-black transition-all duration-700 ease-in-out">
            <div className="text-center space-y-6 opacity-0" style={{ animation: 'fadeIn 1s ease-in-out 0.3s forwards' }}>
              <div className="text-6xl animate-pulse">🎭</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">FaceCooked</h2>
                <p className="text-gray-300">Loading AI models...</p>
              </div>
              <AssetLoader />
            </div>
          </div>
        )

      case 'models-ready':
        return (
          <div className="flex items-center justify-center h-full bg-black transition-all duration-700 ease-in-out">
            <div className="text-center space-y-6 opacity-0" style={{ animation: 'fadeIn 0.6s ease-in-out forwards' }}>
              <div className="text-6xl" style={{ animation: 'pulse 1.2s ease-in-out infinite' }}>✨</div>
              <h3 className="text-xl font-semibold text-white">AI Models Ready</h3>
              <p className="text-gray-300">Preparing interface...</p>
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'uploading':
        return (
          <div className="flex items-center justify-center h-full bg-black transition-all duration-700 ease-in-out">
            <div className="text-center space-y-6 opacity-0" style={{ animation: 'fadeIn 0.5s ease-in-out forwards' }}>
              <div className="text-4xl animate-pulse">⏳</div>
              <h3 className="text-xl font-semibold text-white">Processing Video...</h3>
              <p className="text-gray-300">Getting everything ready for analysis</p>
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'upload-ready':
        return (
          <div className="flex items-center justify-center h-full bg-black p-8 transition-all duration-700 ease-in-out">
            <div className="w-full max-w-2xl">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-500 ${
                  isDragOver
                    ? 'border-gray-400 bg-gray-500/20 scale-105'
                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800/50 backdrop-blur-sm'
                }`}
              >
                <div className="space-y-6">
                  <div className="text-6xl animate-bounce">🎬</div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Drop your video here
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Upload your own video or try our demo to get started
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-center gap-4">
                      <div className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Choose Video File</span>
                      </div>
                      <button
                        onClick={handleUseDemoVideo}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Use Demo Video</span>
                      </button>
                    </div>

                    <div className="text-sm text-gray-400 space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <span>📏 Max size: 20MB</span>
                        <span>•</span>
                        <span>🎬 Demo: Spaceballs clip</span>
                        <span>•</span>
                        <span>🎭 AI-powered analysis</span>
                      </div>
                      
                      <div className="flex items-center justify-center space-x-1 flex-wrap">
                        <span>Supported:</span>
                        {['MP4', 'WebM', 'MOV', 'AVI', 'MKV'].map((format) => (
                          <span key={format} className="px-2 py-1 bg-gray-900 text-gray-300 rounded text-xs">
                            {format}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {videoError && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Upload Error</span>
                  </div>
                  <p className="text-red-300 text-sm mt-1">{videoError}</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'video-ready':
        return (
          <div className="relative w-full h-full flex flex-col bg-black transition-all duration-700 ease-in-out">
            {/* Video Container */}
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                id="inputVideo"
                src={videoUrl}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              
              {/* Face Detection Overlay */}
              <FaceOverlay 
                videoRef={videoRef}
                showOverlay={showFaceOverlay}
                currentTime={currentTime}
                highlightedFace={highlightedFace}
              />
              
              {/* Face Overlay Toggle - Corner Icon */}
              <button
                onClick={() => setShowFaceOverlay(!showFaceOverlay)}
                className={`absolute top-4 left-4 w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center backdrop-blur-md border z-10 ${
                  showFaceOverlay
                    ? 'bg-green-600/90 hover:bg-green-700/90 text-white border-green-500/30 shadow-lg'
                    : 'bg-black/60 hover:bg-black/80 text-gray-300 border-gray-600/30'
                }`}
                title={showFaceOverlay ? 'Hide face detection' : 'Show face detection'}
              >
                {showFaceOverlay ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>

              {/* Frame Count Display */}
              {showFrameInfo && (
                <div className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 z-10 transition-all duration-200">
                  <div className="text-sm font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">Frame:</span>
                      <span className="font-medium">{currentFrameNumber.toLocaleString()}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-300">{totalFrames.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {frameRate}fps • {formatTime(currentTime)}
                    </div>
                  </div>
                </div>
              )}

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <div className="space-y-4">
                  {/* Timeline */}
                  <div className="flex items-center space-x-4">
                    <span className="text-white text-sm font-mono min-w-[3rem]">
                      {formatTime(currentTime)}
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => handleSeek(Number(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer 
                                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                   [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                    </div>
                    <span className="text-white text-sm font-mono min-w-[3rem]">
                      {formatTime(duration)}
                    </span>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Previous Frame */}
                      <button
                        onClick={handlePreviousFrame}
                        disabled={currentFrameNumber <= 0}
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors border border-white/20"
                        title="Previous frame"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      {/* Play/Pause */}
                      <button
                        onClick={handlePlayPause}
                        className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors border border-white/20"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </button>

                      {/* Next Frame */}
                      <button
                        onClick={handleNextFrame}
                        disabled={currentFrameNumber >= totalFrames - 1}
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors border border-white/20"
                        title="Next frame"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      {/* Volume */}
                      <div className="flex items-center space-x-2">
                        <Volume2 className="w-4 h-4 text-white" />
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.1}
                          value={volume}
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className="w-20 h-1 bg-white/20 rounded appearance-none cursor-pointer
                                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                                     [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                      </div>
                    </div>

                                        {/* Capture Button */}
                    <button
                      onClick={handleCaptureFrame}
                      disabled={!modelsLoaded || isProcessing}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 backdrop-blur-sm border ${
                        modelsLoaded && !isProcessing
                          ? 'bg-gray-900/90 hover:bg-gray-800/90 text-white border-gray-700/20'
                          : 'bg-gray-800/90 text-gray-300 cursor-not-allowed border-gray-700/20'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          <span>Capture & Detect</span>
                        </>
                      )}
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                        {captureShots.length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Render left panel content based on state machine
  const renderLeftContent = () => {
    if (viewState === 'initializing' || viewState === 'models-ready') {
      return (
        <div className="h-full overflow-y-auto p-6 bg-gray-950 transition-all duration-500 ease-in-out">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">🎭</div>
                <div>
                  <h1 className="text-2xl font-bold text-white">FaceCooked</h1>
                  <p className="text-sm text-gray-400">AI-Powered Video Analysis</p>
                </div>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">
                Analyze Videos with AI-Powered Face Detection
              </h2>
              <p className="text-sm text-gray-300">
                Upload your videos for comprehensive analysis including face detection, speaker identification, 
                and timeline-based insights.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Features</span>
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">👥</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Speaker Detection</h4>
                      <p className="text-xs text-gray-400">
                        Automatically identify and track speakers with confidence scoring.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">📸</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Smart Frame Capture</h4>
                      <p className="text-xs text-gray-400">
                        Capture and analyze moments with automatic face detection.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">🤖</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">AI Recognition</h4>
                      <p className="text-xs text-gray-400">
                        Advanced facial recognition and expression analysis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t border-gray-600 pt-4">
              <div className="text-xs text-gray-400 space-y-1">
                <div>Status: {viewState === 'initializing' ? '⏳ Loading...' : '✅ Ready'}</div>
                {viewState === 'initializing' && (
                  <div>AI Models: Loading {Math.round(loadingProgress)}%</div>
                )}
                {['models-ready', 'upload-ready', 'video-ready'].includes(viewState) && (
                  <div>AI Models: ✅ Ready</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (viewState === 'upload-ready') {
      return (
        <div className="h-full overflow-y-auto p-6 bg-gray-950 transition-all duration-500 ease-in-out">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">🎭</div>
                <div>
                  <h1 className="text-2xl font-bold text-white">FaceCooked</h1>
                  <p className="text-sm text-gray-400">Ready for Video Analysis</p>
                </div>
              </div>
            </div>

            {/* Upload Status */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">AI Models Ready</span>
              </div>
              
              <p className="text-sm text-gray-300">
                All AI models are loaded and ready. Upload a video to start analyzing faces, expressions, and speakers.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Features</span>
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">👥</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Speaker Detection</h4>
                      <p className="text-xs text-gray-400">
                        Automatically identify and track speakers with confidence scoring.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">📸</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Smart Frame Capture</h4>
                      <p className="text-xs text-gray-400">
                        Capture and analyze moments with automatic face detection.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">🤖</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">AI Recognition</h4>
                      <p className="text-xs text-gray-400">
                        Advanced facial recognition and expression analysis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Video analysis mode - show tabbed interface with character panel and face grouping
    return (
      <div className="h-full bg-gray-950 transition-all duration-500 ease-in-out flex flex-col">
        {/* Header with tabs */}
        <div className="border-b border-gray-600">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Face Management</h2>
            </div>
            {/* Model Loading Status */}
            {!modelsLoaded && (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-300">
                  Loading AI models ({Math.round(loadingProgress)}%)
                </span>
              </div>
            )}
            {modelsLoaded && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowModelPanel(!showModelPanel)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Open AI Model Settings"
                >
                  <Brain className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300">Models ready</span>
                  <Settings className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  onClick={handleReloadModels}
                  className="flex items-center space-x-1 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-300"
                  title="Reload AI Models"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            )}
            {error && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-300">Error loading</span>
                </div>
                <button
                  onClick={handleReloadModels}
                  className="flex items-center space-x-1 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-300"
                  title="Retry loading models"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          

        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeLeftTab === 'characters' ? (
            <CharacterPanel onSeekToTime={handleSeekToTime} />
          ) : (
            <FaceGroupingPanel onSeekToTime={handleSeekToTime} />
          )}
        </div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen w-full bg-black">
        <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Marketing/Characters */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-gray-950">
          {renderLeftContent()}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center Panel - Video/Dropzone */}
        <ResizablePanel defaultSize={50} minSize={30}>
          {renderCenterContent()}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Captured Frames */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-gray-950">
          <div className="h-full overflow-y-auto transition-all duration-500 ease-in-out">

            
            {viewState === 'video-ready' ? (
              <FrameCaptureStack 
                onSeekToTime={handleSeekToTime}
                onFaceClick={(shotId: string, faceIndex: number) => {
                  const shot = captureShots.find((s: any) => s.id === shotId)
                  if (shot) {
                    handleSeekToTime(shot.timestamp)
                    setHighlightedFace({ shotId, faceIndex })
                    // Clear highlight after 3 seconds
                    setTimeout(() => setHighlightedFace(null), 3000)
                  }
                }}
              />
            ) : (
              <div className="p-6 text-center text-gray-400">
                <div className="space-y-3">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-300">Frame Analysis</p>
                    <p className="text-xs text-gray-500">
                      {['initializing', 'models-ready'].includes(viewState)
                        ? 'Loading AI models...' 
                        : 'Upload a video to start capturing frames'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* API Test Panel */}
      <ApiTestPanel />
      
      {/* Model Selection Panel */}
      <ModelSelectionPanel 
        isOpen={showModelPanel}
        onToggle={() => setShowModelPanel(!showModelPanel)}
      />
    </div>
    </DndProvider>
  )
} 