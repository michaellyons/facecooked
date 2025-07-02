// ================================================
// Core Shared Types for FaceCooked Application
// ================================================

// Face Detection & Recognition Types
// ----------------------------------

export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

export interface FaceLandmark {
  x: number
  y: number
}

export interface FaceExpression {
  expression: string
  probability: number
}

// Base face detection result from service layer
export interface BaseFace {
  id: string
  box: FaceBox
  confidence: number
  landmarks?: FaceLandmark[]
  descriptor?: Float32Array
  expressions?: FaceExpression[]
  age?: number
  gender?: string
}

// Enhanced face with character and deletion tracking for store layer
export interface DetectedFace extends BaseFace {
  deleted_at?: number // Timestamp when face was deleted
  capture_id: string // Reference to which capture this face belongs to
  character_name?: string // User-assigned character name
  character_id?: string // Unique character identifier for grouping faces
}

export interface Character {
  id: string
  name: string
  face_count: number
  first_seen: number // timestamp
  last_seen: number // timestamp
  representative_face?: DetectedFace // Best quality face for this character
  confidence: number // Average confidence across all faces
}

// Video & Capture Types  
// ---------------------

export interface VideoFrame {
  timestamp: number
  dataUrl: string
  blob?: Blob
}

export interface BaseCaptureShot {
  id: string
  timestamp: number
  dataUrl: string
  blob?: Blob
  width: number
  height: number
}

export interface CaptureShot extends BaseCaptureShot {
  detectedFaces: DetectedFace[]
  isProcessing: boolean
  isProcessed: boolean
  error?: string
  speakerId?: string
}

// Processing & Configuration Types
// --------------------------------

export interface ProcessingOptions {
  detectFaces: boolean
  detectLandmarks: boolean
  detectExpressions: boolean
  detectAge: boolean
  detectGender: boolean
  recognizeFaces: boolean
}

// Asset & Model Types
// ------------------

export type AssetType = 'model' | 'video' | 'image' | 'svg'
export type ModelCapability = 'detection' | 'landmarks' | 'recognition' | 'analysis'

export interface Asset {
  path: string
  type: AssetType
}

export interface ModelGroup {
  capability: ModelCapability
  name: string
  description: string
  models: string[]
  requiredModels: string[] // Minimum models needed for this capability
  isAvailable: boolean
  features: string[]
}

export interface ModelSelection {
  detection: string
  landmarks: string | null
  recognition: string | null
  analysis: string | null
}

// Component Props Types
// ---------------------

export interface ComponentWithSeekTime {
  onSeekToTime?: (timestamp: number) => void
}

export interface ComponentWithFaceClick {
  onFaceClick?: (shotId: string, faceIndex: number) => void
}

export interface ComponentWithFrameSelect {
  onFrameSelect?: (captureId: string) => void
}

// API & Service Types
// ------------------

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

// Drag & Drop Types
// ----------------

export interface DraggedFace {
  id: string
  type: string
}

export interface UIFaceGroup {
  id: string
  faces: DetectedFace[]
  similarity: number
}

export interface DragState {
  isDragging: boolean
  draggedFace: DetectedFace | null
}

// Store State Types
// ----------------

export type ViewState = 
  | 'initializing'      // Loading models and assets
  | 'models-ready'      // Models complete, showing transition
  | 'upload-ready'      // Ready to accept video uploads  
  | 'uploading'         // Processing video upload
  | 'video-ready'       // Video loaded and ready for analysis

// Utility Types
// -------------

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type ID = string
export type Timestamp = number

// Re-export commonly used React types for convenience
export type { CSSProperties } from 'react' 