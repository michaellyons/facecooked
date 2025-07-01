import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { faceDetectionService } from '../../services/faceDetection'
import type { DetectedFace as ServiceDetectedFace, ProcessingOptions } from '../../services/faceDetection'
import { apiService } from '../../services/api'

// Enhanced DetectedFace with soft delete and character info
export interface DetectedFace extends ServiceDetectedFace {
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

export interface CaptureShot {
  id: string
  timestamp: number
  dataUrl: string
  blob?: Blob
  width: number
  height: number
  detectedFaces: DetectedFace[]
  isProcessing: boolean
  isProcessed: boolean
  error?: string
  speakerId?: string
}

export interface FaceDetectionState {
  // Capture management
  captureShots: CaptureShot[]
  selectedCaptureId: string | null
  
  // Detection results - START WITH EMPTY ARRAY
  detectedFaces: DetectedFace[]
  deletedFaceIds: Set<string> // Track deleted face IDs to prevent re-adding
  deletedFaceDescriptors: Map<string, Float32Array> // Store descriptors of deleted faces to prevent similar faces
  totalFaces: number
  totalActiveFaces: number // Count of non-deleted faces
  
  // Character management
  characters: Character[]
  selectedCharacterId: string | null
  
  // Processing state
  isProcessing: boolean
  processingProgress: number
  
  // Face-api.js models state
  modelsLoaded: boolean
  loadingProgress: number
  
  // Detection options
  processingOptions: ProcessingOptions
  
  // Error handling
  error: string | null
  
  // Actions
  addCaptureShot: (shot: Omit<CaptureShot, 'id' | 'detectedFaces' | 'isProcessing' | 'isProcessed'>) => void
  addCaptureAndProcess: (shot: Omit<CaptureShot, 'id' | 'detectedFaces' | 'isProcessing' | 'isProcessed'>, options?: Partial<ProcessingOptions>) => Promise<string>
  removeCaptureShot: (id: string) => void
  selectCaptureShot: (id: string | null) => void
  processCaptureShot: (id: string, options?: Partial<ProcessingOptions>) => Promise<void>
  processAllCaptures: (options?: Partial<ProcessingOptions>) => Promise<void>
  clearCaptureShots: () => void
  
  // Model loading
  loadFaceApiModels: () => Promise<void>
  reloadFaceApiModels: () => Promise<void>
  
  // Face management actions
  setDetectedFaces: (faces: DetectedFace[]) => void
  addDetectedFace: (face: DetectedFace) => void
  removeDetectedFace: (id: string) => void
  softDeleteFace: (id: string) => Promise<void>
  permanentDeleteFace: (id: string) => Promise<void>
  restoreFace: (id: string) => Promise<void>
  updateFaceInCapture: (captureId: string, faceId: string, updates: Partial<DetectedFace>) => void
  
  // Character management actions
  createCharacter: (name: string, faceId: string) => Promise<void>
  updateCharacterName: (characterId: string, name: string) => Promise<void>
  assignFaceToCharacter: (faceId: string, characterId: string) => void
  removeFaceFromCharacter: (faceId: string) => void
  deleteCharacter: (characterId: string) => void
  deleteCharacterCompletely: (characterId: string) => void
  selectCharacter: (characterId: string | null) => void
  getCharacterFaces: (characterId: string) => DetectedFace[]
  updateCharactersFromFaces: () => void
  findBestCharacterMatch: (faceDescriptor: Float32Array) => Character | null
  cleanupOrphanedData: () => void
  
  // Utility for getting unassigned faces
  getUnassignedFaces: () => DetectedFace[]
  
  // Processing state actions
  setProcessing: (processing: boolean, progress?: number) => void
  setModelsLoaded: (loaded: boolean) => void
  setLoadingProgress: (progress: number) => void
  setProcessingOptions: (options: Partial<ProcessingOptions>) => void
  setError: (error: string | null) => void
  
