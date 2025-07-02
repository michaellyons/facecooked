'use client'

import { useVideoStore } from '../stores'
import { useState, useCallback, useRef } from 'react'
import { VideoAnalysisInterface } from './VideoAnalysisInterface'

export function VideoDropzone() {
  const { setVideoFile, videoFile, videoUrl, error } = useVideoStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find(file => file.type.startsWith('video/'))
    
    if (videoFile) {
      setIsUploading(true)
      // Add a small delay for smooth UX
      setTimeout(() => {
        setVideoFile(videoFile)
        setIsUploading(false)
      }, 800)
    }
  }, [setVideoFile])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setIsUploading(true)
      // Add a small delay for smooth UX
      setTimeout(() => {
        setVideoFile(file)
        setIsUploading(false)
      }, 800)
    }
  }, [setVideoFile])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])


  const getSupportedFormats = () => [
    'MP4', 'WebM', 'MOV', 'AVI', 'MKV'
  ]

  // Show the full analysis interface when video is loaded
  if (videoFile && videoUrl) {
    return <VideoAnalysisInterface />
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
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
        className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 scale-105'
            : isUploading
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="text-4xl animate-pulse">⏳</div>
            <h3 className="text-xl font-semibold text-gray-900">Processing Video...</h3>
            <p className="text-gray-600">Please wait while we prepare your video for analysis.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-6xl animate-bounce">🎬</div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Drop your video here
              </h3>
              <p className="text-gray-600 mb-4">
                Or click to browse and select a video file
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  📁 Choose Video File
                </div>
              </div>

              <div className="text-sm text-gray-500 space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span>📏 Max size: 20MB</span>
                  <span>•</span>
                  <span>🎭 AI-powered analysis</span>
                </div>
                
                <div className="flex items-center justify-center space-x-1">
                  <span>Supported formats:</span>
                  {getSupportedFormats().map((format) => (
                    <span key={format} className="px-2 py-1 bg-gray-200 rounded text-xs">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="border-t pt-6 mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Video Analysis Features:</p>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Face detection & tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>👥</span>
                  <span>Speaker identification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📝</span>
                  <span>Timeline transcription</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📸</span>
                  <span>Frame capture & analysis</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <span>⚠️</span>
            <span className="font-medium">Upload Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Upload Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips for best results:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use videos with clear, well-lit faces</li>
          <li>• Multiple speakers will be automatically detected</li>
          <li>• Higher resolution videos provide better face tracking</li>
          <li>• Video will be transcribed and synchronized with faces</li>
        </ul>
      </div>
    </div>
  )
} 