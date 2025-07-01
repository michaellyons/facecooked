'use client'

import { useRef, useEffect, useState } from 'react'
import { useVideoStore, useFaceDetectionStore } from '../stores'
import { FrameCaptureStack } from './FrameCaptureStack'
import { CharacterPanel } from './CharacterPanel'
import { DetectedFacesList } from './DetectedFacesList'
import { ApiTestPanel } from './ApiTestPanel'
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from './ui/resizable'
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
  SkipForward,
  SkipBack
} from 'lucide-react'

export function VideoAnalysisInterface() {
  const videoRef = useRef<HTMLVideoElement>(null)
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
    setFrameRate,
    nextFrame,
    previousFrame
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

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [leftPanelView, setLeftPanelView] = useState<'characters' | 'faces'>('characters')

  // Auto-load models when component mounts
  useEffect(() => {
    if (!modelsLoaded) {
      loadFaceApiModels()
    }
  }, [modelsLoaded, loadFaceApiModels])

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
      useVideoStore.getState().setShowFrameInfo(false)
    }
  }, [videoFile])

  // Handle video loading
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

  // Handle video time updates
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

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

    // Add capture shot and automatically process for face detection
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

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeekToTime = (timestamp: number) => {
    handleSeek(timestamp)
  }

  if (!videoFile || !videoUrl) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No video loaded</p>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-gray-950">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Characters & Cast */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-gray-950">
          <div className="h-full overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                {leftPanelView === 'characters' ? (
                  <Users className="w-5 h-5 text-gray-400" />
                ) : (
                  <Users className="w-5 h-5 text-gray-400" />
                )}
                <h2 className="text-lg font-semibold text-white">
                  {leftPanelView === 'characters' ? 'Characters' : 'Detected Faces'}
                </h2>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setLeftPanelView('characters')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      leftPanelView === 'characters'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Characters
                  </button>
                  <button
                    onClick={() => setLeftPanelView('faces')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      leftPanelView === 'faces'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    All Faces
                  </button>
                </div>
                
                {/* Model Loading Status */}
                {!modelsLoaded && (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-sm text-gray-400">
                      Loading AI models ({Math.round(loadingProgress)}%)
                    </span>
                  </div>
                )}
                {modelsLoaded && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">Models ready</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">Error loading</span>
                  </div>
                )}
              </div>
            </div>
            
            {leftPanelView === 'characters' ? (
              <CharacterPanel onSeekToTime={handleSeekToTime} />
            ) : (
              <DetectedFacesList onSeekToTime={handleSeekToTime} />
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Video Area */}
        <ResizablePanel defaultSize={50} minSize={30} className="bg-black">
          <div className="relative w-full h-full flex flex-col">
            {/* Video Container */}
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

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
                          ? 'bg-blue-600/90 hover:bg-blue-700/90 text-white border-blue-500/20'
                          : 'bg-gray-600/90 text-gray-300 cursor-not-allowed border-gray-500/20'
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
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Captured Frames */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-gray-950">
          <div className="h-full overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Captured Frames</h2>
                <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full text-sm font-medium">
                  {captureShots.length}
                </span>
              </div>
            </div>
            <FrameCaptureStack onSeekToTime={handleSeekToTime} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* API Test Panel */}
      <ApiTestPanel />
    </div>
  )
} 