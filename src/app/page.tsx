'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

interface Production {
  id: string
  name: string
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const [productions, setProductions] = useState<Production[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('productions').select('*').then(({ data }) => {
      setProductions(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <div className="font-bold text-xl tracking-tight">VAELYA</div>
        <div className="flex gap-8">
          <button className="font-medium text-gray-700 border-b-2 border-black pb-1">Home</button>
          <button className="font-medium text-gray-500 hover:text-black">Productions</button>
          <button className="font-medium text-gray-500 hover:text-black">Activity</button>
        </div>
        <div>{/* Profile/Settings */}</div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <button className="bg-black text-white rounded-xl px-6 py-3 font-semibold shadow hover:bg-gray-800 transition">+ Add Production</button>
          <button className="bg-white border rounded-xl px-6 py-3 font-semibold shadow hover:bg-gray-100 transition">Move Money</button>
        </div>

        {/* Productions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-3 text-center text-gray-400">Loading...</div>
          ) : productions.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400">No productions yet.</div>
          ) : (
            productions.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition cursor-pointer"
                onClick={() => router.push(`/productions/${prod.id}`)}
              >
                <div>
                  <h3 className="text-lg font-bold mb-2">{prod.name}</h3>
                  <p className="text-gray-500 text-sm">Created: {new Date(prod.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <span className="bg-gray-100 rounded-full px-3 py-1 text-xs">Active</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats/Watchlist */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <div className="text-2xl font-bold">{productions.length}</div>
            <div className="text-gray-500">Total Productions</div>
          </div>
          {/* Add more cards for stats or watchlist as needed */}
        </div>
      </main>
    </div>
  )
}
