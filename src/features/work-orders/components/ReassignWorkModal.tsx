"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  FaTimes, 
  FaExchangeAlt,
  FaUser,
  FaSpinner,
  FaSave
} from "react-icons/fa"
import { 
  reassignWorkOrder,
  getAvailableEmployees,
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

interface ReassignWorkModalProps {
  isOpen: boolean
  onClose: () => void
  workOrder: WorkOrder | null
  currentAssignment: WorkAssignment | null
  onReassigned?: () => void
}

export default function ReassignWorkModal({ 
  isOpen, 
  onClose, 
  workOrder,
  currentAssignment,
  onReassigned 
}: ReassignWorkModalProps) {
  const [employees, setEmployees] = useState<User[]>([])
  const [availableEmployees, setAvailableEmployees] = useState<number[]>([])
  const [employeeWorkload, setEmployeeWorkload] = useState<{ [employeeId: number]: number }>({})
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(0)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadEmployees()
      loadAvailableEmployees()
      setSelectedEmployeeId(0)
      setReason("")
    }
  }, [isOpen])

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
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableEmployees = async () => {
    try {
      const { availableEmployees, employeeWorkload } = await getAvailableEmployees()
      setAvailableEmployees(availableEmployees)
      setEmployeeWorkload(employeeWorkload)
    } catch (error) {
      console.error('Error loading available employees:', error)
    }
  }

  const getEmployeeName = (employeeId: number): string => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.name : `Empleado #${employeeId}`
  }

  const getCurrentEmployeeName = (): string => {
    if (!currentAssignment) return "No asignado"
    return getEmployeeName(currentAssignment.assigneeId)
  }

  const getWorkloadBadge = (employeeId: number) => {
    const workload = employeeWorkload[employeeId] || 0
    if (workload === 0) {
      return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Disponible</span>
    } else if (workload === 1) {
      return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">1 trabajo</span>
    } else {
      return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{workload} trabajos</span>
    }
  }

  const handleReassign = async () => {
    if (!workOrder || !currentAssignment || !selectedEmployeeId) {
      if (window.Swal) {
        window.Swal.fire({
          title: 'Datos incompletos',
          text: 'Debes seleccionar un empleado para reasignar el trabajo',
          icon: 'warning',
          customClass: {
            container: 'swal-high-zindex'
          }
        })
      }
      return
    }

    if (!reason.trim()) {
      if (window.Swal) {
        window.Swal.fire({
          title: 'Razón requerida',
          text: 'Debes proporcionar una razón para la reasignación',
          icon: 'warning',
          customClass: {
            container: 'swal-high-zindex'
          }
        })
      }
      return
    }

    try {
      setSaving(true)

      await reassignWorkOrder(
        workOrder.id, 
        currentAssignment.assigneeId, 
        selectedEmployeeId, 
        reason
      )

      if (window.Swal) {
        window.Swal.fire({
          title: '¡Trabajo Reasignado!',
          html: `
            <div class="text-left">
              <p><strong>De:</strong> ${getCurrentEmployeeName()}</p>
              <p><strong>Para:</strong> ${getEmployeeName(selectedEmployeeId)}</p>
              <p><strong>Razón:</strong> ${reason}</p>
            </div>
          `,
          icon: 'success',
          timer: 4000,
          showConfirmButton: false,
          customClass: {
            container: 'swal-high-zindex'
          }
        })
      }

      if (onReassigned) {
        onReassigned()
      }

      onClose()
    } catch (error) {
      console.error('Error reassigning work:', error)
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'No se pudo reasignar el trabajo. Inténtalo de nuevo.',
          icon: 'error',
          customClass: {
            container: 'swal-high-zindex'
          }
        })
      }
    } finally {
      setSaving(false)
    }
  }

  if (!mounted || !isOpen || !workOrder || !currentAssignment) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <FaExchangeAlt className="text-blue-500" />
            Reasignar Trabajo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Asignación Actual</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Orden:</span>
              <p className="font-mono">{workOrder.code}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Empleado Actual:</span>
              <p className="flex items-center gap-2">
                <FaUser className="text-blue-500" />
                {getCurrentEmployeeName()}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reasignar a *
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            disabled={loading || saving}
          >
            <option value={0}>Seleccionar empleado...</option>
            {employees
              .filter(emp => emp.id !== currentAssignment.assigneeId) 
              .map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - ID: {employee.id}
                </option>
              ))}
          </select>
          
          {selectedEmployeeId > 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {getEmployeeName(selectedEmployeeId)}
              </span>
              {getWorkloadBadge(selectedEmployeeId)}
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Razón para la reasignación *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Empleado anterior no disponible, especialización requerida, etc."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
            disabled={saving}
          />
        </div>

        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Estado de Empleados</h4>
          <div className="text-sm text-green-700">
            <p>• Empleados disponibles: {availableEmployees.length}</p>
            <p>• Empleados ocupados: {Object.keys(employeeWorkload).length}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleReassign}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={saving || !selectedEmployeeId || !reason.trim()}
          >
            {saving ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSave />
            )}
            Reasignar Trabajo
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
