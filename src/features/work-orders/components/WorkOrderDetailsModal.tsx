"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  FaTimes, 
  FaUser, 
  FaCar,
  FaCalendarAlt, 
  FaClock,
  FaTools,
  FaClipboardList,
  FaEdit,
  FaUserTie,
  FaSpinner,
  FaExchangeAlt,
  FaIdCard,
  FaPhone,
  FaFileAlt,
  FaHistory
} from "react-icons/fa"
import { 
  getWorkOrderWithDetails,
  getWorkAssignmentsByOrder,
  WorkOrder,
  WorkAssignment
} from "../api"
import { getUsers, User } from "@/features/users/api"

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

interface WorkOrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  workOrderId: number | null
  onEdit?: (workOrder: WorkOrder) => void
  onAssign?: (workOrder: WorkOrder) => void
  onStatusChange?: (workOrder: WorkOrder) => void
  onViewLogs?: (workOrder: WorkOrder) => void
}

export default function WorkOrderDetailsModal({ 
  isOpen, 
  onClose, 
  workOrderId,
  onEdit,
  onAssign,
  onStatusChange,
  onViewLogs 
}: WorkOrderDetailsModalProps) {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [assignments, setAssignments] = useState<WorkAssignment[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted (for portal)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && workOrderId) {
      loadWorkOrderDetails()
      loadAssignments()
      loadEmployees()
    }
  }, [isOpen, workOrderId])

  const loadWorkOrderDetails = async () => {
    if (!workOrderId) return
    
    try {
      setLoading(true)
      const data = await getWorkOrderWithDetails(workOrderId)
      setWorkOrder(data)
    } catch (error) {
      console.error('Error loading work order details:', error)
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'Error al cargar los detalles de la orden',
          icon: 'error',
          customClass: {
            container: 'swal-high-zindex'
          },
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container')
            if (swalContainer) {
              (swalContainer as HTMLElement).style.zIndex = '99999'
            }
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    if (!workOrderId) return
    
    try {
      setAssignmentsLoading(true)
      const data = await getWorkAssignmentsByOrder(workOrderId)
      setAssignments(data.filter(a => !a.releasedAt))
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setAssignmentsLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const allUsers = await getUsers()
      // Filter only employees
      const employeeUsers = allUsers.filter(user => 
        user.roleName === 'EMPLOYEE' || 
        user.roleName === 'Employee' ||
        user.roleName?.toLowerCase().includes('employee') ||
        user.roleName?.toLowerCase().includes('empleado') ||
        user.roleName?.toLowerCase().includes('mecanic')
      )
      setEmployees(employeeUsers)
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const getEmployeeName = (assigneeId: number) => {
    const employee = employees.find(emp => emp.id === assigneeId)
    return employee ? employee.name : `Empleado ID: ${assigneeId}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Created': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'In Progress': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'On Hold': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'Closed': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'No Authorized': return 'bg-pink-100 text-pink-800 border-pink-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Corrective': return 'bg-red-50 text-red-700 border border-red-200'
      case 'Preventive': return 'bg-blue-50 text-blue-700 border border-blue-200'
      default: return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEdit = () => {
    if (workOrder && onEdit) {
      onEdit(workOrder)
    }
  }

  const handleAssign = () => {
    if (workOrder && onAssign) {
      onAssign(workOrder)
    }
  }

  const handleStatusChange = () => {
    if (workOrder && onStatusChange) {
      onStatusChange(workOrder)
    }
  }

  const handleViewLogs = () => {
    if (workOrder && onViewLogs) {
      onViewLogs(workOrder)
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4" 
      style={{ zIndex: 9999 }}
      data-modal="work-order-details"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <FaClipboardList className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {workOrder ? `Detalles de ${workOrder.code}` : 'Cargando...'}
              </h2>
              <p className="text-sm text-gray-600">Información completa de la orden de trabajo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-blue-600 mr-2 text-2xl" />
              <span className="text-gray-600">Cargando detalles de la orden...</span>
            </div>
          ) : workOrder ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Work Order Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaClipboardList className="text-blue-600" />
                      Información de la Orden
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Estado:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(workOrder.status)}`}>
                          {workOrder.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Tipo:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(workOrder.maintenanceType)}`}>
                          <FaTools className="inline mr-1" />
                          {workOrder.maintenanceType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Horas Estimadas:</span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <FaClock />
                          {workOrder.estimatedHours ? `${workOrder.estimatedHours}h` : 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Fecha Apertura:</span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <FaCalendarAlt />
                          {formatDate(workOrder.openedAt)}
                        </span>
                      </div>

                      {workOrder.closedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Fecha Cierre:</span>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <FaCalendarAlt />
                            {formatDate(workOrder.closedAt)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Creado por:</span>
                        <span className="text-sm text-gray-600">{workOrder.createdBy}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {workOrder.description && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaFileAlt className="text-gray-500" />
                        Descripción
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{workOrder.description}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Customer & Vehicle */}
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaUser className="text-green-600" />
                      Información del Cliente
                    </h3>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Nombre:</span>
                        <p className="text-sm text-gray-600">{workOrder.customer}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <FaIdCard />
                          Documento:
                        </span>
                        <p className="text-sm text-gray-600">{workOrder.docNumberCustomer}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <FaPhone />
                          Teléfono:
                        </span>
                        <p className="text-sm text-gray-600">{workOrder.phoneCustomer}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaCar className="text-orange-600" />
                      Información del Vehículo
                    </h3>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Placa:</span>
                        <p className="text-sm text-gray-600 font-mono">{workOrder.plate}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Vehículo:</span>
                        <p className="text-sm text-gray-600">{workOrder.make} {workOrder.model}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Año:</span>
                          <p className="text-sm text-gray-600">{workOrder.modelYear}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Color:</span>
                          <p className="text-sm text-gray-600">{workOrder.color}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">VIN:</span>
                        <p className="text-sm text-gray-600 font-mono">{workOrder.vin}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Employees */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUserTie className="text-purple-600" />
                  Empleados Asignados ({assignments.length})
                </h3>

                {assignmentsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <FaSpinner className="animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Cargando asignaciones...</span>
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <FaUserTie className="text-4xl text-gray-300 mx-auto mb-2" />
                    <p>No hay empleados asignados a esta orden</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaUser className="text-blue-600 text-sm" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 text-sm">
                              {getEmployeeName(assignment.assigneeId)}
                            </h4>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <FaCalendarAlt />
                              Asignado: {formatDate(assignment.assignedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <FaEdit />
                  Editar Orden
                </button>

                <button
                  onClick={handleAssign}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FaUserTie />
                  Asignar Empleados
                </button>

                <button
                  onClick={handleStatusChange}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <FaExchangeAlt />
                  Cambiar Estado
                </button>

                <button
                  onClick={handleViewLogs}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <FaHistory />
                  Ver Logs
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FaClipboardList className="text-4xl text-gray-300 mx-auto mb-4" />
              <p>No se pudo cargar la información de la orden</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )

  // Use portal to render modal at document body level
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}
