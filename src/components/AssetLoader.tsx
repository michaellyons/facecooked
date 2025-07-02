'use client'

import { useAssetsStore } from '../stores'
// MODEL_GROUPS removed as it's not used in this component
import type { ModelCapability } from '../types'
import { useState, useEffect } from 'react'

export function AssetLoader() {
  const {
    assets,
    loadingProgress,
    isLoading,
    hasInitialized,
    modelGroups,
    availableCapabilities,
    loadAllAssets,
    getLoadedAssets,
    getFailedAssets,
    getAvailableFeatures
  } = useAssetsStore()

  const [showDetails, setShowDetails] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const loadedAssets = getLoadedAssets()
  const failedAssets = getFailedAssets()
  const totalAssets = Object.keys(assets).length
  const availableFeatures = getAvailableFeatures()

  // Auto-load all assets on mount
  useEffect(() => {
    const autoLoad = async () => {
      if (!hasInitialized && !isLoading && totalAssets === 0) {
        console.log('🚀 Auto-loading all assets...')
        try {
          await loadAllAssets()
        } catch (error) {
          console.error('Failed to auto-load assets:', error)
        }
      }
    }

    // Small delay to show the initial state briefly
    const timer = setTimeout(autoLoad, 800)
    return () => clearTimeout(timer)
  }, [hasInitialized, isLoading, totalAssets, loadAllAssets])

  // Handle completion with smooth transition
  useEffect(() => {
    if (hasInitialized && !isLoading && !isComplete) {
      // Add a delay for smooth transition
      const timer = setTimeout(() => {
        setIsComplete(true)
        // Show success state briefly before transitioning
        setTimeout(() => setShowSuccess(true), 500)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [hasInitialized, isLoading, isComplete])

  const handleLoadAll = async () => {
    try {
      await loadAllAssets()
    } catch (error) {
      console.error('Failed to load assets:', error)
    }
  }

  // Removed unused functions: handleLoadModelsOnly, handleLoadByCapability, toggleCapability

  const getCapabilityIcon = (capability: ModelCapability) => {
    const icons: Record<ModelCapability, string> = {
      detection: '🔍',
      landmarks: '📍',
      recognition: '👤',
      analysis: '🧠'
    }
    return icons[capability]
  }

  // Show success state with ready message
  if (showSuccess && isComplete) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 bg-gray-800 rounded-lg shadow-lg border border-gray-600">
        <div className="text-center space-y-6">
          <div className="text-6xl animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-white">
            FaceCooked is Ready!
          </h2>
          <p className="text-gray-300">
            All AI models loaded successfully. You can now upload videos for face detection.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            {availableCapabilities.map(capability => {
              const group = modelGroups[capability]
              return (
                <div key={capability} className="flex items-center space-x-2 bg-gray-700 p-3 rounded-lg">
                  <span className="text-lg">{getCapabilityIcon(capability)}</span>
                  <span className="font-medium text-white">{group.name}</span>
                  <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                    ✓
                  </span>
                </div>
              )
            })}
          </div>

          <div className="text-sm text-gray-300 mt-4">
            {availableFeatures.length} features available • {loadedAssets.length} assets loaded
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-600">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🎭 Initializing FaceCooked
      </h2>
      
      <div className="space-y-6">
        {/* Auto-loading State */}
        {!hasInitialized && totalAssets === 0 && !isLoading && (
          <div className="text-center space-y-4">
            <div className="text-4xl animate-pulse">⏳</div>
            <p className="text-gray-300">
              Preparing to load AI models and assets...
            </p>
          </div>
        )}

        {/* Loading Progress */}
        {(isLoading || (!isComplete && hasInitialized)) && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">🤖</div>
              <p className="text-gray-300">
                Loading face detection models and assets...
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Progress</span>
                <span>{Math.round(loadingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-3">
                <div
                  className="bg-gray-400 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>

            {/* Real-time Asset Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center mt-4">
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="text-xl font-bold text-gray-300">{loadedAssets.length}</div>
                <div className="text-sm text-gray-400">Loaded</div>
              </div>
              
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="text-xl font-bold text-gray-300">
                  {Object.values(assets).filter(a => a.loading).length}
                </div>
                <div className="text-sm text-gray-400">Loading</div>
              </div>
              
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="text-xl font-bold text-gray-300">{failedAssets.length}</div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
            </div>

            {/* Available Capabilities as they activate */}
            {availableCapabilities.length > 0 && (
              <div className="border border-gray-600 rounded-lg p-4 bg-gray-700 mt-4">
                <h3 className="font-semibold text-white mb-3 flex items-center">
                  🚀 Capabilities Ready ({availableCapabilities.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableCapabilities.map(capability => {
                    const group = modelGroups[capability]
                    return (
                      <div key={capability} className="flex items-center space-x-2 animate-fade-in">
                        <span className="text-lg">{getCapabilityIcon(capability)}</span>
                        <span className="font-medium text-gray-300">{group.name}</span>
                        <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                          ✓
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Loading Details Toggle */}
            <div className="text-center">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                {showDetails ? 'Hide Details' : 'Show Loading Details'}
              </button>
            </div>

            {/* Detailed Asset Loading View */}
            {showDetails && totalAssets > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="font-medium text-white">Loading Progress:</h3>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {Object.values(assets).map((asset) => (
                    <div
                      key={asset.id}
                      className={`flex justify-between items-center p-3 rounded border ${
                        asset.loaded
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : asset.error
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : asset.loading
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                          : 'bg-gray-50 border-gray-200 text-gray-800'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-sm">{asset.id}</span>
                        <div className="text-xs opacity-75">
                          {asset.type} {asset.size && `• ${Math.round(asset.size / 1024)}KB`}
                        </div>
                      </div>
                      <span className="text-lg">
                        {asset.loaded ? '✅' : asset.error ? '❌' : asset.loading ? '⏳' : '⏸️'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completion State */}
        {isComplete && !showSuccess && (
          <div className="text-center space-y-4">
            <div className="text-4xl animate-pulse">✨</div>
            <p className="text-gray-300">
              Finalizing setup...
            </p>
          </div>
        )}

        {/* Manual Controls (if auto-load fails) */}
        {!isLoading && !hasInitialized && totalAssets === 0 && (
          <div className="text-center pt-4 border-t border-gray-600">
            <p className="text-gray-400 mb-4 text-sm">
              Having trouble? Load manually:
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleLoadAll}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
              >
                🚀 Load All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 