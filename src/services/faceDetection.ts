import * as faceapi from 'face-api.js'

export interface DetectedFace {
  id: string
  box: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  landmarks?: Array<{ x: number; y: number }>
  descriptor?: Float32Array
  expressions?: {
    expression: string
    probability: number
  }[]
  age?: number
  gender?: string
}

export interface ProcessingOptions {
  detectFaces: boolean
  detectLandmarks: boolean
  detectExpressions: boolean
  detectAge: boolean
  detectGender: boolean
  recognizeFaces: boolean
}

export interface CaptureShot {
  id: string
  timestamp: number
  dataUrl: string
  blob?: Blob
  width: number
  height: number
}

class FaceDetectionService {
  private modelsLoaded = false
  private modelPath = '/weights'

  async loadModels(onProgress?: (progress: number) => void): Promise<void> {
    if (this.modelsLoaded) return

    try {
      onProgress?.(10)
      
      // Load core detection model
      await faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelPath)
      onProgress?.(30)
      
      // Load landmarks model  
      await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelPath)
      onProgress?.(50)
      
      // Load expression recognition model
      await faceapi.nets.faceExpressionNet.loadFromUri(this.modelPath)
      onProgress?.(70)
      
      // Load age/gender model
      await faceapi.nets.ageGenderNet.loadFromUri(this.modelPath)
      onProgress?.(90)
      
      // Load face recognition model for descriptors
      await faceapi.nets.faceRecognitionNet.loadFromUri(this.modelPath)
      onProgress?.(100)
      
      this.modelsLoaded = true
      console.log('✅ Face-api.js models loaded successfully')
      
    } catch (error) {
      console.error('❌ Failed to load face-api.js models:', error)
      throw new Error('Failed to load face detection models. Please check that model files are available.')
    }
  }

  async detectFaces(
    capture: CaptureShot, 
    options: ProcessingOptions
  ): Promise<DetectedFace[]> {
    if (!this.modelsLoaded) {
      throw new Error('Models not loaded. Call loadModels() first.')
    }

    try {
      // Create image element from data URL
      const img = await this.createImageFromDataUrl(capture.dataUrl)
      
      // Execute detection pipeline based on options
      let detections: any[]

      if (options.recognizeFaces) {
        // Full pipeline with face descriptors for recognition
        detections = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors()
          .withFaceExpressions()
      } else if (options.detectLandmarks && options.detectExpressions) {
        // Faces + landmarks + expressions  
        detections = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceExpressions()
      } else if (options.detectLandmarks) {
        // Faces + landmarks only
        detections = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
      } else if (options.detectExpressions) {
        // Faces + expressions only
        detections = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceExpressions()
      } else {
        // Faces only
        detections = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      }

      // Convert face-api.js results to our format
      const faces: DetectedFace[] = detections.map((detection: any, index: number) => {
        const face: DetectedFace = {
          id: `face_${capture.id}_${index}_${Date.now()}`,
          box: {
            x: detection.detection.box.x,
            y: detection.detection.box.y,
            width: detection.detection.box.width,
            height: detection.detection.box.height
          },
          confidence: detection.detection.score
        }

        // Add landmarks if available
        if (detection.landmarks && detection.landmarks.positions) {
          face.landmarks = detection.landmarks.positions.map((point: any) => ({
            x: point.x,
            y: point.y
          }))
        }

        // Add expressions if available
        if (detection.expressions) {
          face.expressions = Object.entries(detection.expressions)
            .map(([expression, probability]) => ({
              expression,
              probability: Number(probability)
            }))
            .sort((a, b) => b.probability - a.probability)
        }

        // Add age/gender if available
        if (detection.age !== undefined && detection.gender !== undefined) {
          face.age = Math.round(Number(detection.age))
          face.gender = String(detection.gender)
        }

        // Add face descriptor if available
        if (options.recognizeFaces && detection.descriptor) {
          face.descriptor = detection.descriptor
        }

        return face
      })

      console.log(`✅ Detected ${faces.length} faces in capture ${capture.id}`)
      return faces

    } catch (error) {
      console.error('❌ Face detection failed:', error)
      throw new Error(`Face detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = dataUrl
    })
  }

  isModelsLoaded(): boolean {
    return this.modelsLoaded
  }

  // Get available model capabilities
  getLoadedCapabilities(): string[] {
    const capabilities = []
    if (faceapi.nets.ssdMobilenetv1.isLoaded) capabilities.push('Face Detection')
    if (faceapi.nets.faceLandmark68Net.isLoaded) capabilities.push('Landmarks')
    if (faceapi.nets.faceExpressionNet.isLoaded) capabilities.push('Expressions')
    if (faceapi.nets.ageGenderNet.isLoaded) capabilities.push('Age & Gender')
    if (faceapi.nets.faceRecognitionNet.isLoaded) capabilities.push('Face Recognition')
    return capabilities
  }

  // Compute similarity between two face descriptors
  computeSimilarity(descriptor1: Float32Array, descriptor2: Float32Array): number {
    return faceapi.euclideanDistance(descriptor1, descriptor2)
  }

  // Check if two faces are similar (returns true if distance is below threshold)
  areFacesSimilar(descriptor1: Float32Array, descriptor2: Float32Array, threshold: number = 0.6): boolean {
    const distance = this.computeSimilarity(descriptor1, descriptor2)
    return distance < threshold
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService() 