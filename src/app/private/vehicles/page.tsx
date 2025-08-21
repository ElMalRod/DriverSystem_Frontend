"use client"

import { useEffect, useState } from "react"
import { FaCar, FaPlus, FaEdit, FaTrash, FaSearch, FaCog } from "react-icons/fa"
import { 
  getVehicleMakes, 
  createVehicleMake, 
  updateVehicleMake, 
  deleteVehicleMake, 
  VehicleMake,
  getVehicleModels,
  createVehicleModel,
  updateVehicleModel,
  deleteVehicleModel,
  VehicleModel
} from "@/features/vehicles/api"

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

export default function VehiclesPage() {
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [loading, setLoading] = useState(true)
  const [modelsLoading, setModelsLoading] = useState(true)
  
  // Make modals
  const [showCreateMake, setShowCreateMake] = useState(false)
  const [showEditMake, setShowEditMake] = useState(false)
  const [editingMake, setEditingMake] = useState<VehicleMake | null>(null)
  const [newMakeName, setNewMakeName] = useState("")
  
  // Model modals
  const [showCreateModel, setShowCreateModel] = useState(false)
  const [showEditModel, setShowEditModel] = useState(false)
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null)
  const [newModelName, setNewModelName] = useState("")
  const [selectedMakeId, setSelectedMakeId] = useState<number>(0)
  
  const [error, setError] = useState("")

  useEffect(() => {
    loadMakes()
    loadModels()
  }, [])

  async function loadMakes() {
    try {
      setLoading(true)
      setError("")
      const data = await getVehicleMakes()
      // Ordenar por ID ascendente (más antiguo primero)
      const sortedData = Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : []
      setMakes(sortedData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadModels() {
    try {
      setModelsLoading(true)
      const data = await getVehicleModels()
      // Ordenar por ID ascendente (más antiguo primero)
      const sortedData = Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : []
      setModels(sortedData)
    } catch (err: any) {
      console.error('Error loading models:', err)
    } finally {
      setModelsLoading(false)
    }
  }

  async function handleCreateMake(e: React.FormEvent) {
    e.preventDefault()
    if (!newMakeName.trim()) return

    try {
      console.log('Creando marca:', { name: newMakeName.trim() })
      const newMake = await createVehicleMake({ name: newMakeName.trim() })
      console.log('Marca creada:', newMake)
      // Agregar y reordenar por ID
      setMakes(prev => [...prev, newMake].sort((a, b) => a.id - b.id))
      setNewMakeName("")
      setShowCreateMake(false)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: `Marca "${newMake.name}" creada correctamente`,
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      console.error('Error al crear marca:', err) // Debug
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al crear la marca'
        })
      }
    }
  }

  async function handleEditMake(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMake || !newMakeName.trim()) return

    try {
      console.log('Actualizando marca:', { id: editingMake.id, name: newMakeName.trim() }) // Debug
      const updatedMake = await updateVehicleMake({ 
        id: editingMake.id, 
        name: newMakeName.trim() 
      })
      console.log('Marca actualizada:', updatedMake) // Debug
      // Actualizar y mantener orden por ID
      setMakes(prev => prev.map(make => 
        make.id === updatedMake.id ? updatedMake : make
      ).sort((a, b) => a.id - b.id))
      setNewMakeName("")
      setShowEditMake(false)
      setEditingMake(null)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: `Marca actualizada a "${updatedMake.name}"`,
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      console.error('Error al actualizar marca:', err) // Debug
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al actualizar la marca'
        })
      }
    }
  }

  async function handleDeleteMake(make: VehicleMake) {
    if (!window.Swal) {
      if (!confirm(`¿Estás seguro de eliminar la marca "${make.name}"?`)) {
        return
      }
    } else {
      const result = await window.Swal.fire({
        title: '¿Estás seguro?',
        text: `Se eliminará la marca "${make.name}" permanentemente`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      })

      if (!result.isConfirmed) return
    }

    try {
      console.log('Eliminando marca:', make.id) // Debug
      const deletedMake = await deleteVehicleMake(make.id)
      console.log('Marca eliminada:', deletedMake) // Debug
      setMakes(prev => prev.filter(m => m.id !== make.id))
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: `La marca "${make.name}" ha sido eliminada`,
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      console.error('Error al eliminar marca:', err) // Debug
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al eliminar la marca'
        })
      }
    }
  }

  async function handleCreateModel(e: React.FormEvent) {
    e.preventDefault()
    if (!newModelName.trim() || !selectedMakeId) return

    try {
      const newModel = await createVehicleModel({ 
        makeId: selectedMakeId, 
        name: newModelName.trim() 
      })
      // Agregar y reordenar por ID
      setModels(prev => [...prev, newModel].sort((a, b) => a.id - b.id))
      setNewModelName("")
      setSelectedMakeId(0)
      setShowCreateModel(false)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: `Modelo "${newModel.name}" creado correctamente`,
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al crear el modelo'
        })
      }
    }
  }

  async function handleEditModel(e: React.FormEvent) {
    e.preventDefault()
    if (!editingModel || !newModelName.trim() || !selectedMakeId) return

    try {
      const updatedModel = await updateVehicleModel({
        id: editingModel.id,
        makeId: selectedMakeId,
        name: newModelName.trim()
      })
      // Actualizar y mantener orden por ID
      setModels(prev => prev.map(model => 
        model.id === updatedModel.id ? updatedModel : model
      ).sort((a, b) => a.id - b.id))
      setNewModelName("")
      setSelectedMakeId(0)
      setShowEditModel(false)
      setEditingModel(null)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: `Modelo actualizado a "${updatedModel.name}"`,
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al actualizar el modelo'
        })
      }
    }
  }

  async function handleDeleteModel(model: VehicleModel) {
    const makeName = makes.find(m => m.id === model.makeId)?.name || 'Desconocida'
    
    if (!window.Swal) {
      if (!confirm(`¿Estás seguro de eliminar el modelo "${model.name}" de ${makeName}?`)) {
        return
      }
    } else {
      const result = await window.Swal.fire({
        title: '¿Estás seguro?',
        text: `Se eliminará el modelo "${model.name}" de ${makeName} permanentemente`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      })

      if (!result.isConfirmed) return
    }

    try {
      await deleteVehicleModel(model.id)
      setModels(prev => prev.filter(m => m.id !== model.id))
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: `El modelo "${model.name}" ha sido eliminado`,
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al eliminar el modelo'
        })
      }
    }
  }

  function openEditModal(make: VehicleMake) {
    setEditingMake(make)
    setNewMakeName(make.name)
    setShowEditMake(true)
  }

  function openEditModelModal(model: VehicleModel) {
    setEditingModel(model)
    setNewModelName(model.name)
    setSelectedMakeId(model.makeId)
    setShowEditModel(true)
  }

  function closeAllModals() {
    setShowCreateMake(false)
    setShowEditMake(false)
    setShowCreateModel(false)
    setShowEditModel(false)
    setEditingMake(null)
    setEditingModel(null)
    setNewMakeName("")
    setNewModelName("")
    setSelectedMakeId(0)
    setError("")
  }

  function getMakeName(makeId: number): string {
    return makes.find(m => m.id === makeId)?.name || 'Desconocida'
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
          <button 
            onClick={() => setShowCreateModel(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaCog size={14} />
            Nuevo Modelo
          </button>
        </div>
      </div>

      {/* Vehicle Makes Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaCar className="text-[var(--color-primary)]" size={20} />
            <h3 className="text-lg font-semibold">Marcas de Vehículos</h3>
            <span className="text-sm text-gray-500">({makes.length} marcas)</span>
          </div>
          <button 
            onClick={loadMakes}
            className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-2"
          >
            <FaSearch size={12} />
            Actualizar
          </button>
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
                    <button 
                      onClick={() => openEditModal(make)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50"
                      title="Editar marca"
                    >
                      <FaEdit size={14} />
                    </button>
                    {/* Botón de eliminar removido para marcas */}
                  </div>
                </div>
              </div>
            ))}
            
            {makes.length === 0 && !loading && (
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
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeAllModals}
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

      {/* Edit Make Modal */}
      {showEditMake && editingMake && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Marca de Vehículo</h3>
            <form onSubmit={handleEditMake}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nombre de la marca</label>
                <input
                  type="text"
                  value={newMakeName}
                  onChange={(e) => setNewMakeName(e.target.value)}
                  placeholder="Ej: Toyota, Honda, Ford..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">ID: {editingMake.id}</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                >
                  Actualizar Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Models Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaCog className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold">Modelos de Vehículos</h3>
            <span className="text-sm text-gray-500">({models.length} modelos)</span>
          </div>
          <button 
            onClick={loadModels}
            className="text-sm text-blue-600 hover:underline flex items-center gap-2"
          >
            <FaSearch size={12} />
            Actualizar
          </button>
        </div>

        {modelsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando modelos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div key={model.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-[var(--color-dark)]">{model.name}</h4>
                    <p className="text-sm text-gray-500">Marca: {getMakeName(model.makeId)}</p>
                    <p className="text-xs text-gray-400">ID: {model.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModelModal(model)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50"
                      title="Editar modelo"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteModel(model)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50"
                      title="Eliminar modelo"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {models.length === 0 && !modelsLoading && (
              <div className="col-span-full text-center py-8">
                <FaCog className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No hay modelos registrados</p>
                <button 
                  onClick={() => setShowCreateModel(true)}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Crear el primer modelo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Model Modal */}
      {showCreateModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nuevo Modelo de Vehículo</h3>
            <form onSubmit={handleCreateModel}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Marca</label>
                <select
                  value={selectedMakeId}
                  onChange={(e) => setSelectedMakeId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                  required
                >
                  <option value="">Seleccionar marca...</option>
                  {makes.map(make => (
                    <option key={make.id} value={make.id}>
                      {make.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nombre del modelo</label>
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Ej: Corolla, Civic, Sentra..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90"
                >
                  Crear Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Model Modal */}
      {showEditModel && editingModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Modelo de Vehículo</h3>
            <form onSubmit={handleEditModel}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Marca</label>
                <select
                  value={selectedMakeId}
                  onChange={(e) => setSelectedMakeId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                  required
                >
                  <option value="">Seleccionar marca...</option>
                  {makes.map(make => (
                    <option key={make.id} value={make.id}>
                      {make.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nombre del modelo</label>
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Ej: Corolla, Civic, Sentra..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">ID: {editingModel.id}</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90"
                >
                  Actualizar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
