import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { VideoFrame } from '../../types'

export interface VideoState {
  // Video file management
  videoFile: File | null
  videoUrl: string | null
  isVideoLoaded: boolean
  
  // Playback controls
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  
  // Frame tracking
  currentFrameNumber: number
  totalFrames: number
  frameRate: number
  showFrameInfo: boolean
  isNavigatingFrames: boolean // Flag to prevent auto-calculation during manual navigation
  
  // Frame capture
  capturedFrames: VideoFrame[]
  currentFrame: VideoFrame | null
  
  // Loading states
  isUploading: boolean
  uploadProgress: number
  
  // Error handling
  error: string | null
  
  // Actions
  setVideoFile: (file: File | null) => void
  setVideoUrl: (url: string | null) => void
  setIsVideoLoaded: (loaded: boolean) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  
  // Frame tracking actions
  setFrameRate: (frameRate: number) => void
  setTotalFrames: (totalFrames: number) => void
  setCurrentFrameNumber: (frameNumber: number) => void
  setShowFrameInfo: (show: boolean) => void
  setIsNavigatingFrames: (navigating: boolean) => void
  nextFrame: () => void
  previousFrame: () => void
  seekToFrame: (frameNumber: number) => void
  calculateFrameFromTime: (time: number) => number
  calculateTimeFromFrame: (frameNumber: number) => number
  
  captureFrame: (timestamp: number, dataUrl: string, blob?: Blob) => void
  setCurrentFrame: (frame: VideoFrame | null) => void
  removeFrame: (timestamp: number) => void
  clearFrames: () => void
  setUploading: (uploading: boolean, progress?: number) => void
  setError: (error: string | null) => void
  resetVideo: () => void
  
  // Utility methods
  formatTime: (seconds: number) => string
  getProgress: () => number
}

const MAX_VIDEO_SIZE = 20 * 1024 * 1024 // 20MB limit as per requirements

