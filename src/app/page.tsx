'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Image from 'next/image'

interface Look {
  id: string
  name: string
  image_url?: string
}

interface Equipment {
  id: string
  name: string
  ready: boolean
}

export default function TodaysShootDashboard() {
  const router = useRouter()
  const [schedule, setSchedule] = useState<{ time: string; label: string }[]>([])
  const [looks, setLooks] = useState<Look[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])

  useEffect(() => {
    // Fetch the latest production (today's shoot)
    supabase.from('productions').select('*').order('created_at', { ascending: false }).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        // Example: fetch schedule, looks, equipment for this production
        fetchSchedule()
        fetchLooks(data[0].id)
        fetchEquipment()
      }
    })
  }, [])

  const fetchSchedule = async () => {
    // Replace with your real schedule fetching logic
    // For now, use dummy data
    setSchedule([
      { time: '10:00 AM', label: 'Setup & Lighting' },
      { time: '11:00 AM', label: 'Model Arrives' },
      { time: '12:00 PM', label: 'Shooting' },
    ])
  }

  const fetchLooks = async (productionId: string) => {
    const { data } = await supabase.from('looks').select('id, name, image_url').eq('production_id', productionId).order('sequence_order', { ascending: true })
    setLooks(data || [])
  }

  const fetchEquipment = async () => {
    // Replace with your real equipment fetching logic
    // For now, use dummy data
    setEquipment([
      { id: '1', name: 'Camera', ready: true },
      { id: '2', name: 'Light Kit', ready: true },
      { id: '3', name: 'Reflector', ready: false },
    ])
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
      {/* Header Row */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Today&apos;s Shoot</h1>
        <button
          className="bg-white border px-6 py-2 rounded-xl shadow hover:bg-gray-100 font-semibold"
          onClick={() => router.push('/call-sheet')}
        >
          Call Sheet
        </button>
      </div>

      {/* Main Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Schedule Card */}
        <div className="bg-white rounded-2xl shadow p-8 flex-1">
          <h2 className="text-xl font-bold mb-6">Schedule</h2>
          <div className="space-y-4">
            {schedule.map((item) => (
              <div key={item.time + item.label} className="flex items-center gap-4">
                <span className="text-gray-500 w-20">{item.time}</span>
                <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Looks & Equipment Card */}
        <div className="flex flex-col gap-8">
          {/* Looks */}
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-xl font-bold mb-6">Looks</h2>
            <div className="flex gap-4">
              {looks.length === 0 ? (
                <span className="text-gray-400">No looks yet.</span>
              ) : (
                looks.map((look) => (
                  <Image
                    key={look.id}
                    src={look.image_url || '/placeholder.jpg'}
                    alt={look.name}
                    width={80}
                    height={112}
                    className="w-20 h-28 object-cover rounded-xl border"
                  />
                ))
              )}
            </div>
          </div>
          {/* Equipment */}
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-xl font-bold mb-6">Equipment</h2>
            <ul className="space-y-3">
              {equipment.map((eq) => (
                <li key={eq.id} className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${eq.ready ? 'bg-green-400' : 'bg-gray-300'}`}
                  ></span>
                  <span>{eq.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
