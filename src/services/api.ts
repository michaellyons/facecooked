import { toast } from 'sonner'
import type { DetectedFace, Character, CaptureShot } from '../stores'
import type { ApiResponse, ProcessingOptions } from '../types'

// Simulated API delay
const API_DELAY = 800 + Math.random() * 400 // 800-1200ms

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

class ApiService {
  private baseUrl = 'https://api.facecooked.com/v1' // Simulated API endpoint

  // Helper to create consistent API responses
  private createResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now()
    }
  }

  // Character Management APIs
  async createCharacter(character: Character, toastId?: string): Promise<ApiResponse<Character>> {
    console.group('🎭 API Call: Create Character')
    console.log('Endpoint:', `${this.baseUrl}/characters`)
    console.log('Method:', 'POST')
    console.log('Request Body:', character)
    console.table({
      id: character.id,
      name: character.name,
      face_count: character.face_count,
      confidence: Math.round(character.confidence * 100) + '%',
      first_seen: new Date(character.first_seen * 1000).toLocaleTimeString(),
      last_seen: new Date(character.last_seen * 1000).toLocaleTimeString()
    })
    console.groupEnd()

    await delay(API_DELAY)
    
    // Simulate API success
    toast.success(`Character "${character.name}" created successfully`, {
      id: toastId,
      description: `${character.face_count} appearance${character.face_count !== 1 ? 's' : ''} detected`,
      duration: 4000
    })

    return this.createResponse(character)
  }

  async updateCharacter(characterId: string, updates: Partial<Character>): Promise<ApiResponse<Character>> {
    console.group('✏️ API Call: Update Character')
    console.log('Endpoint:', `${this.baseUrl}/characters/${characterId}`)
    console.log('Method:', 'PATCH')
    console.table(updates)
    console.groupEnd()

    await delay(API_DELAY)
    
    toast.success('Character updated successfully', {
      description: updates.name ? `Renamed to "${updates.name}"` : 'Character details updated',
      duration: 4000
    })

    return this.createResponse({ ...updates, id: characterId } as Character)
  }

  async deleteCharacter(characterId: string, permanent: boolean = false): Promise<ApiResponse<null>> {
    console.group(`🗑️ API Call: ${permanent ? 'Permanently Delete' : 'Delete'} Character`)
    console.log('Endpoint:', `${this.baseUrl}/characters/${characterId}`)
    console.log('Method:', 'DELETE')
    console.log('Permanent:', permanent)
    console.table({ characterId, permanent })
    console.groupEnd()

    await delay(API_DELAY)
    
    if (permanent) {
      toast.error('Character permanently deleted', {
        description: 'All faces and descriptors removed from system',
        duration: 4000
      })
    } else {
      toast.success('Character removed', {
        description: 'Faces converted to unassigned',
        duration: 4000
      })
    }

    return this.createResponse(null)
  }

  // Face Management APIs
  async updateFace(faceId: string, updates: Partial<DetectedFace>): Promise<ApiResponse<DetectedFace>> {
    console.group('👤 API Call: Update Face')
    console.log('Endpoint:', `${this.baseUrl}/faces/${faceId}`)
    console.log('Method:', 'PATCH')
    console.table({
      faceId,
      character_id: updates.character_id || 'unassigned',
      character_name: updates.character_name || 'N/A',
      confidence: updates.confidence ? Math.round(updates.confidence * 100) + '%' : 'unchanged'
    })
    console.groupEnd()

    await delay(API_DELAY)
    
    if (updates.character_id) {
      toast.success('Face assigned to character', {
        description: updates.character_name ? `Assigned to "${updates.character_name}"` : 'Character assignment updated',
        duration: 4000
      })
    } else {
      toast.info('Face updated', {
        description: 'Face details synchronized',
        duration: 4000
      })
    }

    return this.createResponse({ ...updates, id: faceId } as DetectedFace)
  }

  async deleteFace(faceId: string, permanent: boolean = false): Promise<ApiResponse<null>> {
    console.group(`🚫 API Call: ${permanent ? 'Permanently Delete' : 'Hide'} Face`)
    console.log('Endpoint:', `${this.baseUrl}/faces/${faceId}`)
    console.log('Method:', 'DELETE')
    console.log('Permanent:', permanent)
    console.table({ faceId, permanent })
    console.groupEnd()

    await delay(API_DELAY)
    
    if (permanent) {
      toast.error('Face permanently deleted', {
        description: 'Descriptor stored to prevent future detection',
        duration: 4000
      })
    } else {
      toast.warning('Face hidden', {
        description: 'Face can be restored later',
        duration: 4000
      })
    }

    return this.createResponse(null)
  }

  async restoreFace(faceId: string): Promise<ApiResponse<DetectedFace>> {
    console.group('🔄 API Call: Restore Face')
    console.log('Endpoint:', `${this.baseUrl}/faces/${faceId}/restore`)
    console.log('Method:', 'POST')
    console.table({ faceId })
    console.groupEnd()

    await delay(API_DELAY)
    
    toast.success('Face restored', {
      description: 'Face is now visible and can be assigned to characters',
      duration: 4000
    })

    return this.createResponse({ id: faceId } as DetectedFace)
  }

  // Video Processing APIs
  async uploadVideoMetadata(videoFile: File): Promise<ApiResponse<{ videoId: string }>> {
    console.group('📹 API Call: Upload Video Metadata')
    console.log('Endpoint:', `${this.baseUrl}/videos/upload`)
    console.log('Method:', 'POST')
    console.table({
      name: videoFile.name,
      size: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
      type: videoFile.type,
      lastModified: new Date(videoFile.lastModified).toLocaleString()
    })
    console.groupEnd()

    await delay(API_DELAY)
    
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    toast.success('Video metadata uploaded', {
      description: `Processing ${videoFile.name}`,
      duration: 4000
    })

    return this.createResponse({ videoId })
  }

  async saveCapture(capture: CaptureShot): Promise<ApiResponse<CaptureShot>> {
    console.group('📸 API Call: Save Frame Capture')
    console.log('Endpoint:', `${this.baseUrl}/captures`)
    console.log('Method:', 'POST')
    console.table({
      id: capture.id,
      timestamp: `${Math.floor(capture.timestamp / 60)}:${Math.floor(capture.timestamp % 60).toString().padStart(2, '0')}`,
      dimensions: `${capture.width}x${capture.height}`,
      faces_detected: capture.detectedFaces.length,
      processed: capture.isProcessed
    })
    console.groupEnd()

    await delay(API_DELAY)
    
    toast.success('Frame capture saved', {
      description: `${capture.detectedFaces.length} face${capture.detectedFaces.length !== 1 ? 's' : ''} detected`,
      duration: 4000
    })

    return this.createResponse(capture)
  }

  // Face Detection APIs
  async processFaceDetection(
    captureId: string,
    options: ProcessingOptions
  ): Promise<ApiResponse<DetectedFace[]>> {
    console.group('🤖 API Call: Process Face Detection')
    console.log('Endpoint:', `${this.baseUrl}/detection/process`)
    console.log('Method:', 'POST')
    console.log('Request Body:', { captureId, options })
    console.table({
      captureId,
      detectFaces: options.detectFaces,
      detectLandmarks: options.detectLandmarks,
      detectExpressions: options.detectExpressions,
      recognizeFaces: options.recognizeFaces
    })
    console.groupEnd()

    await delay(API_DELAY + 500) // Face detection takes longer
    
    toast.loading('Processing face detection...', {
      id: `detection-${captureId}`
    })

    // Simulate processing time
    await delay(1000)
    
    toast.success('Face detection completed', {
      id: `detection-${captureId}`,
      description: 'Results synchronized with server',
      duration: 4000
    })

    return this.createResponse([])
  }

  // Analytics APIs
  async syncAnalytics(stats: Record<string, unknown>, toastId?: string): Promise<ApiResponse<null>> {
    console.group('📊 API Call: Sync Analytics')
    console.log('Endpoint:', `${this.baseUrl}/analytics/sync`)
    console.log('Method:', 'POST')
    console.log('Request Body:', stats)
    console.table(stats)
    console.groupEnd()

    await delay(API_DELAY)
    
    toast.info('Analytics synchronized', {
      id: toastId,
      description: 'Usage statistics updated',
      duration: 4000
    })

    return this.createResponse(null)
  }

  // Bulk Operations
  async bulkUpdateFaces(
    updates: { faceId: string, updates: Partial<DetectedFace> }[],
    toastId?: string
  ): Promise<ApiResponse<null>> {
    console.group('📦 API Call: Bulk Update Faces')
    console.log('Endpoint:', `${this.baseUrl}/faces/bulk-update`)
    console.log('Method:', 'POST')
    console.log('Request Body:', updates)
    console.log(`Updating ${updates.length} faces`)
    console.table(updates.map(u => ({
      faceId: u.faceId,
      character_name: u.updates.character_name || 'N/A',
      changes: Object.keys(u.updates).join(', ')
    })))
    console.groupEnd()

    await delay(API_DELAY + (updates.length * 100)) // Scale with number of updates
    
    toast.success(`Bulk update completed`, {
      id: toastId,
      description: `${updates.length} face${updates.length !== 1 ? 's' : ''} updated`,
      duration: 4000
    })

    return this.createResponse(null)
  }
}

export const apiService = new ApiService() 