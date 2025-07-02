import React, { useState, useCallback } from 'react'
import { useFaceDetectionStore, type DetectedFace } from '../stores'
import { Users, User, Plus, X, Play } from 'lucide-react'

interface UIFaceGroup {
  id: string
  faces: DetectedFace[]
  name?: string
}

interface DragState {
  isDragging: boolean
  draggedFaceId: string | null
  dropTargetGroupId: string | null
}

interface FaceGroupingPanelProps {
  onSeekToTime?: (timestamp: number) => void
}

const FaceGroupingPanel: React.FC<FaceGroupingPanelProps> = ({ onSeekToTime }) => {
  const { getUnassignedFaces, createCharacter, assignFaceToCharacter } = useFaceDetectionStore()
  
  const [uiGroups, setUIGroups] = useState<UIFaceGroup[]>([])
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedFaceId: null,
    dropTargetGroupId: null
  })
  const [assigningGroupId, setAssigningGroupId] = useState<string | null>(null)
  const [characterName, setCharacterName] = useState('')

  const unassignedFaces = getUnassignedFaces()
  const ungroupedFaces = unassignedFaces.filter(face => 
    !uiGroups.some(group => group.faces.some(groupFace => groupFace.id === face.id))
  )

  // Handle face drag start
  const handleFaceDragStart = useCallback((e: React.DragEvent, face: DetectedFace) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', face.id)
    
    setDragState({
      isDragging: true,
      draggedFaceId: face.id,
      dropTargetGroupId: null
    })
  }, [])

  // Handle face drag end
  const handleFaceDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedFaceId: null,
      dropTargetGroupId: null
    })
  }, [])

  // Handle drop on group
  const handleGroupDrop = useCallback((e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault()
    
    const faceId = e.dataTransfer.getData('text/plain')
    if (!faceId) return
    
    const face = unassignedFaces.find(f => f.id === faceId)
    if (!face) return
    
    setUIGroups(prev => prev.map(group => {
      if (group.id === targetGroupId) {
        // Don't add if face is already in this group
        if (group.faces.some(f => f.id === faceId)) return group
        
        return {
          ...group,
          faces: [...group.faces, face]
        }
      } else {
        // Remove face from other groups
        return {
          ...group,
          faces: group.faces.filter(f => f.id !== faceId)
        }
      }
    }).filter(group => group.faces.length > 0)) // Remove empty groups
    
    setDragState(prev => ({ ...prev, dropTargetGroupId: null }))
  }, [unassignedFaces])

  // Handle drop on ungrouped area
  const handleUngroupedDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    const faceId = e.dataTransfer.getData('text/plain')
    if (!faceId) return
    
    // Remove face from all groups
    setUIGroups(prev => prev.map(group => ({
      ...group,
      faces: group.faces.filter(f => f.id !== faceId)
    })).filter(group => group.faces.length > 0)) // Remove empty groups
  }, [])

  // Handle drop to create new group
  const handleCreateGroupDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    const faceId = e.dataTransfer.getData('text/plain')
    if (!faceId) return
    
    const face = unassignedFaces.find(f => f.id === faceId)
    if (!face) return
    
    // Check if face is already in a group
    const existingGroup = uiGroups.find(group => 
      group.faces.some(groupFace => groupFace.id === faceId)
    )
    
    if (existingGroup) {
      // If only one face left in existing group, don't create new group
      if (existingGroup.faces.length === 1) return
      
      // Remove from existing group and create new group
      setUIGroups(prev => {
        const updatedGroups = prev.map(group => 
          group.id === existingGroup.id 
            ? { ...group, faces: group.faces.filter(f => f.id !== faceId) }
            : group
        ).filter(group => group.faces.length > 0)
        
        const newGroup: UIFaceGroup = {
          id: `ui_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          faces: [face]
        }
        
        return [...updatedGroups, newGroup]
      })
    } else {
      // Create new group with this face
      const newGroup: UIFaceGroup = {
        id: `ui_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        faces: [face]
      }
      
      setUIGroups(prev => [...prev, newGroup])
    }
  }, [unassignedFaces, uiGroups])

  // Handle group drag over
  const handleGroupDragOver = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragState(prev => ({ ...prev, dropTargetGroupId: groupId }))
  }, [])

  // Handle group drag leave
  const handleGroupDragLeave = useCallback(() => {
    setDragState(prev => ({ ...prev, dropTargetGroupId: null }))
  }, [])

  // Assign group to character
  const handleAssignGroup = useCallback(async (groupId: string, name: string) => {
    const group = uiGroups.find(g => g.id === groupId)
    if (!group || group.faces.length === 0 || !name.trim()) return
    
    try {
      // Create character with first face
      await createCharacter(name.trim(), group.faces[0].id)
      
      // Get the created character
      const { characters } = useFaceDetectionStore.getState()
      const character = characters.find(c => c.name === name.trim())
      
      if (character) {
        // Assign remaining faces to the character
        group.faces.slice(1).forEach(face => {
          assignFaceToCharacter(face.id, character.id)
        })
        
        // Remove the group from UI
        setUIGroups(prev => prev.filter(g => g.id !== groupId))
      }
      
      setAssigningGroupId(null)
      setCharacterName('')
    } catch (error) {
      console.error('Failed to assign group to character:', error)
    }
  }, [uiGroups, createCharacter, assignFaceToCharacter])

  // Delete group
  const handleDeleteGroup = useCallback((groupId: string) => {
    setUIGroups(prev => prev.filter(g => g.id !== groupId))
  }, [])

  // Face component for rendering individual faces
  const FaceImage: React.FC<{ 
    face: DetectedFace; 
    isDragTarget?: boolean;
  }> = ({ face, isDragTarget = false }) => {
    // Get capture shot to access timestamp
    const captureShot = useFaceDetectionStore(state => 
      state.captureShots.find(shot => shot.id === face.capture_id)
    )

    const handleClick = () => {
      if (captureShot?.timestamp) {
        onSeekToTime?.(captureShot.timestamp)
      }
    }

    return (
      <div
        draggable
        onDragStart={(e) => handleFaceDragStart(e, face)}
        onDragEnd={handleFaceDragEnd}
        onClick={handleClick}
        className={`
          relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200
          ${isDragTarget ? 'border-blue-400 bg-blue-50 scale-105' : 'border-gray-600 hover:border-gray-400'}
          shadow-sm hover:shadow-lg group
        `}
        title={`Confidence: ${(face.confidence * 100).toFixed(1)}%${captureShot ? ` | ${new Date(captureShot.timestamp).toLocaleTimeString()}` : ''}`}
      >
        {/* Use placeholder for face image */}
        <div className="w-16 h-16 bg-gray-700 flex items-center justify-center">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        
        {/* Confidence badge */}
        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
          {(face.confidence * 100).toFixed(0)}%
        </div>
        
        {/* Play button on hover */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-6 h-6 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-900 text-white overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Face Groups
          </h3>
        </div>
        
        {/* Stats */}
        <div className="text-sm text-gray-400 space-y-1">
          <div>Temporary groups: {uiGroups.length}</div>
          <div>Grouped faces: {uiGroups.reduce((sum, group) => sum + group.faces.length, 0)}</div>
          <div>Ungrouped: {ungroupedFaces.length}</div>
        </div>
      </div>

      {/* Face Groups */}
      <div className="p-4 space-y-4">
        {/* Create New Group Drop Zone */}
        {dragState.isDragging && (
          <div
            onDrop={handleCreateGroupDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-green-400 bg-green-900/20 rounded-lg p-6 text-center text-green-400"
          >
            <Plus className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Drop here to create new group</p>
          </div>
        )}

        {/* Existing Groups */}
        {uiGroups.map((group) => (
          <div
            key={group.id}
            onDrop={(e) => handleGroupDrop(e, group.id)}
            onDragOver={(e) => handleGroupDragOver(e, group.id)}
            onDragLeave={handleGroupDragLeave}
            className={`
              border rounded-lg p-4 transition-all duration-200
              ${dragState.dropTargetGroupId === group.id
                ? 'border-blue-400 bg-blue-900/20 shadow-lg' 
                : 'border-gray-600 bg-gray-800'}
            `}
          >
            {/* Group Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  {group.faces.length}
                </div>
                <div>
                  <div className="font-medium">
                    {group.name || `Group ${group.id.slice(-6)}`}
                  </div>
                  <div className="text-sm text-gray-400">
                    {group.faces.length} faces
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {assigningGroupId === group.id ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                      placeholder="Character name"
                      className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm w-32"
                      onKeyDown={(e) => e.key === 'Enter' && handleAssignGroup(group.id, characterName)}
                      autoFocus
                    />
                    <button
                      onClick={() => handleAssignGroup(group.id, characterName)}
                      disabled={!characterName.trim()}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setAssigningGroupId(null)}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setAssigningGroupId(group.id)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      title="Assign to character"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                      title="Delete group"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Group Faces */}
            <div className="grid grid-cols-4 gap-2">
              {group.faces.map((face) => (
                <FaceImage
                  key={face.id}
                  face={face}
                  isDragTarget={dragState.draggedFaceId === face.id}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Ungrouped Faces Section */}
        <div className="border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center">
              <User className="w-4 h-4 mr-2" />
              Unassigned Faces ({ungroupedFaces.length})
            </h4>
          </div>
          
          <div
            onDrop={handleUngroupedDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`
              grid grid-cols-4 gap-3 min-h-[100px] p-3 rounded-lg border-2 border-dashed transition-colors
              ${dragState.isDragging 
                ? 'border-red-400 bg-red-50/10' 
                : 'border-gray-600'}
            `}
          >
            {ungroupedFaces.map((face) => (
              <FaceImage
                key={face.id}
                face={face}
                isDragTarget={dragState.draggedFaceId === face.id}
              />
            ))}
            
            {ungroupedFaces.length === 0 && (
              <div className="col-span-4 text-center text-gray-500 py-8">
                {uiGroups.length > 0 ? 'All faces are grouped' : 'No unassigned faces'}
              </div>
            )}
          </div>
          
          {dragState.isDragging && (
            <div className="text-center text-sm text-gray-400 mt-2">
              Drop here to remove from groups
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FaceGroupingPanel 