"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  FaTimes, 
  FaUser, 
  FaPlus, 
  FaTrash, 
  FaCalendarAlt, 
  FaUserTie,
  FaSpinner,
  FaSave
} from "react-icons/fa"
import { 
  createWorkAssignment, 
  deleteWorkAssignment,
  getWorkAssignmentsByOrder,
  checkEmployeeAvailability,
  updateWorkOrderStatus,
  WorkAssignment,
  WorkAssignmentCreateRequest
} from "../api"
import { getUsers, User } from "@/features/users/api"

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

interface AssignEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  workOrder: {
    id: number
    code: string
    description?: string
    customer: string
    plate: string
    make: string
    model: string
  }
  onAssignmentUpdated?: () => void
}

export default function AssignEmployeeModal({ 
  isOpen, 
  onClose, 
  workOrder,
  onAssignmentUpdated 
}: AssignEmployeeModalProps) {
  const [employees, setEmployees] = useState<User[]>([])
  const [currentAssignments, setCurrentAssignments] = useState<WorkAssignment[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadEmployees()
      loadCurrentAssignments()
    }
  }, [isOpen, workOrder.id])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const allUsers = await getUsers()
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
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'Error al cargar la lista de empleados',
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

  const loadCurrentAssignments = async () => {
    try {
      setAssignmentsLoading(true)
      const assignments = await getWorkAssignmentsByOrder(workOrder.id)
      setCurrentAssignments(assignments)
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setAssignmentsLoading(false)
    }
  }

  const handleAssignEmployee = async () => {
    if (!selectedEmployeeId || selectedEmployeeId === 0) {
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar un empleado',
          icon: 'warning',
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
      return
    }

    const alreadyAssigned = currentAssignments.some(
      assignment => assignment.assigneeId === selectedEmployeeId && !assignment.releasedAt
    )

    if (alreadyAssigned) {
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'Este empleado ya está asignado a esta orden de trabajo',
          icon: 'warning',
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
      return
    }

    try {
      setSaving(true)
      
      const availability = await checkEmployeeAvailability(selectedEmployeeId)
      
      if (!availability.isAvailable) {
        const employeeName = getEmployeeName(selectedEmployeeId)
        if (window.Swal) {
          const result = await window.Swal.fire({
            title: 'Empleado No Disponible',
            html: `
              <div class="text-left">
                <p><strong>${employeeName}</strong> está actualmente asignado a:</p>
                <ul class="list-disc list-inside mt-2 text-sm">
                  ${availability.activeWorkOrders.map(code => `<li>${code}</li>`).join('')}
                </ul>
                <br>
                <p class="text-sm text-gray-600">¿Deseas asignarlo de todas formas? Esto podría sobrecargar al empleado.</p>
              </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Asignar de todas formas',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280',
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
          
          if (!result.isConfirmed) {
            setSaving(false)
            return
          }
        }
      }

      const assignmentData: WorkAssignmentCreateRequest = {
        workOrderId: workOrder.id,
        assigneeId: selectedEmployeeId,
        role: 2, //empleado
        assignedAt: new Date().toISOString()
      }

      await createWorkAssignment(assignmentData)

      // 🎯 AUTO-ASSIGN STATUS: Automatically change status to "Assigned" when employee is assigned
      try {
        console.log('🔄 Auto-changing status to Assigned after employee assignment')
        await updateWorkOrderStatus(workOrder.id, 2) // 2 = "Assigned"
        console.log('Status automatically changed to Assigned')
      } catch (statusError) {
        console.warn('Assignment successful but failed to update status:', statusError)
        // Don't fail the whole operation if status update fails
      }

      if (window.Swal) {
        window.Swal.fire({
          title: '¡Éxito!',
          text: 'Empleado asignado correctamente y estado actualizado a "Assigned"',
          icon: 'success',
          timer: 4000, 
          showConfirmButton: false,
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

      await loadCurrentAssignments()
      
      setSelectedEmployeeId(0)

      if (onAssignmentUpdated) {
        onAssignmentUpdated()
      }

    } catch (error) {
      console.error('Error assigning employee:', error)
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'Error al asignar el empleado. La asignación se guardó pero hubo un problema con la respuesta del servidor.',
          icon: 'warning',
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
      
      try {
        await loadCurrentAssignments()
        setSelectedEmployeeId(0)
        if (onAssignmentUpdated) {
          onAssignmentUpdated()
        }
      } catch (reloadError) {
        console.error('Error reloading assignments:', reloadError)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: number, employeeName: string) => {
    const result = await window.Swal?.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas remover a ${employeeName} de esta orden de trabajo?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, remover',
      cancelButtonText: 'Cancelar',
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

    if (result?.isConfirmed) {
      try {
        setSaving(true)
        await deleteWorkAssignment(assignmentId)
        await loadCurrentAssignments()

        if (window.Swal) {
          window.Swal.fire({
            title: '¡Removido!',
            text: 'El empleado ha sido removido de la orden',
            icon: 'success',
            timer: 3000, 
            showConfirmButton: false,
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

        if (onAssignmentUpdated) {
          onAssignmentUpdated()
        }

      } catch (error) {
        console.error('Error removing assignment:', error)
        if (window.Swal) {
          window.Swal.fire({
            title: 'Error',
            text: 'Error al remover la asignación',
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
        setSaving(false)
      }
    }
  }

  const getEmployeeName = (assigneeId: number) => {
    const employee = employees.find(emp => emp.id === assigneeId)
    return employee ? employee.name : `Empleado ID: ${assigneeId}`
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

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4" 
      style={{ zIndex: 9999 }}
      data-modal="assign-employee"
    >
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      ></div>
      
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <FaUserTie className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Asignar Empleados</h2>
              <p className="text-sm text-gray-600">Orden: {workOrder.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={saving}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Cliente:</span>
              <span className="ml-2 text-gray-600">{workOrder.customer}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Vehículo:</span>
              <span className="ml-2 text-gray-600">{workOrder.make} {workOrder.model} - {workOrder.plate}</span>
            </div>
            {workOrder.description && (
              <div className="md:col-span-2">
                <span className="font-semibold text-gray-700">Descripción:</span>
                <span className="ml-2 text-gray-600">{workOrder.description}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaPlus className="text-green-600" />
              Asignar Nuevo Empleado
            </h3>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Empleado
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || saving}
                >
                  <option value={0}>Seleccione un empleado...</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAssignEmployee}
                disabled={loading || saving || selectedEmployeeId === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Asignar
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-4">
                <FaSpinner className="animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Cargando empleados...</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUser className="text-blue-600" />
              Empleados Asignados ({currentAssignments.filter(a => !a.releasedAt).length})
            </h3>

            {assignmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Cargando asignaciones...</span>
              </div>
            ) : currentAssignments.filter(assignment => !assignment.releasedAt).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaUser className="text-4xl text-gray-300 mx-auto mb-2" />
                <p>No hay empleados asignados a esta orden</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentAssignments
                  .filter(assignment => !assignment.releasedAt)
                  .map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {getEmployeeName(assignment.assigneeId)}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <FaCalendarAlt />
                              Asignado: {formatDate(assignment.assignedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveAssignment(assignment.id, getEmployeeName(assignment.assigneeId))}
                        disabled={saving}
                        className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 disabled:opacity-50"
                        title="Remover empleado"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}
