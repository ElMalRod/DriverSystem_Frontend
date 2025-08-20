"use client"

import { useEffect, useState } from "react"
import { FaCar, FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa"
import { getVehicleMakes, createVehicleMake, VehicleMake } from "@/features/vehicles/api"

export default function VehiclesPage() {
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateMake, setShowCreateMake] = useState(false)
  const [newMakeName, setNewMakeName] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadMakes()
  }, [])

  async function loadMakes() {
    try {
      setLoading(true)
      const data = await getVehicleMakes()
      setMakes(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateMake(e: React.FormEvent) {
    e.preventDefault()
    if (!newMakeName.trim()) return

    try {
      const newMake = await createVehicleMake({ name: newMakeName.trim() })
      setMakes(prev => [...prev, newMake])
      setNewMakeName("")
      setShowCreateMake(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Gestión de Vehículos
          </h1>
          <p className="text-gray-600 mt-2">
            Administra marcas, modelos y vehículos del taller
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateMake(true)}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaPlus size={14} />
            Nueva Marca
          </button>
          <button className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2">
            <FaCar size={14} />
            Nuevo Vehículo
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Vehicle Makes Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaCar className="text-[var(--color-primary)]" size={20} />
          <h3 className="text-lg font-semibold">Marcas de Vehículos</h3>
          <span className="text-sm text-gray-500">({makes.length} marcas)</span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando marcas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {makes.map((make) => (
              <div key={make.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-[var(--color-dark)]">{make.name}</h4>
                    <p className="text-sm text-gray-500">ID: {make.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 p-1">
                      <FaEdit size={14} />
                    </button>
                    <button className="text-red-600 hover:text-red-800 p-1">
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {makes.length === 0 && (
              <div className="col-span-full text-center py-8">
                <FaCar className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No hay marcas registradas</p>
                <button 
                  onClick={() => setShowCreateMake(true)}
                  className="mt-2 text-[var(--color-primary)] hover:underline"
                >
                  Crear la primera marca
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Make Modal */}
      {showCreateMake && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nueva Marca de Vehículo</h3>
            <form onSubmit={handleCreateMake}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nombre de la marca</label>
                <input
                  type="text"
                  value={newMakeName}
                  onChange={(e) => setNewMakeName(e.target.value)}
                  placeholder="Ej: Toyota, Honda, Ford..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateMake(false)
                    setNewMakeName("")
                    setError("")
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                >
                  Crear Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
