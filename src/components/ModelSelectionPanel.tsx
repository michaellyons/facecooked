'use client'

import { useState } from 'react'
import { useAssetsStore, FACE_API_MODELS } from '../stores/modules/assets'
import type { ModelCapability, ModelSelection } from '../types'
import { 
  Brain, 
  Eye, 
  Target, 
  Zap, 
  CheckCircle, 
  Circle, 
  ChevronDown,
  ChevronUp,
  Info,
  Activity,
  Gauge
} from 'lucide-react'

const CAPABILITY_ICONS: Record<ModelCapability, typeof Target> = {
  detection: Target,
  landmarks: Eye,
  recognition: Brain,
  analysis: Activity
}

const PERFORMANCE_COLORS = {
  'very-high': 'text-green-500',
  'high': 'text-blue-500',
  'medium': 'text-yellow-500',
  'low': 'text-red-500'
} as const

const ACCURACY_COLORS = {
  'very-high': 'text-green-500',
  'high': 'text-blue-500',
  'medium': 'text-yellow-500',
  'low': 'text-red-500'
} as const

interface ModelSelectionPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export function ModelSelectionPanel({ isOpen, onToggle }: ModelSelectionPanelProps) {
  const {
    modelGroups,
    availableCapabilities,
    selectedModels,
    setSelectedModel,
    getLoadedModelsByCapability
  } = useAssetsStore()

  const [expandedGroups, setExpandedGroups] = useState<Set<ModelCapability>>(new Set(['detection']))

  const toggleGroup = (capability: ModelCapability) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(capability)) {
      newExpanded.delete(capability)
    } else {
      newExpanded.add(capability)
    }
    setExpandedGroups(newExpanded)
  }

  const handleModelSelect = (capability: ModelCapability, modelId: string) => {
    setSelectedModel(capability, modelId)
  }

  const getModelInfo = (modelId: string) => {
    return Object.values(FACE_API_MODELS).find(model => model.id === modelId)
  }

  const formatPerformance = (performance: string) => {
    switch (performance) {
      case 'very-high': return 'Very Fast'
      case 'high': return 'Fast'
      case 'medium': return 'Medium'
      case 'low': return 'Slow'
      default: return performance
    }
  }

  const formatAccuracy = (accuracy: string) => {
    switch (accuracy) {
      case 'very-high': return 'Excellent'
      case 'high': return 'Good'
      case 'medium': return 'Fair'
      case 'low': return 'Basic'
      default: return accuracy
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">AI Models</h3>
        </div>
        <button
          onClick={onToggle}
          className="w-8 h-8 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800 flex items-center justify-center"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Model Groups */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-4 space-y-4">
          {Object.entries(modelGroups).map(([capabilityKey, group]) => {
            const capability = capabilityKey as ModelCapability
            const IconComponent = CAPABILITY_ICONS[capability]
            const isAvailable = availableCapabilities.includes(capability)
            const isExpanded = expandedGroups.has(capability)
            const loadedModels = getLoadedModelsByCapability(capability)
            const selectedModelId = selectedModels[capability as keyof ModelSelection]

            return (
              <div
                key={capability}
                className={`border rounded-lg transition-all ${
                  isAvailable 
                    ? 'border-gray-600 bg-gray-800/50' 
                    : 'border-gray-700 bg-gray-900/50 opacity-60'
                }`}
              >
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(capability)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-5 h-5 ${isAvailable ? 'text-blue-400' : 'text-gray-600'}`} />
                    <div>
                      <h4 className={`font-medium ${isAvailable ? 'text-white' : 'text-gray-500'}`}>
                        {group.name}
                      </h4>
                      <p className={`text-sm ${isAvailable ? 'text-gray-400' : 'text-gray-600'}`}>
                        {loadedModels.length} of {group.models.length} models loaded
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAvailable && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400">Active</span>
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3">
                    {/* Description */}
                    <p className="text-sm text-gray-400 px-8">
                      {group.description}
                    </p>

                    {/* Model Selection */}
                    {isAvailable && loadedModels.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-300 px-8">
                          Select Model for {group.name}:
                        </h5>
                        <div className="space-y-2">
                          {loadedModels.map((asset) => {
                            const modelInfo = getModelInfo(asset.id)
                            const isSelected = selectedModelId === asset.id

                            return (
                              <button
                                key={asset.id}
                                onClick={() => handleModelSelect(capability, asset.id)}
                                className={`w-full p-3 rounded-lg text-left transition-all ${
                                  isSelected
                                    ? 'bg-blue-600/20 border border-blue-500/50'
                                    : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    {isSelected ? (
                                      <CheckCircle className="w-4 h-4 text-blue-400" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-gray-600" />
                                    )}
                                    <div>
                                      <div className="text-sm font-medium text-white">
                                        {modelInfo?.description || asset.id}
                                      </div>
                                      <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                                        {modelInfo && (
                                          <>
                                            <div className="flex items-center space-x-1">
                                              <Zap className="w-3 h-3" />
                                              <span className={PERFORMANCE_COLORS[modelInfo.performance as keyof typeof PERFORMANCE_COLORS]}>
                                                {formatPerformance(modelInfo.performance)}
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                              <Gauge className="w-3 h-3" />
                                              <span className={ACCURACY_COLORS[modelInfo.accuracy as keyof typeof ACCURACY_COLORS]}>
                                                {formatAccuracy(modelInfo.accuracy)}
                                              </span>
                                            </div>
                                          </>
                                        )}
                                        {asset.size && (
                                          <span>{(asset.size / 1024 / 1024).toFixed(1)}MB</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {isSelected && (
                                    <div className="px-2 py-1 bg-blue-600/30 text-blue-300 text-xs rounded">
                                      Selected
                                    </div>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Features List */}
                    <div className="px-8">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Features:</h5>
                      <ul className="space-y-1">
                        {group.features.map((feature, index) => (
                          <li key={index} className="text-xs text-gray-400 flex items-start space-x-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Current Selection Summary */}
        <div className="border-t border-gray-700 p-4 bg-gray-800/30">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center space-x-2">
            <Info className="w-4 h-4" />
            <span>Current Selection</span>
          </h4>
          <div className="space-y-2">
            {Object.entries(selectedModels).map(([capabilityKey, modelId]) => {
              const capability = capabilityKey as ModelCapability
              const group = modelGroups[capability as keyof typeof modelGroups]
              const modelInfo = modelId ? getModelInfo(modelId) : null
              const isAvailable = availableCapabilities.includes(capability)

              if (!modelId || !isAvailable) return null

              return (
                <div key={capability} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{group.name}:</span>
                  <span className="text-white font-medium">
                    {modelInfo?.description || modelId}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
} 