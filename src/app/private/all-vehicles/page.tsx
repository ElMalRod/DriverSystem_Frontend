"use client"

import { useEffect, useState } from "react"
import { FaCar, FaEye, FaSearch, FaCalendarAlt, FaPalette, FaHashtag, FaIdCard } from "react-icons/fa"
import { getAllVehicles, VehicleResponse } from "@/features/vehicles/api"

declare global {
  interface Window {
    Swal: any;
  }
}

export default function AllVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMake, setSelectedMake] = useState("")

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    filterVehicles()
  }, [searchTerm, selectedMake, vehicles])

  async function loadVehicles() {
    try {
      setLoading(true)
      const data = await getAllVehicles()
      setVehicles(Array.isArray(data) ? data.sort((a, b) => b.id - a.id) : [])
    } catch (err: any) {
      console.error('Error loading vehicles:', err)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los vehículos',
          timer: 3000,
          showConfirmButton: false
        })
      }
    } finally {
      setLoading(false)
    }
  }

  function filterVehicles() {
    let filtered = vehicles

    if (searchTerm) {
      filtered = filtered.filter(vehicle => 
        vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.color?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedMake) {
      filtered = filtered.filter(vehicle => vehicle.make === selectedMake)
    }

    setFilteredVehicles(filtered)
  }

  function handleViewVehicleDetails(vehicle: VehicleResponse) {
    if (window.Swal) {
      window.Swal.fire({
        title: `Detalles del Vehículo - ${vehicle.plate}`,
        html: `
          <div class="text-left space-y-3">
            <div class="bg-blue-50 p-3 rounded">
              <p><strong> Placa:</strong> ${vehicle.plate}</p>
              <p><strong> Marca:</strong> ${vehicle.make}</p>
              <p><strong> Modelo:</strong> ${vehicle.model}</p>
            </div>
            <div class="bg-green-50 p-3 rounded">
              <p><strong> Color:</strong> ${vehicle.color || 'No especificado'}</p>
              <p><strong> VIN:</strong> ${vehicle.vin || 'No registrado'}</p>
              <p><strong> ID:</strong> ${vehicle.id}</p>
            </div>
            <div class="bg-yellow-50 p-3 rounded">
              <p><strong> Registrado:</strong> ${new Date(vehicle.createdAt).toLocaleString()}</p>
            </div>
          </div>
        `,
        icon: 'info',
        width: '500px',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Cerrar'
      })
    }
  }

  function getColorBadge(color?: string) {
    if (!color) return null
    
    const colorMap: Record<string, string> = {
      'blanco': 'bg-gray-100 text-gray-800 border-gray-300',
      'negro': 'bg-gray-800 text-white',
      'rojo': 'bg-red-100 text-red-800 border-red-300',
      'azul': 'bg-blue-100 text-blue-800 border-blue-300',
      'gris': 'bg-gray-200 text-gray-700',
      'verde': 'bg-green-100 text-green-800 border-green-300',
    }
    
    const lowerColor = color.toLowerCase()
    const colorClass = colorMap[lowerColor] || 'bg-gray-100 text-gray-600 border-gray-300'
    
    return (
      <span className={`px-2 py-1 rounded text-xs border ${colorClass}`}>
        {color}
      </span>
    )
  }

  // Obtener marcas unicas para el filtro
  const uniqueMakes = Array.from(new Set(vehicles.map(v => v.make))).sort()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Lista de Vehículos
          </h1>
          <p className="text-gray-600 mt-2">
            Consulta todos los vehículos registrados en el sistema
          </p>
        </div>
        <button 
          onClick={loadVehicles}
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <FaSearch size={14} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vehículos</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">{vehicles.length}</p>
            </div>
            <FaCar className="text-[var(--color-primary)]" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Marcas Diferentes</p>
              <p className="text-2xl font-bold text-blue-600">{uniqueMakes.length}</p>
            </div>
            <FaHashtag className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mostrando</p>
              <p className="text-2xl font-bold text-green-600">{filteredVehicles.length}</p>
            </div>
            <FaSearch className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Buscar vehículo</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por placa, marca, modelo, VIN o color..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filtrar por marca</label>
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="">Todas las marcas</option>
              {uniqueMakes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaCar className="text-[var(--color-primary)]" size={20} />
          <h3 className="text-lg font-semibold">Vehículos Registrados</h3>
          <span className="text-sm text-gray-500">({filteredVehicles.length} de {vehicles.length})</span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando vehículos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Placa</th>
                  <th className="px-4 py-2 text-left">Marca/Modelo</th>
                  <th className="px-4 py-2 text-left">Color</th>
                  <th className="px-4 py-2 text-left">VIN</th>
                  <th className="px-4 py-2 text-left">Registrado</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{vehicle.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FaIdCard className="text-[var(--color-primary)]" size={14} />
                        <span className="font-mono font-semibold">{vehicle.plate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{vehicle.make}</span>
                        <span className="text-sm text-gray-600">{vehicle.model}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getColorBadge(vehicle.color)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {vehicle.vin ? (
                        <span className="text-gray-700">{vehicle.vin}</span>
                      ) : (
                        <span className="text-gray-400 italic">Sin VIN</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-500" size={12} />
                        {new Date(vehicle.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleViewVehicleDetails(vehicle)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                        title="Ver detalles completos"
                      >
                        <FaEye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredVehicles.length === 0 && !loading && (
              <div className="text-center py-8">
                <FaCar className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">
                  {searchTerm || selectedMake ? 'No se encontraron vehículos con los filtros aplicados' : 'No hay vehículos registrados'}
                </p>
                {(searchTerm || selectedMake) && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedMake("")
                    }}
                    className="mt-2 text-[var(--color-primary)] hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
