'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface Look {
  id: string
  name: string
  description: string
  image_url: string | null
  sequence_order: number
  styling_notes: string
  created_at: string
}

interface Production {
  id: string
  name: string
}

export default function LooksManagement() {
  const params = useParams()
  const router = useRouter()
  const [production, setProduction] = useState<Production | null>(null)
  const [looks, setLooks] = useState<Look[]>([])
  const [newLookName, setNewLookName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  useEffect(() => {
    loadProduction()
    loadLooks()
  }, [params.id])

  const loadProduction = async () => {
    const { data, error } = await supabase
      .from('productions')
      .select('id, name')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error loading production:', error)
    } else {
      setProduction(data)
    }
  }

  const loadLooks = async () => {
    const { data, error } = await supabase
      .from('looks')
      .select('*')
      .eq('production_id', params.id)
      .order('sequence_order', { ascending: true })

    if (error) {
      console.error('Error loading looks:', error)
    } else {
      setLooks(data || [])
    }
    setLoading(false)
  }

  const createLook = async () => {
    if (!newLookName.trim()) return

    const nextOrder = looks.length > 0 ? Math.max(...looks.map(l => l.sequence_order)) + 1 : 0

    const { data, error } = await supabase
      .from('looks')
      .insert([{
        production_id: params.id,
        name: newLookName.trim(),
        description: '',
        sequence_order: nextOrder,
        styling_notes: ''
      }])
      .select()

    if (error) {
      console.error('Error creating look:', error)
    } else {
      setLooks([...looks, ...data])
      setNewLookName('')
    }
  }

  const uploadImage = async (lookId: string, file: File) => {
    setUploading(true)
    
    try {
      // Compress image if needed
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        alert('Image too large. Please choose an image under 2MB.')
        setUploading(false)
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${lookId}-${Date.now()}.${fileExt}`
      const filePath = `looks/${fileName}`

      console.log('🚀 Uploading image:', fileName)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('production-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        alert('Upload failed: ' + uploadError.message)
        setUploading(false)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('production-images')
        .getPublicUrl(filePath)

      console.log('✅ Public URL generated:', publicUrl)

      // Update look with image URL
      const { error: updateError } = await supabase
        .from('looks')
        .update({ image_url: publicUrl })
        .eq('id', lookId)

      if (updateError) {
        console.error('❌ Database update error:', updateError)
        alert('Failed to save image')
      } else {
        // Update local state
        setLooks(looks.map(look => 
          look.id === lookId 
            ? { ...look, image_url: publicUrl }
            : look
        ))
        console.log('✅ Look updated successfully')
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      alert('Upload failed unexpectedly')
    }
    
    setUploading(false)
  }

  const onDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(looks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update sequence_order for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      sequence_order: index
    }))

    setLooks(updatedItems)

    // Update database
    try {
      for (const item of updatedItems) {
        await supabase
          .from('looks')
          .update({ sequence_order: item.sequence_order })
          .eq('id', item.id)
      }
      console.log('✅ Sequence updated successfully')
    } catch (error) {
      console.error('❌ Error updating sequence:', error)
      // Reload to get correct order
      loadLooks()
    }
  }

  const deleteLook = async (lookId: string) => {
    if (!confirm('Are you sure you want to delete this look?')) return

    const { error } = await supabase
      .from('looks')
      .delete()
      .eq('id', lookId)

    if (error) {
      console.error('Error deleting look:', error)
    } else {
      setLooks(looks.filter(look => look.id !== lookId))
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/productions/${params.id}`)}
              className="mb-4 hover:bg-gray-100"
            >
              ← Back to Production
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {production?.name} - Looks
            </h1>
            <p className="text-gray-600 text-lg">Visual styling concepts and references</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {looks.length} Look{looks.length !== 1 ? 's' : ''}
            </Badge>
            {looks.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Drag to reorder • Click images to change
              </p>
            )}
          </div>
        </div>

        {/* Create New Look */}
        <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Add New Look
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                placeholder="Look name (e.g., 'Casual Denim', 'Evening Glamour', 'Street Style')"
                value={newLookName}
                onChange={(e) => setNewLookName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createLook()}
                className="flex-1 h-12 text-lg"
              />
              <Button 
                onClick={createLook}
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Add Look
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Looks Gallery */}
        {looks.length === 0 ? (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="text-center py-20">
              <div className="text-8xl mb-6">👗</div>
              <h3 className="text-2xl font-semibold mb-3">No looks yet</h3>
              <p className="text-gray-600 text-lg">Create your first styling concept to start building your visual reference gallery</p>
            </CardContent>
          </Card>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="looks">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${
                    snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-4' : ''
                  }`}
                >
                  {looks.map((look, index) => (
                    <Draggable key={look.id} draggableId={look.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm ${
                            snapshot.isDragging 
                              ? 'shadow-2xl rotate-3 scale-105' 
                              : 'hover:scale-105'
                          }`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-semibold truncate">
                                {look.name}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className="bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200"
                                >
                                  #{index + 1}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteLook(look.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {/* Image Display/Upload */}
                            <div className="mb-4">
                              {look.image_url ? (
                                <div className="relative overflow-hidden rounded-lg group/image">
                                  <img
                                    src={look.image_url}
                                    alt={look.name}
                                    className="w-full h-48 object-cover transition-transform duration-300 group-hover/image:scale-110"
                                    onError={(e) => {
                                      console.error('Image failed to load:', look.image_url)
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="opacity-0 group-hover/image:opacity-100 transition-all duration-300 transform scale-90 group-hover/image:scale-100"
                                      onClick={() => {
                                        const input = document.createElement('input')
                                        input.type = 'file'
                                        input.accept = 'image/*'
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0]
                                          if (file) uploadImage(look.id, file)
                                        }
                                        input.click()
                                      }}
                                    >
                                      📸 Change Image
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 bg-gradient-to-br from-gray-50 to-gray-100"
                                  onClick={() => {
                                    const input = document.createElement('input')
                                    input.type = 'file'
                                    input.accept = 'image/*'
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0]
                                      if (file) uploadImage(look.id, file)
                                    }
                                    input.click()
                                  }}
                                >
                                  <div className="text-center">
                                    <div className="text-5xl mb-3">📸</div>
                                    <p className="text-sm text-gray-600 font-medium">
                                      {uploading ? 'Uploading...' : 'Click to upload image'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      JPG, PNG, GIF up to 2MB
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Look Details */}
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex justify-between">
                                <span className="font-medium">Sequence:</span>
                                <span>{index + 1}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Created:</span>
                                <span>{new Date(look.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Upload Progress Overlay */}
        {uploading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <Card className="shadow-2xl border-0">
              <CardContent className="p-8 text-center">
                <div className="animate-spin text-6xl mb-4">📸</div>
                <h3 className="text-xl font-semibold mb-2">Uploading Image...</h3>
                <p className="text-gray-600">Please wait while we process your image</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 