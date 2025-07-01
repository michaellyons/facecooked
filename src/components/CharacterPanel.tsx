'use client'

import { useState, useEffect } from 'react'
import { useFaceDetectionStore, type Character, type DetectedFace } from '../stores'
import { 
  User, 
  Users, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Plus,
  Eye,
  Save,
  X,
  AlertTriangle,
  MoreVertical
} from 'lucide-react'
import { FaceCanvas } from './FaceCanvas'
import { useDrag, useDrop } from 'react-dnd'

// Drag and drop types
const ItemTypes = {
  UNASSIGNED_FACE: 'unassigned_face'
}

interface DraggedFace {
  id: string
  type: string
}

interface CharacterPanelProps {
  onSeekToTime?: (timestamp: number) => void
}

// Character Card Component with drop functionality
function CharacterCard({ 
  character,
  isEditing,
  isSelected,
  editingCharacterId,
  newCharacterName,
  openDropdownId,
  onSelectCharacter,
  onEditName,
  onSaveCharacterName,
  onCancelEdit,
  onDeleteCharacter,
  onCompleteDeleteCharacter,
  onRemoveFaceFromCharacter,
  onSeekToCharacterFace,
  onSetEditingCharacterId,
  onSetNewCharacterName,
  onSetOpenDropdownId,
  formatTime,
  assignFaceToCharacter
}: {
  character: Character
  isEditing: boolean
  isSelected: boolean
  editingCharacterId: string | null
  newCharacterName: string
  openDropdownId: string | null
  onSelectCharacter: (id: string | null) => void
  onEditName: (id: string, name: string) => void
  onSaveCharacterName: (id: string) => void
  onCancelEdit: () => void
  onDeleteCharacter: (id: string) => void
  onCompleteDeleteCharacter: (id: string) => void
  onRemoveFaceFromCharacter: (faceId: string) => void
  onSeekToCharacterFace: (face: DetectedFace) => void
  onSetEditingCharacterId: (id: string | null) => void
  onSetNewCharacterName: (name: string) => void
  onSetOpenDropdownId: (id: string | null) => void
  formatTime: (seconds: number) => string
  assignFaceToCharacter: (faceId: string, characterId: string) => void
}) {
  const { getCharacterFaces, getCaptureById } = useFaceDetectionStore()
  const characterFaces = getCharacterFaces(character.id)
  
  // Drop functionality for character cards
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.UNASSIGNED_FACE,
    drop: (item: DraggedFace) => {
      assignFaceToCharacter(item.id, character.id)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  return (
    <div
      key={character.id}
      ref={drop as any}
      className={`group border rounded-lg transition-all ${
        isSelected 
          ? 'border-blue-500 bg-gray-800 shadow-md' 
          : isOver
          ? 'border-green-500 bg-green-900/20 shadow-lg'
          : 'border-gray-700 hover:border-gray-600 bg-gray-900'
      }`}
    >
      {/* Character Header */}
      <div className="p-3 relative">
        {/* Drop hint */}
        {isOver && (
          <div className="absolute inset-0 bg-green-500/10 border border-green-500 rounded-lg flex items-center justify-center">
            <div className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
              Drop to assign face
            </div>
          </div>
        )}
        
        <div className="flex items-start space-x-3">
          {/* Representative Face Thumbnail */}
          {character.representative_face && (() => {
            const capture = getCaptureById(character.representative_face!.capture_id)
            if (!capture) return null
            
            return (
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <FaceCanvas
                  imageUrl={capture.dataUrl}
                  faceBox={character.representative_face.box}
                  originalWidth={capture.width}
                  originalHeight={capture.height}
                  confidence={character.representative_face.confidence}
                  isAssigned={true}
                  className="w-full h-full"
                  onClick={() => onSeekToCharacterFace(character.representative_face!)}
                />
              </div>
            )
          })()}

          <div className="flex-1 min-w-0">
            {/* Character Name */}
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newCharacterName}
                  onChange={(e) => onSetNewCharacterName(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-gray-800"
                  placeholder="Enter character name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSaveCharacterName(character.id)
                    } else if (e.key === 'Escape') {
                      onCancelEdit()
                    }
                  }}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSaveCharacterName(character.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center space-x-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h4 
                    className="font-medium text-white text-lg cursor-pointer hover:text-blue-400 transition-colors" 
                    onDoubleClick={() => {
                      onSetEditingCharacterId(character.id)
                      onSetNewCharacterName(character.name)
                    }}
                    title="Double-click to edit name"
                  >
                    {character.name}
                  </h4>
                  <div className="flex items-center space-x-3 text-sm text-gray-400 mt-1">
                    <span>{character.face_count} appearance{character.face_count !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{Math.round(character.confidence * 100)}% avg confidence</span>
                  </div>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => onSetOpenDropdownId(openDropdownId === character.id ? null : character.id)}
                    className="p-2 text-gray-500 hover:text-gray-300 transition-colors rounded-md hover:bg-gray-800 opacity-0 group-hover:opacity-100"
                    title="Character actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openDropdownId === character.id && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => onSetOpenDropdownId(null)}
                      />
                      
                      {/* Dropdown Content */}
                      <div className="absolute right-0 top-8 z-20 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1">
                        <button
                          onClick={() => {
                            onSetEditingCharacterId(character.id)
                            onSetNewCharacterName(character.name)
                            onSetOpenDropdownId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit Name</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            onDeleteCharacter(character.id)
                            onSetOpenDropdownId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <Trash2 className="w-4 h-4" />
                            <div>
                              <div>Remove Character</div>
                              <div className="text-xs text-gray-500">Keep detected faces</div>
                            </div>
                          </div>
                        </button>
                        
                        <div className="border-t border-gray-700 my-1" />
                        
                        <button
                          onClick={() => {
                            onCompleteDeleteCharacter(character.id)
                            onSetOpenDropdownId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/30 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4" />
                            <div>
                              <div>Delete Permanently</div>
                              <div className="text-xs text-red-500">Remove character and all faces</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Character Details */}
            {!isEditing && (
              <div className="mt-1.5 text-xs text-gray-500 space-y-0.5">
                <div>
                  First seen: {formatTime(character.first_seen)}
                </div>
                <div>
                  Last seen: {formatTime(character.last_seen)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Character Faces (when selected) */}
        {isSelected && characterFaces.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-700">
            <h5 className="text-sm font-medium text-gray-300 mb-2">
              All Appearances ({characterFaces.length})
            </h5>
            <div className="grid grid-cols-4 gap-2">
              {characterFaces.slice(0, 8).map((face: DetectedFace) => {
                const capture = getCaptureById(face.capture_id)
                if (!capture) return null
                
                return (
                  <div
                    key={face.id}
                    className="face-hover-group relative aspect-square bg-gray-100 rounded hover:ring-2 hover:ring-blue-500 transition-all"
                  >
                    <FaceCanvas
                      imageUrl={capture.dataUrl}
                      faceBox={face.box}
                      originalWidth={capture.width}
                      originalHeight={capture.height}
                      confidence={face.confidence}
                      isAssigned={true}
                      className="w-full h-full"
                      onClick={() => onSeekToCharacterFace(face)}
                    />
                    
                    {/* Remove button overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveFaceFromCharacter(face.id)
                        }}
                        className="w-8 h-8 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors backdrop-blur-sm border border-white/20 flex items-center justify-center"
                        title={characterFaces.length === 1 
                          ? "Remove appearance (will delete character)"
                          : "Remove appearance from character"
                        }
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Timestamp badge */}
                    <div className="absolute top-1 right-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {formatTime(capture.timestamp)}
                    </div>
                  </div>
                )
              })}
              {characterFaces.length > 8 && (
                <div className="aspect-square bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                  +{characterFaces.length - 8} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click to expand */}
      <button
        onClick={() => onSelectCharacter(isSelected ? null : character.id)}
        className="w-full p-2 text-xs text-gray-500 hover:text-gray-300 border-t border-gray-700 transition-colors flex items-center justify-center space-x-1"
      >
        {isSelected ? (
          <>
            <ChevronUp className="w-3 h-3" />
            <span>Collapse</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3" />
            <span>Expand</span>
          </>
        )}
      </button>
    </div>
  )
}

// Draggable Face Component  
function DraggableFace({ 
  face, 
  onSeekToFace, 
  onCreateCharacter 
}: { 
  face: DetectedFace
  onSeekToFace: (face: DetectedFace) => void
  onCreateCharacter: (faceId: string) => void
}) {
  const { getCaptureById } = useFaceDetectionStore()
  const capture = getCaptureById(face.capture_id)
  
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.UNASSIGNED_FACE,
    item: { id: face.id, type: ItemTypes.UNASSIGNED_FACE },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  if (!capture) return null

  return (
    <div
      ref={drag as any}
      className={`group relative bg-gray-100 rounded-lg overflow-hidden aspect-square transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      }`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <FaceCanvas
        imageUrl={capture.dataUrl}
        faceBox={face.box}
        originalWidth={capture.width}
        originalHeight={capture.height}
        confidence={face.confidence}
        isAssigned={false}
        className="w-full h-full"
        onClick={() => onSeekToFace(face)}
      />

      {/* Create Character Button */}
      <div className="absolute inset-0 p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col">
        <div className="flex-1" />
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCreateCharacter(face.id)
          }}
          className="w-full px-3 py-1 bg-white/20 text-white rounded text-xs font-medium hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/20 flex items-center space-x-1 mt-auto"
        >
          <Plus className="w-3 h-3" />
          <span>New Character</span>
        </button>
      </div>

      {/* Drag hint */}
      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        Drag to assign
      </div>
    </div>
  )
}

export function CharacterPanel({ onSeekToTime }: CharacterPanelProps) {
  const {
    characters,
    detectedFaces,
    captureShots,
    selectedCharacterId,
    selectCharacter,
    createCharacter,
    updateCharacterName,
    deleteCharacter,
    deleteCharacterCompletely,
    removeFaceFromCharacter,
    assignFaceToCharacter,
    getCharacterFaces,
    getCaptureById,
    totalActiveFaces,
    cleanupOrphanedData
  } = useFaceDetectionStore()

  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null)
  const [newCharacterName, setNewCharacterName] = useState('')
  const [showUnassignedFaces, setShowUnassignedFaces] = useState(false)
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  // Get unassigned faces (faces without character_id)
  const unassignedFaces = detectedFaces.filter((face: DetectedFace) => 
    !face.character_id && !face.deleted_at
  )

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdownId(null)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Close dropdown when editing starts
  useEffect(() => {
    if (editingCharacterId) {
      setOpenDropdownId(null)
    }
  }, [editingCharacterId])

  const handleCreateCharacter = async (faceId: string) => {
    const defaultName = `Character ${characters.length + 1}`
    await createCharacter(defaultName, faceId)
    // Auto-edit the newly created character
    setTimeout(() => {
      const newCharacter = characters.find((c: Character) => c.representative_face?.id === faceId)
      if (newCharacter) {
        setEditingCharacterId(newCharacter.id)
        setNewCharacterName(newCharacter.name)
      }
    }, 100)
  }

  const handleSaveCharacterName = async (characterId: string) => {
    if (newCharacterName.trim()) {
      await updateCharacterName(characterId, newCharacterName.trim())
    }
    setEditingCharacterId(null)
    setNewCharacterName('')
  }

  const handleCancelEdit = () => {
    setEditingCharacterId(null)
    setNewCharacterName('')
  }

  const handleDeleteCharacter = (characterId: string) => {
    deleteCharacter(characterId)
    // Cleanup orphaned data
    setTimeout(() => cleanupOrphanedData(), 100)
  }

  const handleCompleteDeleteCharacter = (characterId: string) => {
    setCharacterToDelete(characterId)
    setShowDeleteDialog(true)
  }

  const confirmCompleteDelete = () => {
    if (characterToDelete) {
      deleteCharacterCompletely(characterToDelete)
      setCharacterToDelete(null)
      setShowDeleteDialog(false)
      // Cleanup orphaned data after complete deletion
      setTimeout(() => cleanupOrphanedData(), 100)
    }
  }

  const handleRemoveFaceFromCharacter = (faceId: string) => {
    removeFaceFromCharacter(faceId)
    // Cleanup orphaned data after removing face
    setTimeout(() => cleanupOrphanedData(), 100)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeekToCharacterFace = (face: DetectedFace) => {
    const capture = getCaptureById(face.capture_id)
    if (capture && onSeekToTime) {
      onSeekToTime(capture.timestamp)
    }
  }

  if (totalActiveFaces === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <User className="w-14 h-14 text-gray-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-400 mb-2">No Actors Yet</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Capture some frames and run face detection to identify actors in your video.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4">
      {/* Header */}
      <div className="space-y-2">
        <div><h3 className="text-lg font-semibold text-white mb-1">Actors</h3><div className="text-sm text-gray-400 space-y-0.5"><span className="font-medium text-lg text-white">{characters.length}</span><span className="ml-2">identified characters</span> <span className="font-medium text-lg text-white ml-4">{unassignedFaces.length}</span><span className="ml-2">unassigned faces</span></div></div>

        {unassignedFaces.length > 0 && (
          <button
            onClick={() => setShowUnassignedFaces(!showUnassignedFaces)}
            className="w-full px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>{showUnassignedFaces ? 'Hide Unassigned Faces' : `Show Unassigned Faces (${unassignedFaces.length})`}</span>
          </button>
        )}
      </div>

      {/* Character List */}
      <div className="space-y-2">
        {characters.map((character: Character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isEditing={editingCharacterId === character.id}
            isSelected={selectedCharacterId === character.id}
            editingCharacterId={editingCharacterId}
            newCharacterName={newCharacterName}
            openDropdownId={openDropdownId}
            onSelectCharacter={selectCharacter}
            onEditName={(id, name) => updateCharacterName(id, name)}
            onSaveCharacterName={handleSaveCharacterName}
            onCancelEdit={handleCancelEdit}
            onDeleteCharacter={handleDeleteCharacter}
            onCompleteDeleteCharacter={handleCompleteDeleteCharacter}
            onRemoveFaceFromCharacter={handleRemoveFaceFromCharacter}
            onSeekToCharacterFace={handleSeekToCharacterFace}
            onSetEditingCharacterId={setEditingCharacterId}
            onSetNewCharacterName={setNewCharacterName}
            onSetOpenDropdownId={setOpenDropdownId}
            formatTime={formatTime}
            assignFaceToCharacter={assignFaceToCharacter}
          />
        ))}
      </div>

      {/* Unassigned Faces */}
      {showUnassignedFaces && unassignedFaces.length > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <div className="mb-3">
            <h4 className="text-md font-medium text-white mb-1">Unassigned Faces</h4>
            <p className="text-xs text-gray-400">
              Drag faces onto character cards to assign them, or click "New Character" to create one
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {unassignedFaces.map((face: DetectedFace) => (
              <DraggableFace
                key={face.id}
                face={face}
                onSeekToFace={handleSeekToCharacterFace}
                onCreateCharacter={handleCreateCharacter}
              />
            ))}
          </div>
        </div>
      )}

      {/* Complete Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-4 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Permanently Delete Character?</h3>
            </div>
            <p className="text-gray-400 mb-6">
              This will permanently delete the character and all their associated faces. 
              Similar faces will not be auto-detected in future captures. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmCompleteDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Permanently Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setCharacterToDelete(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 