  // Utility methods
  getCaptureById: (id: string) => CaptureShot | undefined
  getSelectedCapture: () => CaptureShot | undefined
  getProcessedCaptures: () => CaptureShot[]
  getFacesForCapture: (captureId: string) => DetectedFace[]
  getActiveFaces: () => DetectedFace[]
  getDeletedFaces: () => DetectedFace[]
  isDuplicateFace: (face: ServiceDetectedFace, captureId: string) => boolean
}

export const useFaceDetectionStore = create<FaceDetectionState>()(
  devtools(
    (set, get) => ({
      // Initial state - START WITH EMPTY FACES
      captureShots: [],
      selectedCaptureId: null,
      detectedFaces: [], // EMPTY - only filled when real detection runs
      deletedFaceIds: new Set<string>(), // Track deleted face IDs
      deletedFaceDescriptors: new Map<string, Float32Array>(), // Store descriptors of deleted faces
      totalFaces: 0, // ZERO - only increases when faces are actually detected
      totalActiveFaces: 0, // Count of non-deleted faces
      characters: [], // Empty characters list
      selectedCharacterId: null,
      isProcessing: false,
      processingProgress: 0,
      modelsLoaded: false,
      loadingProgress: 0,
      processingOptions: {
        detectFaces: true,
        detectLandmarks: true,
        detectExpressions: true,
        detectAge: false,
        detectGender: false,
        recognizeFaces: true
      },
      error: null,

      // Capture management actions
      addCaptureShot: (shotData) => {
        const shot: CaptureShot = {
          ...shotData,
          id: `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          detectedFaces: [], // START EMPTY - no faces until processing
          isProcessing: false,
          isProcessed: false
        }
        
        set((state) => ({
          captureShots: [...state.captureShots, shot]
        }))
      },

      addCaptureAndProcess: async (shotData, options = {}) => {
        // Generate ID first
        const id = `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const shot: CaptureShot = {
          ...shotData,
          id,
          detectedFaces: [], // START EMPTY - no faces until processing
          isProcessing: false,
          isProcessed: false
        }
        
        // Add the capture shot
        set((state) => ({
          captureShots: [...state.captureShots, shot]
        }))
        
        // Save capture to API (async, non-blocking)
        apiService.saveCapture(shot).catch(error => {
          console.error('Failed to sync capture with API:', error)
        })
        
        // Automatically process it for face detection
        await get().processCaptureShot(id, options)
        
        // Sync analytics periodically (every 5 captures)
        const currentCaptureCount = get().captureShots.length
        if (currentCaptureCount % 5 === 0) {
          const stats = {
            total_captures: currentCaptureCount,
            total_faces: get().totalFaces,
            total_characters: get().characters.length,
            active_faces: get().totalActiveFaces,
            session_timestamp: Date.now()
          }
          apiService.syncAnalytics(stats).catch(error => {
            console.error('Failed to sync analytics with API:', error)
          })
        }
        
        return id
      },

      removeCaptureShot: (id) => {
        set((state) => {
          const shotToRemove = state.captureShots.find(shot => shot.id === id)
          const facesToRemove = shotToRemove ? shotToRemove.detectedFaces : []
          
          // Add removed face IDs to deleted set to prevent future re-adding
          const newDeletedIds = new Set(state.deletedFaceIds)
          facesToRemove.forEach(face => newDeletedIds.add(face.id))
          
          return {
            captureShots: state.captureShots.filter(shot => shot.id !== id),
            selectedCaptureId: state.selectedCaptureId === id ? null : state.selectedCaptureId,
            detectedFaces: state.detectedFaces.filter(face => 
              !facesToRemove.some(f => f.id === face.id)
            ),
            deletedFaceIds: newDeletedIds,
            totalFaces: state.totalFaces - facesToRemove.length,
            totalActiveFaces: state.totalActiveFaces - facesToRemove.filter(f => !f.deleted_at).length
          }
        })
      },

      selectCaptureShot: (id) => {
        set({ selectedCaptureId: id })
      },

      loadFaceApiModels: async () => {
        if (faceDetectionService.isModelsLoaded()) {
          set({ modelsLoaded: true, loadingProgress: 100 })
          return
        }

        set({ isProcessing: true, loadingProgress: 0, error: null })
        
        try {
          await faceDetectionService.loadModels((progress) => {
            set({ loadingProgress: progress })
          })
          
          set({ 
            modelsLoaded: true, 
            loadingProgress: 100, 
            isProcessing: false 
          })
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load models',
            isProcessing: false,
            modelsLoaded: false
          })
        }
      },

      reloadFaceApiModels: async () => {
        // Force reload by resetting model state first
        set({ 
          modelsLoaded: false, 
          loadingProgress: 0, 
          error: null,
          isProcessing: true 
        })
        
        try {
          // Force the service to reload models
          await faceDetectionService.loadModels((progress) => {
            set({ loadingProgress: progress })
          })
          
          set({ 
            modelsLoaded: true, 
            loadingProgress: 100, 
            isProcessing: false 
          })
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to reload models',
            isProcessing: false,
            modelsLoaded: false
          })
        }
      },

      isDuplicateFace: (face: ServiceDetectedFace, captureId: string) => {
        const { deletedFaceIds, detectedFaces, deletedFaceDescriptors } = get()
        
        // Check if this exact face ID was already deleted
        if (deletedFaceIds.has(face.id)) {
          return true
        }
        
        // Simple duplicate detection based on position similarity within same capture
        const positionThreshold = 0.1 // 10% similarity threshold
        
        const isPositionDuplicate = detectedFaces.some(existingFace => {
          if (existingFace.capture_id !== captureId) return false
          
          const xDiff = Math.abs(existingFace.box.x - face.box.x) / face.box.width
          const yDiff = Math.abs(existingFace.box.y - face.box.y) / face.box.height
          const wDiff = Math.abs(existingFace.box.width - face.box.width) / face.box.width
          const hDiff = Math.abs(existingFace.box.height - face.box.height) / face.box.height
          
          return xDiff < positionThreshold && yDiff < positionThreshold && wDiff < positionThreshold && hDiff < positionThreshold
        })
        
        // Check if this face is similar to any deleted face using descriptor similarity
        if (face.descriptor && deletedFaceDescriptors.size > 0) {
          const descriptorThreshold = 0.6 // 60% similarity threshold
          
          for (const [deletedId, deletedDescriptor] of deletedFaceDescriptors) {
            const distance = Math.sqrt(
              face.descriptor.reduce((sum, val, i) => 
                sum + Math.pow(val - deletedDescriptor[i], 2), 0
              )
            )
            
            if (distance < descriptorThreshold) {
              console.log(`Face rejected: Similar to deleted face ${deletedId} (distance: ${distance.toFixed(3)})`)
              return true
            }
          }
        }
        
        return isPositionDuplicate
      },

      processCaptureShot: async (id, options = {}) => {
        const { captureShots, processingOptions } = get()
        const capture = captureShots.find(shot => shot.id === id)
        
        if (!capture) {
          set({ error: 'Capture not found' })
          return
        }

        // Ensure models are loaded
        if (!faceDetectionService.isModelsLoaded()) {
          await get().loadFaceApiModels()
          if (!get().modelsLoaded) {
            return // Error was already set by loadFaceApiModels
          }
        }

        const finalOptions = { ...processingOptions, ...options }
        
        // Mark capture as processing
        set((state) => ({
          captureShots: state.captureShots.map(shot =>
            shot.id === id ? { ...shot, isProcessing: true, error: undefined } : shot
          ),
          isProcessing: true,
          error: null
        }))

        try {
          // Use REAL face detection service
          const rawDetectedFaces = await faceDetectionService.detectFaces(capture, finalOptions)
          
          // Filter out duplicates and add capture_id, then auto-assign to characters
          const detectedFaces: DetectedFace[] = rawDetectedFaces
            .filter(face => !get().isDuplicateFace(face, id))
            .map(face => {
              const detectedFace: DetectedFace = {
                ...face,
                capture_id: id
              }

              // Auto-assign to existing character if face recognition is enabled and descriptor is available
              if (finalOptions.recognizeFaces && face.descriptor) {
                const matchedCharacter = get().findBestCharacterMatch(face.descriptor)
                if (matchedCharacter) {
                  detectedFace.character_id = matchedCharacter.id
                  detectedFace.character_name = matchedCharacter.name
                }
              }

              return detectedFace
            })
          
          // Update capture with REAL results
          set((state) => {
            const oldCapture = state.captureShots.find(s => s.id === id)
            const oldFaceCount = oldCapture ? oldCapture.detectedFaces.length : 0
            const oldActiveFaceCount = oldCapture ? oldCapture.detectedFaces.filter(f => !f.deleted_at).length : 0
            
            return {
              captureShots: state.captureShots.map(shot =>
                shot.id === id 
                  ? { 
                      ...shot, 
                      detectedFaces, 
                      isProcessing: false, 
                      isProcessed: true 
                    } 
                  : shot
              ),
              detectedFaces: [
                ...state.detectedFaces.filter(face => 
                  !state.captureShots.find(s => s.id === id)?.detectedFaces.some(f => f.id === face.id)
                ),
                ...detectedFaces
              ],
              totalFaces: state.totalFaces - oldFaceCount + detectedFaces.length,
              totalActiveFaces: state.totalActiveFaces - oldActiveFaceCount + detectedFaces.length,
              isProcessing: false
            }
          })

          // Auto-update character stats when new faces are detected
          if (detectedFaces.length > 0) {
            get().updateCharactersFromFaces()
          }

        } catch (error) {
          console.error('Face detection error:', error)
          set((state) => ({
            captureShots: state.captureShots.map(shot =>
              shot.id === id 
                ? { 
                    ...shot, 
                    isProcessing: false, 
                    error: error instanceof Error ? error.message : 'Detection failed'
                  } 
                : shot
            ),
            isProcessing: false,
            error: error instanceof Error ? error.message : 'Detection failed'
          }))
        }
      },

      processAllCaptures: async (options = {}) => {
        const { captureShots } = get()
        const unprocessedCaptures = captureShots.filter(shot => !shot.isProcessed)
        
        if (unprocessedCaptures.length === 0) {
          return
        }

        set({ processingProgress: 0 })
        
        for (let i = 0; i < unprocessedCaptures.length; i++) {
          await get().processCaptureShot(unprocessedCaptures[i].id, options)
          set({ processingProgress: ((i + 1) / unprocessedCaptures.length) * 100 })
        }
        
        set({ processingProgress: 0 })
      },

      clearCaptureShots: () => {
        set({
          captureShots: [],
          selectedCaptureId: null,
          detectedFaces: [], // RESET TO EMPTY
          deletedFaceIds: new Set<string>(), // Clear deleted IDs
          deletedFaceDescriptors: new Map<string, Float32Array>(), // Clear deleted descriptors
          totalFaces: 0, // RESET TO ZERO
          totalActiveFaces: 0,
          isProcessing: false,
          processingProgress: 0,
          error: null
        })
      },

      // Face management actions
      setDetectedFaces: (faces) => {
        const activeFaces = faces.filter(f => !f.deleted_at)
        set({ 
          detectedFaces: faces,
          totalFaces: faces.length,
          totalActiveFaces: activeFaces.length
        })
      },

      addDetectedFace: (face) => {
        set((state) => ({
          detectedFaces: [...state.detectedFaces, face],
          totalFaces: state.totalFaces + 1,
          totalActiveFaces: face.deleted_at ? state.totalActiveFaces : state.totalActiveFaces + 1
        }))
      },

      removeDetectedFace: (id) => {
        set((state) => {
          const faceToRemove = state.detectedFaces.find(f => f.id === id)
          const newDeletedIds = new Set(state.deletedFaceIds)
          newDeletedIds.add(id)
          
          return {
            detectedFaces: state.detectedFaces.filter(face => face.id !== id),
            deletedFaceIds: newDeletedIds,
            totalFaces: state.totalFaces - 1,
            totalActiveFaces: faceToRemove && !faceToRemove.deleted_at ? state.totalActiveFaces - 1 : state.totalActiveFaces
          }
        })
      },

      softDeleteFace: async (id) => {
        // Update locally first
        set((state) => {
          const now = Date.now()
          const newDeletedIds = new Set(state.deletedFaceIds)
          newDeletedIds.add(id)
          
          // Store the face descriptor to prevent re-detection of similar faces
          const faceToDelete = state.detectedFaces.find(face => face.id === id)
          const newDeletedDescriptors = new Map(state.deletedFaceDescriptors)
          if (faceToDelete?.descriptor) {
            newDeletedDescriptors.set(id, faceToDelete.descriptor)
          }
          
          return {
            detectedFaces: state.detectedFaces.map(face =>
              face.id === id ? { ...face, deleted_at: now } : face
            ),
            captureShots: state.captureShots.map(shot => ({
              ...shot,
              detectedFaces: shot.detectedFaces.map(face =>
                face.id === id ? { ...face, deleted_at: now } : face
              )
            })),
            deletedFaceIds: newDeletedIds,
            deletedFaceDescriptors: newDeletedDescriptors,
            totalActiveFaces: state.totalActiveFaces - 1
          }
        })

        // Sync with API
        try {
          await apiService.deleteFace(id, false) // false = soft delete
        } catch (error) {
          console.error('Failed to sync face soft delete with API:', error)
        }
      },

      restoreFace: async (id) => {
        // Update locally first
        set((state) => {
          const newDeletedIds = new Set(state.deletedFaceIds)
          newDeletedIds.delete(id)
          
          // Remove the face descriptor from deleted descriptors
          const newDeletedDescriptors = new Map(state.deletedFaceDescriptors)
          newDeletedDescriptors.delete(id)
          
          return {
            detectedFaces: state.detectedFaces.map(face =>
              face.id === id ? { ...face, deleted_at: undefined } : face
            ),
            captureShots: state.captureShots.map(shot => ({
              ...shot,
              detectedFaces: shot.detectedFaces.map(face =>
                face.id === id ? { ...face, deleted_at: undefined } : face
              )
            })),
            deletedFaceIds: newDeletedIds,
            deletedFaceDescriptors: newDeletedDescriptors,
            totalActiveFaces: state.totalActiveFaces + 1
          }
        })

        // Sync with API
        try {
          await apiService.restoreFace(id)
        } catch (error) {
          console.error('Failed to sync face restore with API:', error)
        }
      },

      permanentDeleteFace: async (id) => {
        // Update locally first
        set((state) => {
          const faceToDelete = state.detectedFaces.find(f => f.id === id)
          
          // Store the face descriptor to prevent re-detection of similar faces
          const newDeletedDescriptors = new Map(state.deletedFaceDescriptors)
          if (faceToDelete?.descriptor) {
            newDeletedDescriptors.set(id, faceToDelete.descriptor)
          }
          
          // Add to deleted IDs set
          const newDeletedIds = new Set(state.deletedFaceIds)
          newDeletedIds.add(id)
          
          // Remove face completely from all data structures
          const newDetectedFaces = state.detectedFaces.filter(face => face.id !== id)
          const newCaptureShots = state.captureShots.map(shot => ({
            ...shot,
            detectedFaces: shot.detectedFaces.filter(face => face.id !== id)
          }))
          
          return {
            detectedFaces: newDetectedFaces,
            captureShots: newCaptureShots,
            deletedFaceIds: newDeletedIds,
            deletedFaceDescriptors: newDeletedDescriptors,
            totalFaces: state.totalFaces - 1,
            totalActiveFaces: faceToDelete && !faceToDelete.deleted_at ? state.totalActiveFaces - 1 : state.totalActiveFaces
          }
        })

        // Sync with API
        try {
          await apiService.deleteFace(id, true) // true = permanent delete
        } catch (error) {
          console.error('Failed to sync face permanent delete with API:', error)
        }
      },

      updateFaceInCapture: (captureId, faceId, updates) => {
        set((state) => ({
          captureShots: state.captureShots.map(shot =>
            shot.id === captureId
              ? {
                  ...shot,
                  detectedFaces: shot.detectedFaces.map(face =>
                    face.id === faceId ? { ...face, ...updates } : face
                  )
                }
              : shot
          ),
          detectedFaces: state.detectedFaces.map(face =>
            face.id === faceId ? { ...face, ...updates } : face
          )
        }))
      },

      // Processing state actions
      setProcessing: (processing, progress = 0) => {
        set({ isProcessing: processing, processingProgress: progress })
      },

      setModelsLoaded: (loaded) => {
        set({ modelsLoaded: loaded })
      },

      setLoadingProgress: (progress) => {
        set({ loadingProgress: progress })
      },

      setProcessingOptions: (options) => {
        set((state) => ({
          processingOptions: { ...state.processingOptions, ...options }
        }))
      },

      setError: (error) => {
        set({ error })
      },

      // Utility methods
      getCaptureById: (id) => {
        return get().captureShots.find(shot => shot.id === id)
      },

      getSelectedCapture: () => {
        const { selectedCaptureId, captureShots } = get()
        return selectedCaptureId ? captureShots.find(shot => shot.id === selectedCaptureId) : undefined
      },

      getProcessedCaptures: () => {
        return get().captureShots.filter(shot => shot.isProcessed)
      },

      getFacesForCapture: (captureId) => {
        const capture = get().captureShots.find(shot => shot.id === captureId)
        return capture ? capture.detectedFaces : []
      },

      getActiveFaces: () => {
        return get().detectedFaces.filter(face => !face.deleted_at)
      },

      getDeletedFaces: () => {
        return get().detectedFaces.filter(face => face.deleted_at)
      },

      // Character management actions
      createCharacter: async (name, faceId) => {
        const face = get().detectedFaces.find(f => f.id === faceId)
        if (!face) return

        // Get timestamp from the capture this face belongs to
        const capture = get().captureShots.find(shot => shot.id === face.capture_id)
        const timestamp = capture?.timestamp || 0

        const characterId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const character: Character = {
          id: characterId,
          name,
          face_count: 1,
          first_seen: timestamp,
          last_seen: timestamp,
          representative_face: face,
          confidence: face.confidence
        }

        // Update the face with character info locally first
        set((state) => ({
          characters: [...state.characters, character],
          detectedFaces: state.detectedFaces.map(f => 
            f.id === faceId 
              ? { ...f, character_id: characterId, character_name: name }
              : f
          ),
          captureShots: state.captureShots.map(shot => ({
            ...shot,
            detectedFaces: shot.detectedFaces.map(f =>
              f.id === faceId 
                ? { ...f, character_id: characterId, character_name: name }
                : f
            )
          }))
        }))

        // Sync with API
        try {
          await apiService.createCharacter(character)
          // Also sync the face assignment
          await apiService.updateFace(faceId, { character_id: characterId, character_name: name })
        } catch (error) {
          console.error('Failed to sync character creation with API:', error)
          // Could implement rollback logic here if needed
        }
      },

      updateCharacterName: async (characterId, name) => {
        // Update locally first
        set((state) => ({
          characters: state.characters.map(char =>
            char.id === characterId ? { ...char, name } : char
          ),
          detectedFaces: state.detectedFaces.map(face =>
            face.character_id === characterId 
              ? { ...face, character_name: name }
              : face
          ),
          captureShots: state.captureShots.map(shot => ({
            ...shot,
            detectedFaces: shot.detectedFaces.map(face =>
              face.character_id === characterId 
                ? { ...face, character_name: name }
                : face
            )
          }))
        }))

        // Sync with API
        try {
          await apiService.updateCharacter(characterId, { name })
        } catch (error) {
          console.error('Failed to sync character name update with API:', error)
        }
      },

      assignFaceToCharacter: (faceId, characterId) => {
        const { characters, detectedFaces } = get()
        const face = detectedFaces.find(f => f.id === faceId)
        const character = characters.find(c => c.id === characterId)
        
        if (!face || !character) return

        set((state) => ({
          detectedFaces: state.detectedFaces.map(f =>
            f.id === faceId 
              ? { ...f, character_id: characterId, character_name: character.name }
              : f
          ),
          captureShots: state.captureShots.map(shot => ({
            ...shot,
            detectedFaces: shot.detectedFaces.map(f =>
              f.id === faceId 
                ? { ...f, character_id: characterId, character_name: character.name }
                : f
            )
          }))
        }))

        // Update character stats
        get().updateCharactersFromFaces()
      },

      removeFaceFromCharacter: (faceId) => {
        set((state) => ({
          detectedFaces: state.detectedFaces.map(f =>
            f.id === faceId 
              ? { ...f, character_id: undefined, character_name: undefined }
              : f
          ),
          captureShots: state.captureShots.map(shot => ({
            ...shot,
            detectedFaces: shot.detectedFaces.map(f =>
              f.id === faceId 
                ? { ...f, character_id: undefined, character_name: undefined }
                : f
            )
          }))
        }))

        // Update character stats and remove empty characters
        get().updateCharactersFromFaces()
      },

      deleteCharacter: (characterId) => {
        set((state) => ({
          characters: state.characters.filter(char => char.id !== characterId),
          selectedCharacterId: state.selectedCharacterId === characterId ? null : state.selectedCharacterId,
          detectedFaces: state.detectedFaces.map(face =>
            face.character_id === characterId 
              ? { ...face, character_id: undefined, character_name: undefined }
              : face
          ),
          captureShots: state.captureShots.map(shot => ({
            ...shot,
            detectedFaces: shot.detectedFaces.map(face =>
              face.character_id === characterId 
                ? { ...face, character_id: undefined, character_name: undefined }
                : face
            )
          }))
        }))
      },

      selectCharacter: (characterId) => {
        set({ selectedCharacterId: characterId })
      },

      getCharacterFaces: (characterId) => {
        return get().detectedFaces.filter(face => 
          face.character_id === characterId && !face.deleted_at
        )
      },

      updateCharactersFromFaces: () => {
        const { detectedFaces, captureShots } = get()
        const characterMap = new Map<string, DetectedFace[]>()
        
        // Group faces by character_id
        detectedFaces.forEach(face => {
          if (face.character_id && !face.deleted_at) {
            if (!characterMap.has(face.character_id)) {
              characterMap.set(face.character_id, [])
            }
            characterMap.get(face.character_id)!.push(face)
          }
        })

        // Update character stats
        set((state) => {
          const updatedCharacters = state.characters.map(character => {
            const characterFaces = characterMap.get(character.id) || []
            
            if (characterFaces.length === 0) {
              return null // Mark for removal
            }

            // Get timestamps from captures
            const timestamps = characterFaces.map(face => {
              const capture = captureShots.find(shot => shot.id === face.capture_id)
              return capture?.timestamp || 0
            })
            const confidences = characterFaces.map(f => f.confidence)
            
            // Find the best representative face (highest confidence)
            const bestFace = characterFaces.reduce((best, current) => 
              current.confidence > best.confidence ? current : best
            )

            return {
              ...character,
              face_count: characterFaces.length,
              first_seen: Math.min(...timestamps),
              last_seen: Math.max(...timestamps),
              representative_face: bestFace,
              confidence: confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
            }
          }).filter(Boolean) as Character[]

          return { characters: updatedCharacters }
        })
      },

      findBestCharacterMatch: (faceDescriptor: Float32Array) => {
        const { characters, detectedFaces } = get()
        const SIMILARITY_THRESHOLD = 0.6 // Distance threshold for considering faces as same person
        
        let bestMatch: Character | null = null
        let bestDistance = Infinity

        for (const character of characters) {
          // Get all faces for this character that have descriptors
          const characterFaces = detectedFaces.filter(face => 
            face.character_id === character.id && 
            face.descriptor && 
            !face.deleted_at
          )

          // Find the most similar face in this character
          for (const face of characterFaces) {
            if (face.descriptor) {
              const distance = faceDetectionService.computeSimilarity(faceDescriptor, face.descriptor)
              
              if (distance < bestDistance && distance < SIMILARITY_THRESHOLD) {
                bestDistance = distance
                bestMatch = character
              }
            }
          }
        }

        return bestMatch
      },

      deleteCharacterCompletely: (characterId) => {
        set((state) => {
          // Get all faces for this character
          const characterFaceIds = state.detectedFaces
            .filter(face => face.character_id === characterId)
            .map(face => face.id)
          
          // Soft delete all faces belonging to this character
          const now = Date.now()
          const newDeletedIds = new Set(state.deletedFaceIds)
          const newDeletedDescriptors = new Map(state.deletedFaceDescriptors)
          
          // Mark all character faces as deleted and store their descriptors
          characterFaceIds.forEach(faceId => {
            newDeletedIds.add(faceId)
            const face = state.detectedFaces.find(f => f.id === faceId)
            if (face?.descriptor) {
              newDeletedDescriptors.set(faceId, face.descriptor)
            }
          })
          
          return {
            characters: state.characters.filter(char => char.id !== characterId),
            selectedCharacterId: state.selectedCharacterId === characterId ? null : state.selectedCharacterId,
            detectedFaces: state.detectedFaces.map(face =>
              face.character_id === characterId 
                ? { 
                    ...face, 
                    character_id: undefined, 
                    character_name: undefined,
                    deleted_at: now
                  }
                : face
            ),
            captureShots: state.captureShots.map(shot => ({
              ...shot,
              detectedFaces: shot.detectedFaces.map(face =>
                face.character_id === characterId 
                  ? { 
                      ...face, 
                      character_id: undefined, 
                      character_name: undefined,
                      deleted_at: now
                    }
                  : face
              )
            })),
            deletedFaceIds: newDeletedIds,
            deletedFaceDescriptors: newDeletedDescriptors,
            totalActiveFaces: state.totalActiveFaces - characterFaceIds.length
          }
        })
      },

      cleanupOrphanedData: () => {
        set((state) => {
          // Remove characters that no longer have any active faces
          const activeCharacterIds = new Set(
            state.detectedFaces
              .filter(face => face.character_id && !face.deleted_at)
              .map(face => face.character_id)
          )
          
          const cleanedCharacters = state.characters.filter(char => 
            activeCharacterIds.has(char.id)
          )
          
          // Remove orphaned descriptors (faces that no longer exist)
          const existingFaceIds = new Set(state.detectedFaces.map(face => face.id))
          const cleanedDeletedDescriptors = new Map()
          
          for (const [faceId, descriptor] of state.deletedFaceDescriptors) {
            // Keep descriptor if the face still exists (even if deleted) or if it's in deletedFaceIds
            if (existingFaceIds.has(faceId) || state.deletedFaceIds.has(faceId)) {
              cleanedDeletedDescriptors.set(faceId, descriptor)
            }
          }
          
          return {
            characters: cleanedCharacters,
            selectedCharacterId: cleanedCharacters.find(c => c.id === state.selectedCharacterId) 
              ? state.selectedCharacterId 
              : null,
            deletedFaceDescriptors: cleanedDeletedDescriptors
          }
        })
      },

      // Simple utility for getting unassigned faces
      getUnassignedFaces: () => {
        const { detectedFaces } = get()
        return detectedFaces.filter(face => 
          !face.character_id && !face.deleted_at
        )
      }
    }),
    {
      name: 'face-detection-store'
    }
  )
)

// Export the interfaces for use in components
export type { ProcessingOptions }
// DetectedFace is already exported above as an interface 