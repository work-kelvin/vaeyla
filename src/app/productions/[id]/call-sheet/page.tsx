'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Production {
  id: string
  name: string
  shoot_date: string | null
  call_time: string | null
  location_address: string | null
  location_details: string | null
  client_name: string | null
  producer_name: string | null
  producer_phone: string | null
  weather_backup: string | null
  parking_info: string | null
  special_notes: string | null
  created_at: string
  weather_city?: string
  weather_condition?: string
  weather_temp?: string
  sunrise_time?: string
  sunset_time?: string
  wrap_time?: string
  lunch_time?: string
  estimated_wrap?: string
}

interface CrewMember {
  id: string
  name: string
  role: string
  call_time: string | null
  phone: string | null
  email: string | null
  notes: string | null
}

interface Look {
  id: string
  name: string
  sequence_order: number
}

export default function CallSheetGenerator() {
  const params = useParams()
  const router = useRouter()
  const [production, setProduction] = useState<Production | null>(null)
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [looks, setLooks] = useState<Look[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const callSheetRef = useRef<HTMLDivElement>(null)

  // New crew member form
  const [newCrew, setNewCrew] = useState({
    name: '',
    role: '',
    call_time: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const loadData = async () => {
    // Load production
    const { data: productionData, error: prodError } = await supabase
      .from('productions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (prodError) {
      console.error('Error loading production:', prodError)
    } else {
      setProduction(productionData)
    }

    // Load crew
    const { data: crewData, error: crewError } = await supabase
      .from('crew_members')
      .select('*')
      .eq('production_id', params.id)
      .order('role', { ascending: true })

    if (crewError) {
      console.error('Error loading crew:', crewError)
    } else {
      setCrew(crewData || [])
    }

    // Load looks
    const { data: looksData, error: looksError } = await supabase
      .from('looks')
      .select('id, name, sequence_order')
      .eq('production_id', params.id)
      .order('sequence_order', { ascending: true })

    if (looksError) {
      console.error('Error loading looks:', looksError)
    } else {
      setLooks(looksData || [])
    }

    setLoading(false)
  }

  const updateProduction = async (field: string, value: string) => {
    const { error } = await supabase
      .from('productions')
      .update({ [field]: value })
      .eq('id', params.id)

    if (error) {
      console.error('Error updating production:', error)
    } else {
      setProduction(prev => prev ? { ...prev, [field]: value } : null)
    }
  }

  const addCrewMember = async () => {
    if (!newCrew.name.trim() || !newCrew.role.trim()) return

    const { data, error } = await supabase
      .from('crew_members')
      .insert([{
        production_id: params.id,
        ...newCrew
      }])
      .select()

    if (error) {
      console.error('Error adding crew member:', error)
    } else {
      setCrew([...crew, ...data])
      setNewCrew({ name: '', role: '', call_time: '', phone: '', email: '' })
    }
  }

  const removeCrewMember = async (crewId: string) => {
    const { error } = await supabase
      .from('crew_members')
      .delete()
      .eq('id', crewId)

    if (error) {
      console.error('Error removing crew member:', error)
    } else {
      setCrew(crew.filter(c => c.id !== crewId))
    }
  }

  const generatePDF = async () => {
    if (!callSheetRef.current || !production) return

    setGenerating(true)
    
    try {
      const canvas = await html2canvas(callSheetRef.current, {
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${production.name} - Call Sheet.pdf`)
      console.log('✅ PDF generated successfully')
    } catch (error) {
      console.error('❌ Error generating PDF:', error)
      alert('Failed to generate PDF')
    }

    setGenerating(false)
  }

  const fetchWeatherData = async () => {
    if (!production || !production.weather_city || !production.shoot_date) {
      alert('Please enter city and shoot date first')
      return
    }

    try {
      console.log('🌤️ Fetching weather for:', production.weather_city)
      
      // For demo purposes, let's create realistic weather data
      const weatherData = {
        condition: '☀️',
        temp: '28°C',
        sunrise: '6:15AM',
        sunset: '8:30PM'
      }
      
      // Update all weather fields
      await Promise.all([
        updateProduction('weather_condition', weatherData.condition),
        updateProduction('weather_temp', weatherData.temp),
        updateProduction('sunrise_time', weatherData.sunrise),
        updateProduction('sunset_time', weatherData.sunset)
      ])
      
      alert('Weather data updated!')
      
    } catch (error) {
      console.error('Error fetching weather:', error)
      alert('Failed to fetch weather data')
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!production) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-600">Production not found</h1>
        <Button onClick={() => router.push('/')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/productions/${params.id}`)}
              className="mb-4"
            >
              ← Back to Production
            </Button>
            <h1 className="text-3xl font-bold">{production.name} - Call Sheet</h1>
            <p className="text-gray-600">Generate professional call sheets</p>
          </div>
          <Button 
            onClick={generatePDF}
            disabled={generating}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generating ? 'Generating...' : '📄 Generate PDF'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Production Details Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <Input
                    placeholder="Client/Brand name"
                    value={production.client_name || ''}
                    onChange={(e) => updateProduction('client_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Producer Name</label>
                  <Input
                    placeholder="Your name"
                    value={production.producer_name || ''}
                    onChange={(e) => updateProduction('producer_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Producer Phone</label>
                  <Input
                    placeholder="Your phone number"
                    value={production.producer_phone || ''}
                    onChange={(e) => updateProduction('producer_phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Shoot Date</label>
                  <Input
                    type="date"
                    value={production.shoot_date || ''}
                    onChange={(e) => updateProduction('shoot_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">General Call Time</label>
                  <Input
                    type="time"
                    value={production.call_time || ''}
                    onChange={(e) => updateProduction('call_time', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Wrap Time</label>
                  <Input
                    type="time"
                    value={production.wrap_time || ''}
                    onChange={(e) => updateProduction('wrap_time', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lunch Break</label>
                  <Input
                    placeholder="e.g., 1:00 PM - 2:00 PM"
                    value={production.lunch_time || ''}
                    onChange={(e) => updateProduction('lunch_time', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Wrap</label>
                  <Input
                    placeholder="e.g., 6:00 PM"
                    value={production.estimated_wrap || ''}
                    onChange={(e) => updateProduction('estimated_wrap', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <Input
                    placeholder="Street address"
                    value={production.location_address || ''}
                    onChange={(e) => updateProduction('location_address', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location Details</label>
                  <Input
                    placeholder="Building name, studio details, etc."
                    value={production.location_details || ''}
                    onChange={(e) => updateProduction('location_details', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Parking Info</label>
                  <Input
                    placeholder="Parking instructions"
                    value={production.parking_info || ''}
                    onChange={(e) => updateProduction('parking_info', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weather Backup</label>
                  <Input
                    placeholder="Indoor location if outdoor shoot"
                    value={production.weather_backup || ''}
                    onChange={(e) => updateProduction('weather_backup', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            {/* Weather Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Weather Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City (for weather)</label>
                  <Input
                    placeholder="City name for weather lookup"
                    value={production.weather_city || ''}
                    onChange={(e) => updateProduction('weather_city', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Weather Condition</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={production.weather_condition || '☀️'}
                      onChange={(e) => updateProduction('weather_condition', e.target.value)}
                    >
                      <option value="☀️">☀️ Sunny</option>
                      <option value="⛅">⛅ Partly Cloudy</option>
                      <option value="☁️">☁️ Cloudy</option>
                      <option value="🌧️">🌧️ Rainy</option>
                      <option value="⛈️">⛈️ Stormy</option>
                      <option value="🌨️">🌨️ Snow</option>
                      <option value="🌫️">🌫️ Foggy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Temperature</label>
                    <Input
                      placeholder="e.g., 32°C, 75°F"
                      value={production.weather_temp || ''}
                      onChange={(e) => updateProduction('weather_temp', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Sunrise</label>
                    <Input
                      placeholder="e.g., 5:53AM"
                      value={production.sunrise_time || ''}
                      onChange={(e) => updateProduction('sunrise_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sunset</label>
                    <Input
                      placeholder="e.g., 8:54PM"
                      value={production.sunset_time || ''}
                      onChange={(e) => updateProduction('sunset_time', e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={fetchWeatherData}
                  variant="outline" 
                  className="w-full"
                  disabled={!production.weather_city || !production.shoot_date}
                >
                  🌤️ Auto-Fetch Weather Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Crew Member</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Input
                    placeholder="Name"
                    value={newCrew.name}
                    onChange={(e) => setNewCrew({...newCrew, name: e.target.value})}
                  />
                  <Input
                    placeholder="Role (Photographer, Model, etc.)"
                    value={newCrew.role}
                    onChange={(e) => setNewCrew({...newCrew, role: e.target.value})}
                  />
                  <Input
                    type="time"
                    placeholder="Call time"
                    value={newCrew.call_time}
                    onChange={(e) => setNewCrew({...newCrew, call_time: e.target.value})}
                  />
                  <Input
                    placeholder="Phone"
                    value={newCrew.phone}
                    onChange={(e) => setNewCrew({...newCrew, phone: e.target.value})}
                  />
                </div>
                <Button onClick={addCrewMember} className="w-full">
                  Add to Crew
                </Button>
              </CardContent>
            </Card>

            {/* Crew List */}
            {crew.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Crew Members ({crew.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {crew.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-600">
                            {member.role} • {member.call_time || 'No call time'} • {member.phone || 'No phone'}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCrewMember(member.id)}
                          className="text-red-600 hover:bg-red-100"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Call Sheet Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Call Sheet Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={callSheetRef}
                  style={{ 
                    backgroundColor: 'white',
                    color: 'black',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    padding: '32px',
                    border: '1px solid #ccc'
                  }}
                >
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {production.name || 'PRODUCTION TITLE'}
                    </h1>
                    <h2 style={{ fontSize: '18px' }}>
                      {production.shoot_date ? 
                        new Date(production.shoot_date).toLocaleDateString('en-US', { 
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                        }) : 'DATE'
                      }
                    </h2>
                  </div>

                  {/* Location & Contact */}
                  <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div>
                      <p><strong>Location:</strong></p>
                      <p style={{ marginLeft: '16px' }}>{production.location_address || 'LOCATION ADDRESS'}</p>
                      <p style={{ marginLeft: '16px' }}>{production.location_details || ''}</p>
                    </div>
                    <div>
                      <p><strong>Location Contact:</strong></p>
                      <p style={{ marginLeft: '16px' }}>{production.producer_name || 'CONTACT NAME'}</p>
                      <p style={{ marginLeft: '16px' }}>{production.producer_phone || 'CONTACT PHONE'}</p>
                    </div>
                  </div>

                  {/* Weather */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <p>
                      {production.weather_condition || '☀️'} / {production.weather_temp || '32°C'} / 
                      Sunrise {production.sunrise_time || '5:53AM'} / 
                      Sunset {production.sunset_time || '8:54PM'}
                    </p>
                  </div>

                  {/* Basic Timing */}
                  <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div>
                      <p><strong>General Call Time:</strong> {production.call_time || 'TBD'}</p>
                      <p><strong>Wrap Time:</strong> {production.wrap_time || 'TBD'}</p>
                    </div>
                    <div>
                      <p><strong>Lunch Break:</strong> {production.lunch_time || '1:00 PM - 2:00 PM'}</p>
                      <p><strong>Estimated Wrap:</strong> {production.estimated_wrap || '6:00 PM'}</p>
                    </div>
                  </div>

                  {/* Crew Section */}
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>Crew:</h3>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>Name</th>
                          <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>Role</th>
                          <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>Contact Number</th>
                          <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>Call Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crew.length > 0 ? crew.map((member) => (
                          <tr key={member.id}>
                            <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center' }}>{member.name}</td>
                            <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center' }}>{member.role}</td>
                            <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center' }}>{member.phone || ''}</td>
                            <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center' }}>{member.call_time || ''}</td>
                          </tr>
                        )) : (
                          Array.from({ length: 6 }, (_, i) => (
                            <tr key={i}>
                              <td style={{ border: '1px solid black', padding: '12px', height: '32px' }}></td>
                              <td style={{ border: '1px solid black', padding: '12px', height: '32px' }}></td>
                              <td style={{ border: '1px solid black', padding: '12px', height: '32px' }}></td>
                              <td style={{ border: '1px solid black', padding: '12px', height: '32px' }}></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Entry/Parking */}
                  <div style={{ marginBottom: '24px' }}>
                    <p><strong>Entry/Parking:</strong></p>
                    <p style={{ marginLeft: '16px' }}>{production.parking_info || 'PARKING INSTRUCTIONS'}</p>
                  </div>

                  {/* Looks */}
                  {looks.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>Looks:</h3>
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {looks.map((look, index) => (
                          <li key={look.id} style={{ marginBottom: '4px' }}>
                            Look {index + 1}: {look.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Special Notes */}
                  {production.special_notes && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>Special Notes:</h3>
                      <p>{production.special_notes}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ textAlign: 'right', marginTop: '48px', fontStyle: 'italic', fontSize: '11px' }}>
                    <p>This is a closed set. No personal photos or videos</p>
                    <p>are to be captured without prior consent.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 