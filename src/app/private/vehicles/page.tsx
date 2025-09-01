"use client"

import { useEffect, useState } from "react"
import { FaCar, FaPlus, FaEdit, FaTrash, FaSearch, FaCog, FaUser, FaCalendarAlt, FaEye, FaMapMarkerAlt, FaIdCard, FaHashtag } from "react-icons/fa"
import { 
  getVehicleMakes, 
  createVehicleMake, 
  updateVehicleMake, 
  VehicleMake,
  getVehicleModels,
  createVehicleModel,
  updateVehicleModel,
  deleteVehicleModel,
  VehicleModel,
  createVehicle,
  assignVehicleToUser,
  CreateVehicleRequest,
  getAllVehicles,
  getUnassignedVehicles,
  getUserVehicles,
  UserVehicleResponse,
  VehicleResponse
} from "@/features/vehicles/api"
import { getUsers } from "@/features/users/api"

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

export default function VehiclesPage() {
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [allVehicles, setAllVehicles] = useState<VehicleResponse[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleResponse[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [showCreateMake, setShowCreateMake] = useState(false)
  const [showEditMake, setShowEditMake] = useState(false)
  const [showCreateModel, setShowCreateModel] = useState(false)
  const [showEditModel, setShowEditModel] = useState(false)
  const [showRegisterVehicle, setShowRegisterVehicle] = useState(false)
  const [showAssignVehicle, setShowAssignVehicle] = useState(false)
  const [createdVehicle, setCreatedVehicle] = useState<any>(null)

  const [unassignedVehicles, setUnassignedVehicles] = useState<VehicleResponse[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(0)
  const [selectedClientId, setSelectedClientId] = useState<number>(0)
  const [assignmentLoading, setAssignmentLoading] = useState(false)

  const [editingMake, setEditingMake] = useState<VehicleMake | null>(null)
  const [newMakeName, setNewMakeName] = useState("")
  
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null)
  const [newModelName, setNewModelName] = useState("")
  const [selectedMakeId, setSelectedMakeId] = useState<number>(0)
  
  const [vehicleForm, setVehicleForm] = useState({
    plate: "",
    makeId: 0,
    modelId: 0,
    color: "",
    modelYear: new Date().getFullYear(),
    vin: "",
    customerId: 0
  })

  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMake, setSelectedMake] = useState("")

  useEffect(() => {
    loadMakes()
    loadModels()
    loadUsers()
    loadAllVehicles()
  }, [])

  useEffect(() => {
    filterVehicles()
  }, [searchTerm, selectedMake, allVehicles])

  async function loadMakes() {
    try {
      setLoading(true)
      setError("")
      const data = await getVehicleMakes()
      // Ordenar por ID ascendente el mas antiguo primero
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
      setLoading(true)
      const data = await getVehicleModels()
      const sortedData = Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : []
      setModels(sortedData)
    } catch (err: any) {
      console.error('Error loading models:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    try {
      const data = await getUsers()
      const clients = Array.isArray(data) ? data.filter(user => user.roleName === "Cliente") : []
      setUsers(clients.sort((a, b) => a.id - b.id))
    } catch (err: any) {
      console.error('Error loading users:', err)
    }
  }

  async function loadAllVehicles() {
    try {
      setVehiclesLoading(true)
      const data = await getAllVehicles()
      setAllVehicles(Array.isArray(data) ? data.sort((a, b) => b.id - a.id) : [])
    } catch (err: any) {
      console.error('Error loading all vehicles:', err)
    } finally {
      setVehiclesLoading(false)
    }
  }

  async function loadUnassignedVehicles() {
    try {
      setAssignmentLoading(true)
      const data = await getUnassignedVehicles()
      setUnassignedVehicles(Array.isArray(data) ? data.sort((a, b) => a.plate.localeCompare(b.plate)) : [])
      console.log(`[VEHICLES] Loaded ${data.length} unassigned vehicles`)
    } catch (err: any) {
      console.error('Error loading unassigned vehicles:', err)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los vehículos sin asignar'
        })
      }
    } finally {
      setAssignmentLoading(false)
    }
  }

  async function openAssignVehicleModal() {
    setShowAssignVehicle(true)
    setSelectedVehicleId(0)
    setSelectedClientId(0)
    
    // vehículos sin asignar
    await loadUnassignedVehicles()
    
    setTimeout(() => {
      if (unassignedVehicles.length === 0) {
        if (window.Swal) {
          window.Swal.fire({
            icon: 'info',
            title: 'Sin vehículos disponibles',
            text: 'No hay vehículos sin asignar disponibles para asignar a un cliente',
            confirmButtonText: 'Entendido'
          })
        }
        setShowAssignVehicle(false)
      }
    }, 100)
  }

  async function handleAssignExistingVehicle() {
    if (!selectedVehicleId || !selectedClientId) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'warning',
          title: 'Datos incompletos',
          text: 'Por favor selecciona un vehículo y un cliente'
        })
      }
      return
    }

    try {
      setAssignmentLoading(true)
      await assignVehicleToUser(selectedClientId, selectedVehicleId)
      
      await Promise.all([loadAllVehicles(), loadUnassignedVehicles()])
      
      setShowAssignVehicle(false)
      setSelectedVehicleId(0)
      setSelectedClientId(0)
      
      if (window.Swal) {
        const vehicle = unassignedVehicles.find(v => v.id === selectedVehicleId)
        const client = users.find(u => u.id === selectedClientId)
        
        window.Swal.fire({
          icon: 'success',
          title: 'Vehículo asignado exitosamente',
          html: `
            <div class="text-left">
              <p><strong>Vehículo:</strong> ${vehicle?.plate} - ${vehicle?.make} ${vehicle?.model}</p>
              <p><strong>Cliente:</strong> ${client?.name}</p>
            </div>
          `,
          timer: 3000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      console.error('Error assigning vehicle:', err)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error al asignar vehículo',
          text: err.message || 'No se pudo asignar el vehículo al cliente'
        })
      }
    } finally {
      setAssignmentLoading(false)
    }
  }

  function filterVehicles() {
    let filtered = allVehicles

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

  async function handleCreateMake(e: React.FormEvent) {
    e.preventDefault()
    if (!newMakeName.trim()) return

    try {
      console.log('Creando marca:', { name: newMakeName.trim() })
      const newMake = await createVehicleMake({ name: newMakeName.trim() })
      console.log('Marca creada:', newMake)
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
      console.error('Error al crear marca:', err) // debug
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
      console.log('Marca actualizada:', updatedMake) // debug
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
      console.error('Error al actualizar marca:', err) // debug
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

  async function handleCreateModel(e: React.FormEvent) {
    e.preventDefault()
    if (!newModelName.trim() || !selectedMakeId) return

    try {
      const newModel = await createVehicleModel({ 
        makeId: selectedMakeId, 
        name: newModelName.trim() 
      })
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

  async function handleRegisterVehicle(e: React.FormEvent) {
    e.preventDefault()
    if (!vehicleForm.plate.trim() || !vehicleForm.makeId || !vehicleForm.modelId) return

    try {
      const vehicleData: CreateVehicleRequest = {
        vin: vehicleForm.vin.trim() || undefined,
        plate: vehicleForm.plate.trim().toUpperCase(),
        makeId: vehicleForm.makeId,
        modelId: vehicleForm.modelId,
        color: vehicleForm.color.trim() || undefined,
        modelYear: vehicleForm.modelYear,
        customerId: vehicleForm.customerId || undefined
      }

      console.log('Creating vehicle with data:', vehicleData)
      const newVehicle = await createVehicle(vehicleData)
      setCreatedVehicle(newVehicle)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Vehículo Registrado!',
          text: `Vehículo ${newVehicle.plate} registrado exitosamente con ID: ${newVehicle.id}`,
          timer: 3000,
          showConfirmButton: false
        })
      }
      
      // Si se seleccionó cliente, también asignar automáticamente
      if (vehicleForm.customerId) {
        try {
          await assignVehicleToUser(vehicleForm.customerId, newVehicle.id)
          
          if (window.Swal) {
            window.Swal.fire({
              icon: 'success',
              title: '¡Vehículo Asignado!',
              text: `Vehículo ${newVehicle.plate} asignado al cliente automáticamente`,
              timer: 2000,
              showConfirmButton: false
            })
          }
          
          // Cerrar modal después de asignación automática
          resetVehicleForm()
          setCreatedVehicle(null)
          setShowRegisterVehicle(false)
        } catch (assignError: any) {
          console.log('Vehicle created but assignment failed:', assignError)
        }
      }
      
    } catch (err: any) {
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al registrar el vehículo'
        })
      }
    }
  }

  async function handleAssignVehicle(e: React.FormEvent) {
    e.preventDefault()
    if (!createdVehicle || !vehicleForm.customerId) return

    try {
      await assignVehicleToUser(vehicleForm.customerId, createdVehicle.id)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Vehículo Asignado!',
          text: `Vehículo ${createdVehicle.plate} asignado al cliente exitosamente`,
          timer: 2000,
          showConfirmButton: false
        })
      }
      
      resetVehicleForm()
      setCreatedVehicle(null)
      setShowRegisterVehicle(false)
    } catch (err: any) {
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al asignar el vehículo'
        })
      }
    }
  }

  function resetVehicleForm() {
    setVehicleForm({
      plate: "",
      makeId: 0,
      modelId: 0,
      color: "",
      modelYear: new Date().getFullYear(),
      vin: "",
      customerId: 0
    })
  }

  function closeAllModals() {
    setShowCreateMake(false)
    setShowEditMake(false)
    setShowCreateModel(false)
    setShowEditModel(false)
    setShowRegisterVehicle(false)
    setEditingMake(null)
    setEditingModel(null)
    setNewMakeName("")
    setNewModelName("")
    setSelectedMakeId(0)
    resetVehicleForm()
    setError("")
  }

  function getMakeName(makeId: number): string {
    return makes.find(m => m.id === makeId)?.name || 'Desconocida'
  }

  function getModelName(modelId: number): string {
    return models.find(m => m.id === modelId)?.name || 'Desconocido'
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

  async function handleViewVehicleDetails(vehicle: VehicleResponse) {
    if (!window.Swal) return

    window.Swal.fire({
      title: 'Cargando detalles...',
      allowOutsideClick: false,
      didOpen: () => {
        window.Swal.showLoading()
      }
    })

    let ownerInfo = 'Sin dueño asignado'
    let ownerBgColor = 'bg-orange-50'
    
    try {
      console.log(`[VEHICLES] Buscando dueño para vehículo ${vehicle.id}`)
      
      for (const user of users) {
        try {
          const userVehicles = await getUserVehicles(user.id)
          const hasVehicle = userVehicles.some((userVehicle: UserVehicleResponse) => 
            userVehicle.vehicleResponse.id === vehicle.id
          )
          
          if (hasVehicle) {
            ownerInfo = `${user.name} (${user.email})`
            ownerBgColor = 'bg-purple-50'
            console.log(`[VEHICLES] Dueño encontrado: ${user.name}`)
            break
          }
        } catch (error) {
          console.log(`[VEHICLES] Error checking user ${user.id}:`, error)
          continue
        }
      }
    } catch (error) {
      console.error('[VEHICLES] Error general buscando dueño:', error)
      ownerInfo = 'Error al buscar dueño'
      ownerBgColor = 'bg-red-50'
    }

    window.Swal.fire({
      title: `Detalles del Vehículo - ${vehicle.plate}`,
      html: `
        <div class="text-left space-y-3">
          <div class="bg-blue-50 p-3 rounded">
            <p><strong>Placa:</strong> ${vehicle.plate}</p>
            <p><strong>Marca:</strong> ${vehicle.make}</p>
            <p><strong>Modelo:</strong> ${vehicle.model}</p>
          </div>
          <div class="bg-green-50 p-3 rounded">
            <p><strong>Color:</strong> ${vehicle.color || 'No especificado'}</p>
            <p><strong>VIN:</strong> ${vehicle.vin || 'No registrado'}</p>
            <p><strong>ID:</strong> ${vehicle.id}</p>
          </div>
          <div class="${ownerBgColor} p-3 rounded">
            <p><strong>Dueño:</strong> ${ownerInfo}</p>
          </div>
          <div class="bg-yellow-50 p-3 rounded">
            <p><strong>Registrado:</strong> ${new Date(vehicle.createdAt).toLocaleString()}</p>
          </div>
        </div>
      `,
      icon: 'info',
      width: '500px',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Cerrar'
    })
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

  const uniqueVehicleMakes = Array.from(new Set(allVehicles.map(v => v.make))).sort()

  const currentYears = Array.from({length: 30}, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Gestión de Vehículos
          </h1>
          <p className="text-gray-600 mt-2">
            Administra marcas, modelos y registra vehículos para clientes
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
          <button 
            onClick={() => setShowRegisterVehicle(true)}
            className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaCar size={14} />
            Registrar Vehículo
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

        {loading ? (
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
            
            {models.length === 0 && !loading && (
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

      {/* Vregistro carros*/}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaCar className="text-[var(--color-accent)]" size={20} />
          <h3 className="text-lg font-semibold">Registro de Vehículos</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Como administrador, puedes registrar vehículos y asignarlos a clientes existentes.
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowRegisterVehicle(true)}
            className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaCar size={16} />
            Registrar Nuevo Vehículo
          </button>
          
          <button 
            onClick={() => openAssignVehicleModal()}
            className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaUser size={16} />
            Asignar Cliente a Vehículo
          </button>
        </div>
      </div>

      {/* tabla */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaCar className="text-[var(--color-primary)]" size={20} />
            <h3 className="text-lg font-semibold">Lista de Todos los Vehículos</h3>
            <span className="text-sm text-gray-500">({allVehicles.length} vehículos registrados)</span>
          </div>
          <button 
            onClick={loadAllVehicles}
            className="text-[var(--color-primary)] hover:underline flex items-center gap-2"
          >
            <FaSearch size={12} />
            Actualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vehículos</p>
                <p className="text-2xl font-bold text-[var(--color-primary)]">{allVehicles.length}</p>
              </div>
              <FaCar className="text-[var(--color-primary)]" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Marcas Diferentes</p>
                <p className="text-2xl font-bold text-blue-600">{uniqueVehicleMakes.length}</p>
              </div>
              <FaHashtag className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mostrando</p>
                <p className="text-2xl font-bold text-green-600">{filteredVehicles.length}</p>
              </div>
              <FaSearch className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              {uniqueVehicleMakes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
          </div>
        </div>

        {vehiclesLoading ? (
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

            {filteredVehicles.length === 0 && !vehiclesLoading && (
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

      {showRegisterVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Registrar Nuevo Vehículo {createdVehicle && '- Paso 2: Asignación'}
            </h3>
            
            {createdVehicle && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  Vehículo <strong>{createdVehicle.plate}</strong> registrado exitosamente (ID: {createdVehicle.id})
                </p>
                <p className="text-green-700 text-xs mt-1">
                  Ahora puedes asignarlo a un cliente o cerrar si ya fue asignado automáticamente
                </p>
              </div>
            )}
            
            <form onSubmit={createdVehicle ? handleAssignVehicle : handleRegisterVehicle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Cliente {createdVehicle ? '*' : '(opcional)'}
                </label>
                <select
                  value={vehicleForm.customerId}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, customerId: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required={createdVehicle !== null}
                >
                  <option value="">Seleccionar cliente...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {createdVehicle ? 
                    'Selecciona el cliente al que asignar el vehículo' : 
                    'Si seleccionas un cliente, se asignará automáticamente tras el registro'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Placa *</label>
                <input
                  type="text"
                  value={vehicleForm.plate}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                  placeholder="Ej: ABC-123"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                  disabled={createdVehicle !== null}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Marca *</label>
                <select
                  value={vehicleForm.makeId}
                  onChange={(e) => {
                    const makeId = Number(e.target.value)
                    setVehicleForm(prev => ({ ...prev, makeId, modelId: 0 }))
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                  disabled={createdVehicle !== null}
                >
                  <option value="">Seleccionar marca...</option>
                  {makes.map(make => (
                    <option key={make.id} value={make.id}>
                      {make.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Modelo *</label>
                <select
                  value={vehicleForm.modelId}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, modelId: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                  disabled={!vehicleForm.makeId || createdVehicle !== null}
                >
                  <option value="">Seleccionar modelo...</option>
                  {models.filter(m => m.makeId === vehicleForm.makeId).map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Año</label>
                <select
                  value={vehicleForm.modelYear}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, modelYear: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  disabled={createdVehicle !== null}
                >
                  {currentYears.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <input
                  type="text"
                  value={vehicleForm.color}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="Ej: Blanco, Negro, Azul..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  disabled={createdVehicle !== null}
                />
              </div>

              {/* VIN */}
              <div>
                <label className="block text-sm font-medium mb-2">VIN (opcional)</label>
                <input
                  type="text"
                  value={vehicleForm.vin}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                  placeholder="Número de identificación vehicular"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  disabled={createdVehicle !== null}
                />
              </div>

              {error && <div className="md:col-span-2 text-red-600 text-sm">{error}</div>}

              <div className="md:col-span-2 flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {createdVehicle ? 'Cerrar' : 'Cancelar'}
                </button>
                
                {!createdVehicle ? (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                    disabled={!vehicleForm.plate.trim() || !vehicleForm.makeId || !vehicleForm.modelId}
                  >
                    Registrar Vehículo
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-90"
                    disabled={!vehicleForm.customerId}
                  >
                    Asignar a Cliente
                  </button>
                )}
                
                {createdVehicle && (
                  <button
                    type="button"
                    onClick={() => {
                      resetVehicleForm()
                      setCreatedVehicle(null)
                      setShowRegisterVehicle(false)
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:opacity-90"
                  >
                    Terminar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Asignar Cliente a Vehículo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vehículo disponible *</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                  disabled={assignmentLoading}
                >
                  <option value="">
                    {assignmentLoading 
                      ? "Cargando vehículos..." 
                      : "Seleccionar vehículo sin dueño..."
                    }
                  </option>
                  {unassignedVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.make} {vehicle.model} ({vehicle.color || 'Sin color'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {unassignedVehicles.length} vehículos sin dueño disponibles
                </p>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium mb-2">Cliente *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                >
                  <option value="">Seleccionar cliente...</option>
                  {users.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {users.length} clientes disponibles
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAssignVehicle(false)
                  setSelectedVehicleId(0)
                  setSelectedClientId(0)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={assignmentLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAssignExistingVehicle}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                disabled={!selectedVehicleId || !selectedClientId || assignmentLoading}
              >
                {assignmentLoading ? 'Asignando...' : 'Asignar Vehículo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function createVehicleVisit({ visitData }: { visitData: { vehicleId: number; customerId: number; notes: string}  }) {
  throw new Error("Function not implemented.")
}
