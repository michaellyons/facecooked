# FaceCooked Store Architecture

This directory contains the Zustand-based state management system for the FaceCooked application. The store is designed with a modular architecture to handle different aspects of the face detection workflow.

## 📁 Structure

```
stores/
├── index.ts                 # Main exports and store utilities
├── modules/
│   ├── assets.ts           # Asset preloading and management
│   ├── video.ts            # Video upload and playback
│   └── faceDetection.ts    # Face-api.js integration and results
└── README.md               # This file
```

## 🏪 Store Modules

### 🎯 Assets Store (`useAssetsStore`)

Manages the preloading and caching of face-api.js models and other static assets.

**Key Features:**
- Preloads face-api.js model weights
- Tracks loading progress and status
- Handles asset failures and retries
- Provides loading utilities for different asset types

**Main Actions:**
- `loadAllAssets()` - Load all predefined assets
- `loadFaceApiModels(modelIds?)` - Load specific face-api.js models
- `loadAsset(asset)` - Load individual assets
- `resetAssets()` - Clear all loaded assets

**Usage:**
```tsx
import { useAssetsStore } from '@/stores'

function MyComponent() {
  const { 
    assets, 
    loadingProgress, 
    isLoading, 
    hasInitialized,
    loadAllAssets 
  } = useAssetsStore()

  const handleLoad = async () => {
    await loadAllAssets()
  }

  return (
    <div>
      <progress value={loadingProgress} max={100} />
      <button onClick={handleLoad}>Load Assets</button>
    </div>
  )
}
```

### 📹 Video Store (`useVideoStore`)

Handles video file management, playback controls, and frame capture.

**Key Features:**
- Video file upload with size validation (20MB limit)
- Playback state management
- Frame capture and storage
- Error handling for video operations

**Main Actions:**
- `setVideoFile(file)` - Upload and validate video file
- `setIsPlaying(playing)` - Control playback state
- `captureFrame(timestamp, dataUrl, blob?)` - Capture video frames
- `resetVideo()` - Clear video and cleanup resources

**Usage:**
```tsx
import { useVideoStore } from '@/stores'

function VideoPlayer() {
  const { 
    videoFile, 
    videoUrl, 
    isPlaying, 
    setVideoFile, 
    setIsPlaying 
  } = useVideoStore()

  const handleFileUpload = (file: File) => {
    setVideoFile(file)
  }

  return (
    <div>
      <input type="file" onChange={e => handleFileUpload(e.target.files?.[0])} />
      {videoUrl && (
        <video src={videoUrl} onPlay={() => setIsPlaying(true)} />
      )}
    </div>
  )
}
```

### 🎭 Face Detection Store (`useFaceDetectionStore`)

Manages face-api.js integration, detection results, and processing options.

**Key Features:**
- Track loaded face-api.js models
- Store detection results with rich metadata
- Configure detection options
- Handle detection errors

**Main Actions:**
- `setModelLoaded(modelName)` - Mark face-api model as loaded
- `setDetectedFaces(faces)` - Update detection results
- `addDetectedFace(face)` - Add single detection result
- `updateOptions(options)` - Configure detection parameters

**Usage:**
```tsx
import { useFaceDetectionStore } from '@/stores'

function FaceDetectionResults() {
  const { 
    detectedFaces, 
    isDetecting, 
    options,
    updateOptions 
  } = useFaceDetectionStore()

  const updateThreshold = (threshold: number) => {
    updateOptions({ scoreThreshold: threshold })
  }

  return (
    <div>
      <p>Detected {detectedFaces.length} faces</p>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.1"
        value={options.scoreThreshold}
        onChange={e => updateThreshold(parseFloat(e.target.value))}
      />
    </div>
  )
}
```

## 🚀 Store Initialization

The store system is automatically initialized when the app loads via the `StoreInitializer` component in the root layout.

```tsx
// In layout.tsx
import { StoreInitializer } from '@/components'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StoreInitializer>
          {children}
        </StoreInitializer>
      </body>
    </html>
  )
}
```

## 🛠️ Development Tools

Zustand DevTools are enabled in development mode for debugging and state inspection. Access them through your browser's developer tools.

## 🧪 Testing Store State

Use the `getAllStoreStates()` utility function for debugging:

```tsx
import { getAllStoreStates } from '@/stores'

// In browser console or debug component
console.log(getAllStoreStates())
```

## ⚡ Performance Notes

- Store selectors are optimized to prevent unnecessary re-renders
- Asset loading is performed asynchronously with progress tracking
- Video resources are properly cleaned up to prevent memory leaks
- Face detection results are batched for efficient updates

## 🔄 State Flow

```
1. App loads → StoreInitializer runs → Stores initialized
2. User clicks "Load Assets" → Assets store loads face-api models
3. User uploads video → Video store validates and processes file
4. User captures frame → Video store creates frame data
5. Frame processed → Face detection store receives results
6. Results displayed → UI updates via store subscriptions
```

## 📝 Adding New Stores

To add a new store module:

1. Create new file in `stores/modules/newStore.ts`
2. Export store from `stores/index.ts`
3. Add to `StoreState` type in index.ts
4. Update `getAllStoreStates()` function
5. Document usage patterns in this README 