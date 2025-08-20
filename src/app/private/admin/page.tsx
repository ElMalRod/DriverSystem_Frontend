"use client"

import { useEffect, useState } from "react"
import { getSessionUser } from "@/utils/session"
import type { User } from "@/types/auth"
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

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({
    vehiculosActivos: 24,
    trabajosEnProgreso: 12,
    trabajosFinalizados: 156,
    trabajosCancelados: 3,
    clientesTotal: 89,
    empleados: 8,
    especialistas: 5,
    inventarioTotal: 340,
    facturasPendientes: 15,
    pagosProveedores: 8
  })

  useEffect(() => {
    setUser(getSessionUser())
  }, [])

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
          <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2">
            <FaPlus size={14} />
            Nuevo Vehículo
          </button>
          <button className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2">
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
            <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3">
              <FaPlus size={14} />
              Registrar Nuevo Vehículo
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3">
              <FaEye size={14} />
              Ver Todos los Vehículos
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3">
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
            <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3">
              <FaPlus size={14} />
              Registrar Cliente
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3">
              <FaUserTie size={14} />
              Gestionar Empleados ({stats.empleados})
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3">
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
            <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3">
              <FaFileInvoiceDollar size={14} />
              Facturas Pendientes ({stats.facturasPendientes})
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3">
              <FaTruck size={14} />
              Pagos a Proveedores ({stats.pagosProveedores})
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3">
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
              En Progreso: {stats.trabajosEnProgreso}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Finalizados: {stats.trabajosFinalizados}
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              Cancelados: {stats.trabajosCancelados}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mantenimiento Correctivo - Honda Civic 2019</p>
                <p className="text-sm text-gray-600">Asignado a: Juan Pérez | Cliente: María González</p>
                <p className="text-sm text-gray-600">Problema: Falla en sistema eléctrico</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">En Progreso</span>
                <p className="text-sm text-gray-600 mt-1">Inicio: 10:30 AM</p>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mantenimiento Preventivo - Toyota Corolla 2020</p>
                <p className="text-sm text-gray-600">Asignado a: Carlos Ruiz | Cliente: Roberto Silva</p>
                <p className="text-sm text-gray-600">Servicio: Revisión general programada</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Evaluación</span>
                <p className="text-sm text-gray-600 mt-1">Inicio: 11:15 AM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button className="text-[var(--color-primary)] hover:underline">
            Ver todos los trabajos activos
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--color-light)] border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <FaTools className="mx-auto mb-2 text-[var(--color-primary)]" size={20} />
            <p className="text-sm font-medium">Crear Trabajo</p>
          </button>
          
          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <FaBoxes className="mx-auto mb-2 text-[var(--color-accent)]" size={20} />
            <p className="text-sm font-medium">Autorizar Compra</p>
          </button>
          
          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <FaFileInvoiceDollar className="mx-auto mb-2 text-green-600" size={20} />
            <p className="text-sm font-medium">Emitir Factura</p>
          </button>
          
          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <FaChartBar className="mx-auto mb-2 text-blue-600" size={20} />
            <p className="text-sm font-medium">Generar Reporte</p>
          </button>
        </div>
      </div>
    </div>
  )
}