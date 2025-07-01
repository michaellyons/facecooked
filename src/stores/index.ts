export { useAssetsStore } from './modules/assets'
export { useVideoStore } from './modules/video'
export { useFaceDetectionStore, type DetectedFace, type Character } from './modules/faceDetection'
export type { CaptureShot, ProcessingOptions } from './modules/faceDetection'

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