"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSessionUser } from "@/utils/session"
import type { User } from "@/types/auth"
import { getAllWorkOrders, type WorkOrder } from "@/features/work-orders/api"
import { 
  FaCar, 
  FaUsers, 
  FaTools, 
  FaBoxes, 
  FaFileInvoiceDollar, 
  FaChartBar,
  FaPlus,
  FaEye,
  FaCog,
  FaUserTie,
  FaTruck
} from "react-icons/fa"

interface Stats {
  vehiculosActivos: number
  trabajosEnProgreso: number
  trabajosFinalizados: number
  trabajosCancelados: number
  clientesTotal: number
  empleados: number
  especialistas: number
  inventarioTotal: number
  facturasPendientes: number
  pagosProveedores: number
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats>({
    vehiculosActivos: 24,
    trabajosEnProgreso: 0,
    trabajosFinalizados: 0,
    trabajosCancelados: 0,
    clientesTotal: 89,
    empleados: 8,
    especialistas: 5,
    inventarioTotal: 340,
    facturasPendientes: 15,
    pagosProveedores: 8
  })
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getSessionUser())
    loadWorkOrdersData()
  }, [])

  const loadWorkOrdersData = async () => {
    try {
      setLoading(true)
      const orders = await getAllWorkOrders()
      setWorkOrders(orders)
      
      // Calcular estadísticas reales basadas en los datos
      const trabajosEnProgreso = orders.filter(order => 
        order.status === 'Assigned' || order.status === 'In Progress' || 
        order.status === 'Evaluating' || order.status === 'Pending'
      ).length
      
      const trabajosFinalizados = orders.filter(order => 
        order.status === 'Completed' || order.status === 'Finished'
      ).length
      
      const trabajosCancelados = orders.filter(order => 
        order.status === 'Cancelled' || order.status === 'Rejected'
      ).length
      
      setStats(prevStats => ({
        ...prevStats,
        trabajosEnProgreso,
        trabajosFinalizados,
        trabajosCancelados
      }))
    } catch (error) {
      console.error('Error loading work orders data:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateTo = (path: string) => {
    router.push(path)
  }

  // Obtener trabajos activos (en progreso) para mostrar
  const getActiveWorkOrders = () => {
    return workOrders
      .filter(order => 
        order.status === 'Assigned' || order.status === 'In Progress' || 
        order.status === 'Evaluating' || order.status === 'Pending'
      )
      .slice(0, 2) // Mostrar solo los primeros 2
  }

  const getStatusDisplayName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Assigned': 'Asignado',
      'In Progress': 'En Progreso', 
      'Evaluating': 'En Evaluación',
      'Pending': 'Pendiente',
      'Completed': 'Completado',
      'Finished': 'Finalizado',
      'Cancelled': 'Cancelado',
      'Rejected': 'Rechazado'
    }
    return statusMap[status] || status
  }

  const getMaintenanceTypeDisplayName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'Corrective': 'Mantenimiento Correctivo',
      'Preventive': 'Mantenimiento Preventivo'
    }
    return typeMap[type] || type
  }

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'Assigned': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Evaluating': 'bg-yellow-100 text-yellow-800',
      'Pending': 'bg-gray-100 text-gray-800',
      'Completed': 'bg-green-100 text-green-800',
      'Finished': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Rejected': 'bg-red-100 text-red-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Panel de Administrador
          </h1>
          <p className="text-gray-600 mt-2">
            Control total del sistema de gestión del taller
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigateTo('/private/vehicles')}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaPlus size={14} />
            Nuevo Vehículo
          </button>
          <button 
            onClick={() => navigateTo('/private/work-orders')}
            className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaPlus size={14} />
            Nuevo Trabajo
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vehículos Activos</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">{stats.vehiculosActivos}</p>
            </div>
            <FaCar className="text-[var(--color-primary)] opacity-70" size={24} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Trabajos en Progreso</p>
              <p className="text-2xl font-bold text-blue-600">{stats.trabajosEnProgreso}</p>
            </div>
            <FaTools className="text-blue-600 opacity-70" size={24} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Trabajos Finalizados</p>
              <p className="text-2xl font-bold text-green-600">{stats.trabajosFinalizados}</p>
            </div>
            <FaCog className="text-green-600 opacity-70" size={24} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventario Total</p>
              <p className="text-2xl font-bold text-[var(--color-accent)]">{stats.inventarioTotal}</p>
            </div>
            <FaBoxes className="text-[var(--color-accent)] opacity-70" size={24} />
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gestión de Vehículos */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaCar className="text-[var(--color-primary)]" size={20} />
            <h3 className="text-lg font-semibold">Gestión de Vehículos</h3>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => navigateTo('/private/vehicles')}
              className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3"
            >
              <FaPlus size={14} />
              Registrar Nuevo Vehículo
            </button>
            <button 
              onClick={() => navigateTo('/private/vehicles')}
              className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3"
            >
              <FaEye size={14} />
              Ver Todos los Vehículos
            </button>
            <button 
              onClick={() => navigateTo('/private/vehicle-visits')}
              className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3"
            >
              <FaChartBar size={14} />
              Historial de Entradas/Salidas
            </button>
          </div>
        </div>

        {/* Gestión de Personal */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaUsers className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold">Gestión de Personal</h3>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => navigateTo('/private/users')}
              className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3"
            >
              <FaPlus size={14} />
              Registrar Cliente
            </button>
            <button 
              onClick={() => navigateTo('/private/users')}
              className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3"
            >
              <FaUserTie size={14} />
              Gestionar Empleados ({stats.empleados})
            </button>
            <button 
              onClick={() => navigateTo('/private/users')}
              className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3"
            >
              <FaCog size={14} />
              Gestionar Especialistas ({stats.especialistas})
            </button>
          </div>
        </div>

        {/* Gestión Financiera */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaFileInvoiceDollar className="text-green-600" size={20} />
            <h3 className="text-lg font-semibold">Gestión Financiera</h3>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => navigateTo('/private/reports')}
              className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3"
            >
              <FaFileInvoiceDollar size={14} />
              Facturas Pendientes ({stats.facturasPendientes})
            </button>
            <button 
              onClick={() => navigateTo('/private/inventory')}
              className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3"
            >
              <FaTruck size={14} />
              Pagos a Proveedores ({stats.pagosProveedores})
            </button>
            <button 
              onClick={() => navigateTo('/private/reports')}
              className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3"
            >
              <FaChartBar size={14} />
              Historial de Facturación
            </button>
          </div>
        </div>
      </div>

      {/* Trabajos Activos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Trabajos en Tiempo Real</h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              En Progreso: {loading ? '...' : stats.trabajosEnProgreso}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Finalizados: {loading ? '...' : stats.trabajosFinalizados}
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              Cancelados: {loading ? '...' : stats.trabajosCancelados}
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            <p className="ml-3 text-gray-600">Cargando trabajos...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {getActiveWorkOrders().length > 0 ? (
              getActiveWorkOrders().map((workOrder) => (
                <div key={workOrder.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {getMaintenanceTypeDisplayName(workOrder.maintenanceType)} - {workOrder.make} {workOrder.model} {workOrder.modelYear}
                      </p>
                      <p className="text-sm text-gray-600">
                        Cliente: {workOrder.customer} | Placa: {workOrder.plate}
                      </p>
                      <p className="text-sm text-gray-600">
                        {workOrder.description || 'Sin descripción específica'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(workOrder.status)}`}>
                        {getStatusDisplayName(workOrder.status)}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        Inicio: {new Date(workOrder.openedAt).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaTools className="mx-auto mb-2 text-gray-400" size={24} />
                <p>No hay trabajos activos en este momento</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-center">
          <button 
            onClick={() => navigateTo('/private/work-orders')}
            className="text-[var(--color-primary)] hover:underline"
          >
            Ver todos los trabajos activos
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--color-light)] border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigateTo('/private/work-orders')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <FaTools className="mx-auto mb-2 text-[var(--color-primary)]" size={20} />
            <p className="text-sm font-medium">Crear Trabajo</p>
          </button>
          
          <button 
            onClick={() => navigateTo('/private/inventory')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <FaBoxes className="mx-auto mb-2 text-[var(--color-accent)]" size={20} />
            <p className="text-sm font-medium">Autorizar Compra</p>
          </button>
          
          <button 
            onClick={() => navigateTo('/private/reports')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <FaFileInvoiceDollar className="mx-auto mb-2 text-green-600" size={20} />
            <p className="text-sm font-medium">Emitir Factura</p>
          </button>
          
          <button 
            onClick={() => navigateTo('/private/reports')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <FaChartBar className="mx-auto mb-2 text-blue-600" size={20} />
            <p className="text-sm font-medium">Generar Reporte</p>
          </button>
        </div>
      </div>
    </div>
  )
}