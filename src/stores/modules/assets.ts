import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AssetType, ModelCapability, ModelGroup, ModelSelection } from '../../types'

// Enhanced Asset interface for the store
export interface Asset {
  id: string
  type: AssetType
  url: string
  loaded: boolean
  loading: boolean
  error?: string
  size?: number
}

// Face-api.js model configurations with enhanced metadata
export const FACE_API_MODELS = {
  ssdMobilenetv1: {
    id: 'ssd_mobilenetv1',
    type: 'model' as AssetType,
    url: '/weights/ssd_mobilenetv1_model',
    description: 'SSD MobileNet Face Detection',
    capability: 'detection' as ModelCapability,
    performance: 'high',
    accuracy: 'high'
  },
  tinyFaceDetector: {
    id: 'tiny_face_detector',
    type: 'model' as AssetType,
    url: '/weights/tiny_face_detector_model',
    description: 'Lightweight Face Detection',
    capability: 'detection' as ModelCapability,
    performance: 'very-high',
    accuracy: 'medium'
  },
  mtcnn: {
    id: 'mtcnn',
    type: 'model' as AssetType,
    url: '/weights/mtcnn_model',
    description: 'MTCNN Face Detection & Alignment',
    capability: 'detection' as ModelCapability,
    performance: 'medium',
    accuracy: 'very-high'
  },
  faceLandmark68: {
    id: 'face_landmark_68',
    type: 'model' as AssetType,
    url: '/weights/face_landmark_68_model',
    description: '68-Point Face Landmarks',
    capability: 'landmarks' as ModelCapability,
    performance: 'high',
    accuracy: 'high'
  },
  faceLandmark68Tiny: {
    id: 'face_landmark_68_tiny',
    type: 'model' as AssetType,
    url: '/weights/face_landmark_68_tiny_model',
    description: 'Lightweight 68-Point Landmarks',
    capability: 'landmarks' as ModelCapability,
    performance: 'very-high',
    accuracy: 'medium'
  },
  faceRecognition: {
    id: 'face_recognition',
    type: 'model' as AssetType,
    url: '/weights/face_recognition_model',
    description: 'Face Recognition & Identification',
    capability: 'recognition' as ModelCapability,
    performance: 'medium',
    accuracy: 'very-high'
  },
  faceExpression: {
    id: 'face_expression',
    type: 'model' as AssetType,
    url: '/weights/face_expression_model',
    description: 'Emotion & Expression Analysis',
    capability: 'analysis' as ModelCapability,
    performance: 'high',
    accuracy: 'high'
  },
  ageGender: {
    id: 'age_gender',
    type: 'model' as AssetType,
    url: '/weights/age_gender_model',
    description: 'Age & Gender Estimation',
    capability: 'analysis' as ModelCapability,
    performance: 'high',
    accuracy: 'high'
  }
}

// Model capability groups with feature definitions
export const MODEL_GROUPS: Record<ModelCapability, ModelGroup> = {
  detection: {
    capability: 'detection',
    name: 'Face Detection',
    description: 'Detect and locate faces in images and videos',
    models: ['ssd_mobilenetv1', 'tiny_face_detector', 'mtcnn'],
    requiredModels: ['ssd_mobilenetv1'], // At least one detection model
    isAvailable: false,
    features: [
      'Detect faces in images/video',
      'Face bounding boxes',
      'Confidence scores',
      'Multiple face detection'
    ]
  },
  landmarks: {
    capability: 'landmarks',
    name: 'Face Landmarks',
    description: 'Identify key facial feature points',
    models: ['face_landmark_68', 'face_landmark_68_tiny'],
    requiredModels: ['face_landmark_68'], // At least one landmarks model
    isAvailable: false,
    features: [
      '68-point facial landmarks',
      'Eye, nose, mouth positioning',
      'Face alignment',
      'Feature extraction'
    ]
  },
  recognition: {
    capability: 'recognition',
    name: 'Face Recognition',
    description: 'Identify and match faces across images',
    models: ['face_recognition'],
    requiredModels: ['face_recognition'],
    isAvailable: false,
    features: [
      'Face identification',
      'Face matching & comparison',
      'Face descriptors',
      'Identity verification'
    ]
  },
  analysis: {
    capability: 'analysis',
    name: 'Face Analysis',
    description: 'Analyze facial expressions and demographics',
    models: ['face_expression', 'age_gender'],
    requiredModels: ['face_expression'], // At least expression analysis
    isAvailable: false,
    features: [
      'Emotion detection',
      'Age estimation',
      'Gender prediction',
      'Expression analysis'
    ]
  }
}

// ModelSelection is now imported from shared types

// Re-export types for compatibility
export type { AssetType, ModelCapability, ModelGroup, ModelSelection } from '../../types'

