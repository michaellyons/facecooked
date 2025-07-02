import { useAssetsStore } from './modules/assets'
import { useVideoStore } from './modules/video'
import { useFaceDetectionStore } from './modules/faceDetection'

// Export stores
export { useAssetsStore } from './modules/assets'
export { useVideoStore } from './modules/video'
export { useFaceDetectionStore } from './modules/faceDetection'

// Re-export shared types from centralized location
export type {
  DetectedFace,
  Character,
  CaptureShot,
  ProcessingOptions,
  VideoFrame,
  Asset,
  ModelGroup,
  ModelSelection,
  AssetType,
  ModelCapability,
  ViewState,
  ComponentWithSeekTime,
  ComponentWithFaceClick,
  ComponentWithFrameSelect,
  ApiResponse,
  DraggedFace,
  UIFaceGroup,
  DragState,
  Nullable,
  Optional,
  ID,
  Timestamp
} from '../types'

// Store initialization utility
export const initializeStores = () => {
  // Any global store initialization logic can go here
  console.log('🏪 Stores initialized')
}

// Type for all stores combined (useful for debugging)
export type StoreState = {
  assets: ReturnType<typeof useAssetsStore.getState>
  video: ReturnType<typeof useVideoStore.getState>
  faceDetection: ReturnType<typeof useFaceDetectionStore.getState>
}

// Get all store states (useful for debugging)
export const getAllStoreStates = (): StoreState => ({
  assets: useAssetsStore.getState(),
  video: useVideoStore.getState(),
  faceDetection: useFaceDetectionStore.getState(),
}) 