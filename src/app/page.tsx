'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Dashboard() {
  const [productions, setProductions] = useState([])
  const [newProduction, setNewProduction] = useState('')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Back To One</h1>
      <p className="text-gray-600 mb-8">Fashion Production Management</p>
      
      <div className="flex gap-2 mb-6">
        <Input 
          placeholder="New production name..."
          value={newProduction}
          onChange={(e) => setNewProduction(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => {
          if (newProduction.trim()) {
            setProductions([...productions, { 
              id: Date.now(), 
              name: newProduction,
              date: new Date().toLocaleDateString()
            }])
            setNewProduction('')
          }
        }}>
          Create Production
        </Button>
      </div>

      <div className="grid gap-4">
        {productions.map((prod) => (
          <div key={prod.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg">{prod.name}</h3>
            <p className="text-sm text-gray-500">Created: {prod.date}</p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm">View Details</Button>
              <Button variant="outline" size="sm">Call Sheet</Button>
            </div>
          </div>
        ))}
      </div>

      {productions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No productions yet. Create your first fashion shoot!</p>
        </div>
      )}
    </div>
  )
}