export interface AssetsState {
  assets: Record<string, Asset>
  loadingProgress: number
  isLoading: boolean
  hasInitialized: boolean
  
  // Model capability tracking
  modelGroups: Record<ModelCapability, ModelGroup>
  availableCapabilities: ModelCapability[]
  
  // Model selection for frame recognition
  selectedModels: ModelSelection
  
  // Actions
  loadAsset: (asset: Omit<Asset, 'loaded' | 'loading' | 'error'>) => Promise<void>
  loadFaceApiModels: (modelIds?: string[]) => Promise<void>
  loadModelsByCapability: (capabilities: ModelCapability[]) => Promise<void>
  loadAllAssets: () => Promise<void>
  resetAssets: () => void
  
  // Model selection actions
  setSelectedModel: (capability: ModelCapability, modelId: string) => void
  getSelectedModelForCapability: (capability: ModelCapability) => string | null
  getSelectedModelOptions: (capability: ModelCapability) => Asset[]
  
  // Getters
  getAssetById: (id: string) => Asset | undefined
  getLoadedAssets: () => Asset[]
  getFailedAssets: () => Asset[]
  getLoadedModelsByCapability: (capability: ModelCapability) => Asset[]
  isCapabilityAvailable: (capability: ModelCapability) => boolean
  getAvailableFeatures: () => string[]
  
  // Internal
  updateCapabilityAvailability: () => void
}

