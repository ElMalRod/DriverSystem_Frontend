"use client"

import { useEffect, useState } from "react"
import { FaCar, FaUser, FaCalendarAlt, FaEye, FaEdit, FaTrash, FaMapMarkerAlt, FaPlus, FaSearch, FaCog, FaTimes } from "react-icons/fa"
import { 
  getVehicleVisits,
  getVehicleVisitById, 
  deleteVehicleVisit, 
  updateVehicleVisitDeparture,
  createVehicleVisit,
  VehicleVisitResponse,
  CreateVehicleVisitRequest,
  Vehicle,
  getVehicles,
  updateVehicleVisit,
  updateVisitStatus,
  getUserVehicles,
  UserVehicleResponse
} from "@/features/vehicles/api"
import { getUsers } from "@/features/users/api"

declare global {
  interface Window {
    Swal: any;
  }
}

export default function VehicleVisitsPage() {
  const [visits, setVisits] = useState<VehicleVisitResponse[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]) // Vehículos del cliente seleccionado
  const [loading, setLoading] = useState(true)
  const [loadingCustomerVehicles, setLoadingCustomerVehicles] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVisit, setEditingVisit] = useState<VehicleVisitResponse | null>(null)
  const [selectedVisit, setSelectedVisit] = useState<VehicleVisitResponse | null>(null)
  const [error, setError] = useState("")

  const [editForm, setEditForm] = useState({
    notes: "",
    departedAt: ""
  })

  const [createForm, setCreateForm] = useState({
    vehicleId: 0,
    customerId: 0,
    notes: "",
    departedAt: ""
  })

  const [selectedStatus, setSelectedStatus] = useState<string>("")

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadCustomerVehicles(customerId: number) {
    if (!customerId) {
      setCustomerVehicles([])
      return
    }

    try {
      setLoadingCustomerVehicles(true)
      console.log(`[VISITS] Loading vehicles for customer: ${customerId}`)
      
      const userVehicles = await getUserVehicles(customerId)
      console.log(`[VISITS] Customer vehicles response:`, userVehicles)
      
      if (!userVehicles || userVehicles.length === 0) {
        setCustomerVehicles([])
        const customerName = getCustomerName(customerId)
        console.log(`[VISITS] Showing alert for customer ${customerName} - no vehicles found`)
        console.log(`[VISITS] window.Swal available:`, !!window.Swal)
        
        if (window.Swal) {
          window.Swal.fire({
            icon: 'info',
            title: 'Sin vehículos registrados',
            html: `
              <div class="text-left">
                <p>El cliente <strong>${customerName}</strong> no tiene vehículos registrados aún.</p>
                <br>
                <p class="text-sm text-gray-600">Para crear una visita, primero debe registrar al menos un vehículo para este cliente.</p>
              </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3085d6'
          })
        } else {
          console.log('[VISITS] SweetAlert not available, using native alert')
          alert(`El cliente ${customerName} no tiene vehículos registrados aún.`)
        }
        return
      }
      
      const vehicles = userVehicles.map((userVehicle: UserVehicleResponse) => ({
        id: userVehicle.vehicleResponse.id,
        plate: userVehicle.vehicleResponse.plate,
        make: userVehicle.vehicleResponse.make,
        model: userVehicle.vehicleResponse.model,
        year: 2024, 
        color: userVehicle.vehicleResponse.color,
        vin: userVehicle.vehicleResponse.vin
      }))
      
      setCustomerVehicles(vehicles)
      console.log(`[VISITS] Loaded ${vehicles.length} vehicles for customer ${customerId}`)
    } catch (err: any) {
      if (err.message.includes('HTTP 404') || err.message.includes('404')) {
        console.log(`[VISITS] Customer ${customerId} has no vehicles:`, err.message)
      } else {
        console.error('Error loading customer vehicles:', err)
      }
      
      setCustomerVehicles([])
      
      if (err.message.includes('HTTP 404') || err.message.includes('404')) {
        const customerName = getCustomerName(customerId)
        
        if (window.Swal) {
          window.Swal.fire({
            icon: 'info',
            title: 'Sin vehículos registrados',
            html: `
              <div class="text-left">
                <p>El cliente <strong>${customerName}</strong> no tiene vehículos registrados aún.</p>
                <br>
                <p class="text-sm text-gray-600">Para crear una visita, primero debe registrar al menos un vehículo para este cliente.</p>
              </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3085d6'
          })
        } else {
          console.log('[VISITS] SweetAlert not available, using native alert')
          alert(`El cliente ${customerName} no tiene vehículos registrados aún.`)
        }
      } else {
        setError(`Error al cargar vehículos del cliente: ${err.message}`)
      }
    } finally {
      setLoadingCustomerVehicles(false)
    }
  }

  function handleCustomerChange(customerId: number) {
    setCreateForm(prev => ({ 
      ...prev, 
      customerId, 
      vehicleId: 0 
    }))
    loadCustomerVehicles(customerId)
  }

  async function loadAllData() {
    try {
      setLoading(true)
      const [visitsData, usersData, vehiclesData] = await Promise.all([
        getVehicleVisits(),
        getUsers(),
        getVehicles()
      ])
      
      setVisits(Array.isArray(visitsData) ? visitsData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
      setVehicles(Array.isArray(vehiclesData) 
        ? vehiclesData.map((v: any) => ({
            id: v.id,
            plate: v.plate,
            make: v.make,
            model: v.model,
            year: v.year ?? 0, 
            color: v.color,
            vin: v.vin
          }))
        : []
      )
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }


  async function handleCreateVisit(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.vehicleId || !createForm.customerId) return

    try {
      const visitData: CreateVehicleVisitRequest = {
        id: 0,
        vehicleId: createForm.vehicleId,
        customerId: createForm.customerId,
        departedAt: createForm.departedAt || undefined,
        notes: createForm.notes.trim()
      }

      console.log('Creating visit with data:', visitData)
      const newVisit = await createVehicleVisit(visitData)
      
      setVisits(prev => [...prev, newVisit])
      resetCreateForm()
      setShowCreateModal(false)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Visita creada!',
          text: `Nueva visita #${newVisit.id} registrada exitosamente`,
          timer: 3000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      console.error('Error creating visit:', err)
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al crear la visita'
        })
      }
    }
  }

  function resetCreateForm() {
    setCreateForm({
      vehicleId: 0,
      customerId: 0,
      notes: "",
      departedAt: ""
    })
    setCustomerVehicles([]) 
  }

  function getCustomerName(customerId: number): string {
    const user = users.find(u => u.id === customerId)
    return user ? user.name : `Cliente #${customerId}`
  }

  function getVehicleInfo(vehicleId: number): string {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    return vehicle ? `${vehicle.plate} - ${vehicle.make} ${vehicle.model}` : `Vehículo #${vehicleId}`
  }

  useEffect(() => {
    loadVisits()
  }, [])

  async function loadVisits() {
    try {
      setLoading(true)
      const data = await getVehicleVisits()
      setVisits(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Error loading visits:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleViewVisit(visitId: number) {
    try {
      const visit = await getVehicleVisitById(visitId)
      if (window.Swal) {
        window.Swal.fire({
          title: `Visita #${visit.id}`,
          html: `
            <div class="text-left space-y-2">
              <p><strong>Vehículo:</strong> ${visit.vehicleId}</p>
              <p><strong>Cliente:</strong> ${visit.customerId}</p>
              <p><strong>Estado:</strong> <span class="px-2 py-1 rounded text-xs ${getStatusColor(visit.status)}">${visit.status}</span></p>
              <p><strong>Llegada:</strong> ${new Date(visit.arrivedAt).toLocaleString()}</p>
              <p><strong>Salida:</strong> ${visit.departedAt ? new Date(visit.departedAt).toLocaleString() : 'Aún en taller'}</p>
              <p><strong>Notas:</strong> ${visit.notes || 'Sin notas'}</p>
            </div>
          `,
          icon: 'info',
          width: '500px'
        })
      }
    } catch (err: any) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los detalles de la visita'
        })
      }
    }
  }

  async function handleEditVisit(visit: VehicleVisitResponse) {
    setEditingVisit(visit)
    setEditForm({
      notes: visit.notes || "",
      departedAt: visit.departedAt || ""
    })
    setShowEditModal(true)
  }

  async function handleUpdateVisit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingVisit) return

    try {
      const updateData: CreateVehicleVisitRequest = {
        id: editingVisit.id,
        vehicleId: editingVisit.vehicleId,
        customerId: editingVisit.customerId,
        departedAt: editForm.departedAt || undefined,
        notes: editForm.notes
      }

      const updatedVisit = await updateVehicleVisit(editingVisit.id, editingVisit.status, updateData)
      setVisits(prev => prev.map(v => 
        v.id === updatedVisit.id ? { ...v, ...updatedVisit } : v
      ))
      
      setShowEditModal(false)
      setEditingVisit(null)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'Visita actualizada correctamente',
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
          text: err.message || 'Error al actualizar la visita'
        })
      }
    }
  }

  async function handleChangeStatus(visit: VehicleVisitResponse) {
    setSelectedVisit(visit)
    setSelectedStatus(visit.status)
    setShowStatusModal(true)
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVisit || !selectedStatus) return

    try {
      console.log(`[VISITS] Updating visit ${selectedVisit.id} status from ${selectedVisit.status} to: ${selectedStatus}`)
      
      const updatedVisit = await updateVisitStatus(selectedVisit.id, selectedStatus)
      console.log(`[VISITS] Updated visit response:`, updatedVisit)
      
      if (updatedVisit && typeof updatedVisit === 'object' && 'message' in updatedVisit) {
        console.log(`[VISITS] Visit was deleted:`, updatedVisit.message)
        
        // si la visita fue cancelada y eliminada removerla de la lista
        setVisits(prev => prev.filter(v => v.id !== selectedVisit.id))
        
        setShowStatusModal(false)
        setSelectedVisit(null)
        setSelectedStatus("")
        
        if (window.Swal) {
          window.Swal.fire({
            icon: 'success',
            title: '¡Visita cancelada!',
            text: updatedVisit.message || 'La visita ha sido cancelada y eliminada',
            timer: 3000,
            showConfirmButton: false
          })
        }
        return
      }
      
      setVisits(prev => prev.map(v => 
        v.id === selectedVisit.id 
          ? {
              ...v,
              ...(typeof updatedVisit === 'object' && updatedVisit !== null ? updatedVisit : {}),
              status: (updatedVisit && typeof updatedVisit === 'object' && 'status' in updatedVisit ? updatedVisit.status : selectedStatus) as 'NUEVA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA'
            }
          : v
      ))
      
      setShowStatusModal(false)
      setSelectedVisit(null)
      setSelectedStatus("")
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Estado actualizado!',
          html: `
            <div class="text-left">
              <p>Visita <strong>#${selectedVisit.id}</strong></p>
              <p>Estado anterior: <span class="text-gray-500">${selectedVisit.status}</span></p>
              <p>Estado nuevo: <span class="text-green-600 font-semibold">${updatedVisit.status || selectedStatus}</span></p>
            </div>
          `,
          timer: 3000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      console.error('[VISITS] Error updating status:', err)
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error al actualizar estado',
          text: err.message || 'No se pudo actualizar el estado de la visita',
          confirmButtonText: 'Cerrar'
        })
      }
    }
  }

  async function handleMarkDeparture(visitId: number) {
    if (window.Swal) {
      const result = await window.Swal.fire({
        title: '¿Marcar salida?',
        text: 'Se registrará la hora actual como salida del vehículo',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, marcar salida',
        cancelButtonText: 'Cancelar'
      })

      if (!result.isConfirmed) return
    }

    try {
      await updateVehicleVisitDeparture(visitId)
      
      setVisits(prev => prev.map(v => 
        v.id === visitId ? { ...v, departedAt: new Date().toISOString() } : v
      ))
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Salida registrada!',
          text: 'La salida del vehículo ha sido registrada',
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al registrar la salida'
        })
      }
    }
  }

  async function handleDeleteVisit(visitId: number) {
    if (window.Swal) {
      const result = await window.Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
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
      await deleteVehicleVisit(visitId)
      // await deleteVehicleVisit(visitId)
      setVisits(prev => prev.filter(v => v.id !== visitId))
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'La visita ha sido eliminada',
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar la visita'
        })
      }
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'NUEVA': return 'bg-blue-100 text-blue-800'
      case 'EN_PROCESO': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETADA': return 'bg-green-100 text-green-800'
      case 'CANCELADA': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'NUEVA': return ''
      case 'EN_PROCESO': return ''
      case 'COMPLETADA': return ''
      case 'CANCELADA': return ''
      default: return ''
    }
  }

  function closeModals() {
    setShowEditModal(false)
    setShowStatusModal(false)
    setShowCreateModal(false)
    setEditingVisit(null)
    setSelectedVisit(null)
    setEditForm({ notes: "", departedAt: "" })
    setSelectedStatus("")
    resetCreateForm()
    setError("")
  }

  const statusOptions = [
    { value: 'NUEVA', label: 'Nueva' },
    { value: 'EN_PROCESO', label: 'En Proceso' },
    { value: 'COMPLETADA', label: 'Completada' },
    { value: 'CANCELADA', label: 'Cancelada' }
  ]

  const clients = users.filter(user => user.roleName === "Cliente" || user.userType === "Cliente")

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Visitas de Vehículos
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona las visitas de vehículos al taller y su estado
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={loadVisits}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaSearch size={14} />
            Actualizar
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaPlus size={14} />
            Nueva Visita
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statusOptions.map(status => {
          const count = visits.filter(v => v.status === status.value).length
          return (
            <div key={status.value} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{status.label}</p>
                  <p className="text-2xl font-bold text-[var(--color-primary)]">{count}</p>
                </div>
                <span className="text-2xl">{getStatusIcon(status.value)}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaCar className="text-[var(--color-primary)]" size={20} />
            <h3 className="text-lg font-semibold">Lista de Visitas</h3>
            <span className="text-sm text-gray-500">({visits.length} visitas)</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando visitas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Vehículo</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Llegada</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Notas</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{visit.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{visit.vehiclePlate || `Vehículo #${visit.vehicleId}`}</span>
                        <span className="text-xs text-gray-500">
                          {visit.vehicleMake && visit.vehicleModel ? `${visit.vehicleMake} ${visit.vehicleModel}` : 'Sin datos'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-green-600" size={12} />
                        <span>{visit.customerName || `Cliente #${visit.customerId}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-500" size={12} />
                        {new Date(visit.arrivedAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                        {getStatusIcon(visit.status)} {visit.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {visit.notes || 'Sin notas'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleViewVisit(visit.id)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <FaEye size={12} />
                        </button>
                        <button 
                          onClick={() => handleEditVisit(visit)}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                          title="Editar visita"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          onClick={() => handleChangeStatus(visit)}
                          className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50"
                          title="Cambiar estado"
                        >
                          <FaCog size={12} />
                        </button>
                        {visit.status !== 'COMPLETADA' && !visit.departedAt && (
                          <button 
                            onClick={() => handleMarkDeparture(visit.id)}
                            className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50"
                            title="Marcar salida"
                          >
                            <FaMapMarkerAlt size={12} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteVisit(visit.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Eliminar visita"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visits.length === 0 && (
              <div className="text-center py-8">
                <FaCar className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No hay visitas registradas</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nueva Visita de Vehículo</h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateVisit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Cliente *</label>
                <select
                  value={createForm.customerId}
                  onChange={(e) => handleCustomerChange(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">{clients.length} clientes disponibles</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Vehículo *</label>
                <select
                  value={createForm.vehicleId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, vehicleId: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                  disabled={!createForm.customerId || loadingCustomerVehicles}
                >
                  <option value="">
                    {!createForm.customerId 
                      ? "Primero selecciona un cliente..." 
                      : loadingCustomerVehicles 
                        ? "Cargando vehículos..." 
                        : "Seleccionar vehículo..."
                    }
                  </option>
                  {customerVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.make} {vehicle.model} ({vehicle.color || 'Sin color'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {createForm.customerId 
                    ? `${customerVehicles.length} vehículos del cliente seleccionado`
                    : "Selecciona un cliente para ver sus vehículos"
                  }
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Notas del servicio</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Describe el problema o servicio requerido..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Fecha de salida estimada (opcional)</label>
                <input
                  type="datetime-local"
                  value={createForm.departedAt}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, departedAt: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500 mt-1">Si no se especifica, se puede actualizar después</p>
              </div>

              {error && <div className="md:col-span-2 text-red-600 text-sm">{error}</div>}

              <div className="md:col-span-2 flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                  disabled={!createForm.vehicleId || !createForm.customerId}
                >
                  Crear Visita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Visita #{editingVisit.id}</h3>
            <form onSubmit={handleUpdateVisit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Notas</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="Agregar notas sobre la visita..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Fecha de salida (opcional)</label>
                <input
                  type="datetime-local"
                  value={editForm.departedAt ? new Date(editForm.departedAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, departedAt: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStatusModal && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cambiar Estado - Visita #{selectedVisit.id}</h3>
            <form onSubmit={handleUpdateStatus}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Estado actual: 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedVisit.status)}`}>
                    {getStatusIcon(selectedVisit.status)} {selectedVisit.status}
                  </span>
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nuevo estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {getStatusIcon(option.value)} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              </div>

              {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:opacity-90"
                  disabled={!selectedStatus || selectedStatus === selectedVisit.status}
                >
                  Cambiar Estado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


