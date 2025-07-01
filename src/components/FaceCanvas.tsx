'use client'

import { useRef, useEffect } from 'react'

interface FaceCanvasProps {
  imageUrl: string
  faceBox: {
    x: number
    y: number
    width: number
    height: number
  }
  originalWidth: number
  originalHeight: number
  confidence: number
  className?: string
  onClick?: () => void
  isAssigned?: boolean
}

export function FaceCanvas({ 
  imageUrl, 
  faceBox, 
  originalWidth, 
  originalHeight, 
  confidence,
  className = '',
  onClick,
  isAssigned = false
}: FaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawFaceBox = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Calculate crop area around the face with padding
      const padding = 0.3 // 30% padding on each side
      const paddedWidth = faceBox.width * (1 + padding * 2)
      const paddedHeight = faceBox.height * (1 + padding * 2)
      
      // Center the padding around the face
      const cropX = Math.max(0, faceBox.x - faceBox.width * padding)
      const cropY = Math.max(0, faceBox.y - faceBox.height * padding)
      const cropWidth = Math.min(paddedWidth, originalWidth - cropX)
      const cropHeight = Math.min(paddedHeight, originalHeight - cropY)
      
      // Draw the cropped image to fill the entire canvas
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight, // source rectangle (crop area)
        0, 0, canvas.width, canvas.height     // destination rectangle (full canvas)
      )
      
      // Calculate face box position within the cropped area
      const faceInCropX = faceBox.x - cropX
      const faceInCropY = faceBox.y - cropY
      
      // Scale face coordinates to canvas size
      const scaleX = canvas.width / cropWidth
      const scaleY = canvas.height / cropHeight
      
      const scaledFaceBox = {
        x: faceInCropX * scaleX,
        y: faceInCropY * scaleY,
        width: faceBox.width * scaleX,
        height: faceBox.height * scaleY
      }
      
      // Draw subtle face detection box (much less prominent since face fills the view)
      ctx.strokeStyle = isAssigned ? '#4ade80' : '#facc15'
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.6
      ctx.strokeRect(scaledFaceBox.x, scaledFaceBox.y, scaledFaceBox.width, scaledFaceBox.height)
      
      // Add very subtle background
      ctx.fillStyle = isAssigned ? 'rgba(74, 222, 128, 0.05)' : 'rgba(250, 204, 21, 0.05)'
      ctx.fillRect(scaledFaceBox.x, scaledFaceBox.y, scaledFaceBox.width, scaledFaceBox.height)
      
      // Reset alpha for badge
      ctx.globalAlpha = 1.0
      
      // Draw confidence badge in top-right corner
      const badgeText = `${Math.round(confidence * 100)}%`
      const badgeWidth = 35
      const badgeHeight = 18
      const badgeX = canvas.width - badgeWidth - 5
      const badgeY = 5
      
      // Badge background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight)
      
      // Badge text
      ctx.fillStyle = 'white'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 13)
    }

    // Load image and draw when ready
    if (img.complete) {
      drawFaceBox()
    } else {
      img.onload = drawFaceBox
    }
  }, [imageUrl, faceBox, originalWidth, originalHeight, confidence, isAssigned])

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover rounded cursor-pointer"
        width={300}
        height={300}
      />
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Face detection"
        className="hidden"
        crossOrigin="anonymous"
      />
    </div>
  )
} 