export const useAssetsStore = create<AssetsState>()(
  devtools(
    (set, get) => ({
      assets: {},
      loadingProgress: 0,
      isLoading: false,
      hasInitialized: false,
      modelGroups: { ...MODEL_GROUPS },
      availableCapabilities: [],
      
      // Default model selection
      selectedModels: {
        detection: 'ssd_mobilenetv1',
        landmarks: 'face_landmark_68',
        recognition: 'face_recognition',
        analysis: 'face_expression'
      },

      loadAsset: async (assetConfig) => {
        const { id, type, url } = assetConfig
        
        // Mark as loading
        set((state) => ({
          assets: {
            ...state.assets,
            [id]: {
              ...assetConfig,
              loaded: false,
              loading: true,
              error: undefined
            }
          },
          isLoading: true
        }))

        try {
          if (type === 'model') {
            // For face-api.js models, we need to load from the weights directory
            const response = await fetch(`${url}-weights_manifest.json`)
            if (!response.ok) throw new Error(`Failed to load model manifest: ${response.statusText}`)
            
            // Simulate loading time for demo purposes
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Mark as loaded
            set((state) => ({
              assets: {
                ...state.assets,
                [id]: {
                  ...state.assets[id],
                  loaded: true,
                  loading: false,
                  size: response.headers.get('content-length') ? 
                    parseInt(response.headers.get('content-length')!) : undefined
                }
              }
            }))
          } else {
            // For other asset types (images, videos, etc.)
            const response = await fetch(url)
            if (!response.ok) throw new Error(`Failed to load asset: ${response.statusText}`)
            
            set((state) => ({
              assets: {
                ...state.assets,
                [id]: {
                  ...state.assets[id],
                  loaded: true,
                  loading: false,
                  size: response.headers.get('content-length') ? 
                    parseInt(response.headers.get('content-length')!) : undefined
                }
              }
            }))
          }

          // Update loading progress
          const assets = get().assets
          const totalAssets = Object.keys(assets).length
          const loadedAssets = Object.values(assets).filter(asset => asset.loaded).length
          const progress = totalAssets > 0 ? (loadedAssets / totalAssets) * 100 : 0
          
          set({ loadingProgress: progress })
          
          // Update capability availability after loading a model
          if (type === 'model') {
            get().updateCapabilityAvailability()
          }
          
          // Check if all assets are loaded
          const stillLoading = Object.values(assets).some(asset => asset.loading)
          if (!stillLoading) {
            set({ isLoading: false })
          }

        } catch (error) {
          console.error(`Failed to load asset ${id}:`, error)
          set((state) => ({
            assets: {
              ...state.assets,
              [id]: {
                ...state.assets[id],
                loaded: false,
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }))
        }
      },

      loadFaceApiModels: async (modelIds = ['ssd_mobilenetv1', 'face_landmark_68', 'face_recognition']) => {
        console.log('🤖 Loading face-api.js models:', modelIds)
        
        const modelsToLoad = modelIds
          .map(id => FACE_API_MODELS[id as keyof typeof FACE_API_MODELS])
          .filter(Boolean)

        const loadPromises = modelsToLoad.map(model => get().loadAsset(model))
        await Promise.all(loadPromises)
        
        console.log('✅ Face-api.js models loaded successfully')
      },

      loadModelsByCapability: async (capabilities) => {
        console.log('🎯 Loading models by capability:', capabilities)
        
        const modelsToLoad: string[] = []
        
        capabilities.forEach(capability => {
          const group = MODEL_GROUPS[capability]
          // Load required models for this capability
          modelsToLoad.push(...group.requiredModels)
          
          // Optionally load additional models for better performance/accuracy
          group.models.forEach(modelId => {
            if (!modelsToLoad.includes(modelId)) {
              modelsToLoad.push(modelId)
            }
          })
        })
        
        await get().loadFaceApiModels(modelsToLoad)
        console.log(`✅ Models loaded for capabilities: ${capabilities.join(', ')}`)
      },

      loadAllAssets: async () => {
        console.log('📦 Loading all predefined assets...')
        
        // Load all face-api models
        await get().loadFaceApiModels(Object.keys(FACE_API_MODELS))
        
        // Load sample video
        await get().loadAsset({
          id: 'sample_video',
          type: 'video',
          url: '/spaceballs_the_movie.mp4'
        })
        
        // Load SVG assets
        const svgAssets = [
          { id: 'globe_svg', url: '/globe.svg' },
          { id: 'next_svg', url: '/next.svg' },
          { id: 'vercel_svg', url: '/vercel.svg' },
          { id: 'window_svg', url: '/window.svg' },
          { id: 'file_svg', url: '/file.svg' }
        ]
        
        const svgPromises = svgAssets.map(asset => 
          get().loadAsset({ ...asset, type: 'svg' })
        )
        
        await Promise.all(svgPromises)
        
        set({ hasInitialized: true })
        console.log('🎉 All assets loaded successfully!')
      },

      resetAssets: () => {
        set({
          assets: {},
          loadingProgress: 0,
          isLoading: false,
          hasInitialized: false,
          modelGroups: { ...MODEL_GROUPS },
          availableCapabilities: [],
          selectedModels: {
            detection: 'ssd_mobilenetv1',
            landmarks: 'face_landmark_68',
            recognition: 'face_recognition',
            analysis: 'face_expression'
          }
        })
      },

      // Model selection actions
      setSelectedModel: (capability: ModelCapability, modelId: string) => {
        set((state) => ({
          selectedModels: {
            ...state.selectedModels,
            [capability]: modelId
          }
        }))
        console.log(`🎯 Selected ${capability} model: ${modelId}`)
      },

      getSelectedModelForCapability: (capability: ModelCapability) => {
        return get().selectedModels[capability]
      },

      getSelectedModelOptions: (capability: ModelCapability) => {
        const { assets, modelGroups } = get()
        const group = modelGroups[capability]
        
        return Object.values(assets).filter(asset => 
          asset.loaded && 
          asset.type === 'model' && 
          group.models.includes(asset.id)
        )
      },

      getAssetById: (id: string) => {
        return get().assets[id]
      },

      getLoadedAssets: () => {
        return Object.values(get().assets).filter(asset => asset.loaded)
      },

      getFailedAssets: () => {
        return Object.values(get().assets).filter(asset => asset.error)
      },

      getLoadedModelsByCapability: (capability: ModelCapability) => {
        const group = get().modelGroups[capability]
        return Object.values(get().assets).filter(asset => 
          asset.loaded && 
          asset.type === 'model' && 
          group.models.includes(asset.id)
        )
      },

      isCapabilityAvailable: (capability: ModelCapability) => {
        return get().availableCapabilities.includes(capability)
      },

      getAvailableFeatures: () => {
        const { availableCapabilities, modelGroups } = get()
        return availableCapabilities.flatMap(capability => 
          modelGroups[capability].features
        )
      },

      updateCapabilityAvailability: () => {
        const { assets, modelGroups } = get()
        const loadedModels = Object.values(assets)
          .filter(asset => asset.loaded && asset.type === 'model')
          .map(asset => asset.id)

        const updatedGroups = { ...modelGroups }
        const availableCapabilities: ModelCapability[] = []

        // Check each capability
        Object.entries(updatedGroups).forEach(([key, group]) => {
          const capability = key as ModelCapability
          
          // Check if required models are loaded
          const hasRequiredModels = group.requiredModels.every(modelId =>
            loadedModels.includes(modelId)
          )
          
          updatedGroups[capability] = {
            ...group,
            isAvailable: hasRequiredModels
          }
          
          if (hasRequiredModels) {
            availableCapabilities.push(capability)
          }
        })

        set({ 
          modelGroups: updatedGroups, 
          availableCapabilities 
        })

        // Log capability updates
        if (availableCapabilities.length > 0) {
          console.log('🚀 Activated capabilities:', availableCapabilities.map(cap => 
            updatedGroups[cap].name
          ).join(', '))
        }
      }
    }),
    {
      name: 'assets-store'
    }
  )
) 