'use client'

import { useState } from 'react'
import { apiService } from '../services/api'
import { toast } from 'sonner'
import { useFaceDetectionStore } from '../stores'

export function ApiTestPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const { totalFaces, totalActiveFaces, characters, captureShots } = useFaceDetectionStore()

  const testCharacterCreation = async () => {
    const mockCharacter = {
      id: `test_char_${Date.now()}`,
      name: 'Test Character',
      face_count: 3,
      first_seen: Date.now() / 1000,
      last_seen: Date.now() / 1000,
      confidence: 0.89
    }
    
    console.group('🧪 API Test: Character Creation')
    console.log('Request Body:', mockCharacter)
    console.groupEnd()
    
    toast.loading('Testing character creation...', { id: 'test-char' })
    
    try {
      await apiService.createCharacter(mockCharacter, 'test-char')
    } catch (error) {
      toast.error('Character creation failed', { 
        id: 'test-char',
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const testBulkOperations = async () => {
    const mockUpdates = [
      { faceId: 'face_1', updates: { character_name: 'John Doe' } },
      { faceId: 'face_2', updates: { character_name: 'Jane Smith' } },
      { faceId: 'face_3', updates: { character_name: 'Bob Johnson' } }
    ]
    
    console.group('🧪 API Test: Bulk Face Updates')
    console.log('Request Body:', mockUpdates)
    console.groupEnd()
    
    toast.loading('Testing bulk face updates...', { id: 'test-bulk' })
    
    try {
      await apiService.bulkUpdateFaces(mockUpdates, 'test-bulk')
    } catch (error) {
      toast.error('Bulk operations failed', { 
        id: 'test-bulk',
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const testAnalyticsSync = async () => {
    const stats = {
      total_captures: captureShots.length,
      total_faces: totalFaces,
      total_characters: characters.length,
      active_faces: totalActiveFaces,
      session_timestamp: Date.now(),
      test_mode: true
    }
    
    console.group('🧪 API Test: Analytics Sync')
    console.log('Request Body:', stats)
    console.groupEnd()
    
    toast.loading('Testing analytics sync...', { id: 'test-analytics' })
    
    try {
      await apiService.syncAnalytics(stats, 'test-analytics')
    } catch (error) {
      toast.error('Analytics sync failed', { 
        id: 'test-analytics',
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors text-sm font-medium z-50"
      >
        🧪 API Test Panel
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">API Test Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={testCharacterCreation}
          className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm font-medium"
        >
          Test Character Creation
        </button>
        
        <button
          onClick={testBulkOperations}
          className="w-full px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm font-medium"
        >
          Test Bulk Operations
        </button>
        
        <button
          onClick={testAnalyticsSync}
          className="w-full px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors text-sm font-medium"
        >
          Test Analytics Sync
        </button>
        
        <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
          📊 Current Stats:<br/>
          Captures: {captureShots.length}<br/>
          Faces: {totalFaces}<br/>
          Characters: {characters.length}
        </div>
      </div>
    </div>
  )
} 