export const useVideoStore = create<VideoState>()(
  devtools(
    (set, get) => ({
      // Initial state
      videoFile: null,
      videoUrl: null,
      isVideoLoaded: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      
      // Frame tracking state
      currentFrameNumber: 0,
      totalFrames: 0,
      frameRate: 30, // Default to 30 FPS
      showFrameInfo: false,
      isNavigatingFrames: false,
      
      capturedFrames: [],
      currentFrame: null,
      isUploading: false,
      uploadProgress: 0,
      error: null,

      // Actions
      setVideoFile: (file) => {
        if (file && file.size > MAX_VIDEO_SIZE) {
          set({ 
            error: `File size too large. Maximum size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB for this demo.`,
            videoFile: null,
            videoUrl: null 
          })
          return
        }
        
        const url = file ? URL.createObjectURL(file) : null
        set({ 
          videoFile: file, 
          videoUrl: url,
          error: null,
          isVideoLoaded: false,
          currentTime: 0,
          duration: 0,
          // Reset frame tracking
          currentFrameNumber: 0,
          totalFrames: 0,
          frameRate: 30,
          showFrameInfo: false,
          isNavigatingFrames: false,
          capturedFrames: [],
          currentFrame: null,
          isPlaying: false
        })
      },

      setVideoUrl: (url) => set({ videoUrl: url }),
      
      setIsVideoLoaded: (loaded) => set({ isVideoLoaded: loaded }),
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      setCurrentTime: (time) => {
        const clampedTime = Math.max(0, time)
        const { frameRate, isNavigatingFrames } = get()
        
        // Only auto-calculate frame number if we're not manually navigating
        if (!isNavigatingFrames) {
          const frameNumber = Math.floor(clampedTime * frameRate)
          set({ 
            currentTime: clampedTime,
            currentFrameNumber: frameNumber
          })
        } else {
          // Just update time, keep existing frame number
          set({ currentTime: clampedTime })
        }
      },
      
      setDuration: (duration) => set({ duration: Math.max(0, duration) }),
      
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      
      // Frame tracking actions
      setFrameRate: (frameRate) => {
        const { duration } = get()
        const totalFrames = duration > 0 ? Math.floor(duration * frameRate) : 0
        set({ frameRate, totalFrames })
      },
      
      setTotalFrames: (totalFrames) => set({ totalFrames }),
      
      setCurrentFrameNumber: (frameNumber) => {
        const { frameRate, totalFrames } = get()
        const clampedFrame = Math.max(0, Math.min(frameNumber, totalFrames - 1))
        const time = clampedFrame / frameRate
        set({ 
          currentFrameNumber: clampedFrame,
          currentTime: time
        })
      },
      
      setShowFrameInfo: (show) => set({ showFrameInfo: show }),
      
      setIsNavigatingFrames: (navigating) => set({ isNavigatingFrames: navigating }),
      
      nextFrame: () => {
        const { currentFrameNumber, totalFrames, frameRate } = get()
        if (currentFrameNumber < totalFrames - 1) {
          const nextFrame = currentFrameNumber + 1
          const time = nextFrame / frameRate
          set({ 
            currentFrameNumber: nextFrame,
            currentTime: time,
            showFrameInfo: true,
            isNavigatingFrames: true
          })
          // Clear navigation flag after a short delay to allow video element to sync
          setTimeout(() => {
            set({ isNavigatingFrames: false })
          }, 100)
          // Auto-hide frame info after 2 seconds
          setTimeout(() => {
            set({ showFrameInfo: false })
          }, 2000)
        }
      },
      
      previousFrame: () => {
        const { currentFrameNumber, frameRate } = get()
        if (currentFrameNumber > 0) {
          const prevFrame = currentFrameNumber - 1
          const time = prevFrame / frameRate
          set({ 
            currentFrameNumber: prevFrame,
            currentTime: time,
            showFrameInfo: true,
            isNavigatingFrames: true
          })
          // Clear navigation flag after a short delay to allow video element to sync
          setTimeout(() => {
            set({ isNavigatingFrames: false })
          }, 100)
          // Auto-hide frame info after 2 seconds
          setTimeout(() => {
            set({ showFrameInfo: false })
          }, 2000)
        }
      },
      
      seekToFrame: (frameNumber) => {
        const { frameRate, totalFrames } = get()
        const clampedFrame = Math.max(0, Math.min(frameNumber, totalFrames - 1))
        const time = clampedFrame / frameRate
        set({ 
          currentFrameNumber: clampedFrame,
          currentTime: time,
          isNavigatingFrames: true
        })
        // Clear navigation flag after a short delay to allow video element to sync
        setTimeout(() => {
          set({ isNavigatingFrames: false })
        }, 100)
      },
      
      calculateFrameFromTime: (time) => {
        const { frameRate } = get()
        return Math.floor(time * frameRate)
      },
      
      calculateTimeFromFrame: (frameNumber) => {
        const { frameRate } = get()
        return frameNumber / frameRate
      },
      
      captureFrame: (timestamp, dataUrl, blob) => {
        const frame: VideoFrame = { timestamp, dataUrl, blob }
        set((state) => ({
          capturedFrames: [...state.capturedFrames, frame],
          currentFrame: frame
        }))
      },
      
      setCurrentFrame: (frame) => set({ currentFrame: frame }),
      
      removeFrame: (timestamp) => {
        set((state) => ({
          capturedFrames: state.capturedFrames.filter(frame => frame.timestamp !== timestamp),
          currentFrame: state.currentFrame?.timestamp === timestamp ? null : state.currentFrame
        }))
      },
      
      clearFrames: () => set({ capturedFrames: [], currentFrame: null }),
      
      setUploading: (uploading, progress = 0) => {
        set({ isUploading: uploading, uploadProgress: progress })
      },
      
      setError: (error) => set({ error }),
      
      resetVideo: () => {
        const { videoUrl } = get()
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl)
        }
        set({
          videoFile: null,
          videoUrl: null,
          isVideoLoaded: false,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          // Reset frame tracking
          currentFrameNumber: 0,
          totalFrames: 0,
          frameRate: 30,
          showFrameInfo: false,
          isNavigatingFrames: false,
          capturedFrames: [],
          currentFrame: null,
          isUploading: false,
          uploadProgress: 0,
          error: null
        })
      },

      // Utility methods
      formatTime: (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
      },

      getProgress: () => {
        const { currentTime, duration } = get()
        return duration > 0 ? (currentTime / duration) * 100 : 0
      }
    }),
    {
      name: 'video-store'
    }
  )
) 