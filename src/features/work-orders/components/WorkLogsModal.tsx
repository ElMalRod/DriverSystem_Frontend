"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  FaTimes, 
  FaClipboardList,
  FaSpinner,
  FaSave,
  FaPlus,
  FaClock,
  FaUser,
  FaCalendarAlt,
  FaFileAlt,
  FaTools,
  FaExclamationTriangle,
  FaComments,
  FaChartLine
} from "react-icons/fa"
import { 
  getWorkLogsByOrder,
  createWorkLog,
  WorkLog,
  WorkLogCreateRequest,
  WorkOrder
} from "../api"
import { getUsers, User } from "@/features/users/api"

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

interface WorkLogsModalProps {
  isOpen: boolean
  onClose: () => void
  workOrder: WorkOrder | null
  onLogCreated?: (log: WorkLog) => void
}

const LOG_TYPES = [
  { value: 'NOTE', label: 'Nota', icon: FaFileAlt, color: 'bg-blue-100 text-blue-800 border-blue-200', description: 'Nota general sobre el trabajo' },
  { value: 'DIAGNOSIS', label: 'Diagnóstico', icon: FaTools, color: 'bg-purple-100 text-purple-800 border-purple-200', description: 'Diagnóstico técnico del problema' },
  { value: 'PROGRESS', label: 'Progreso', icon: FaChartLine, color: 'bg-green-100 text-green-800 border-green-200', description: 'Actualización de progreso del trabajo' },
  { value: 'ISSUE', label: 'Problema', icon: FaExclamationTriangle, color: 'bg-red-100 text-red-800 border-red-200', description: 'Problema o inconveniente encontrado' },
  { value: 'CUSTOMER_NOTE', label: 'Nota del Cliente', icon: FaComments, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', description: 'Comentario o solicitud del cliente' }
] as const

export default function WorkLogsModal({ 
  isOpen, 
  onClose, 
  workOrder,
  onLogCreated 
}: WorkLogsModalProps) {
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [formData, setFormData] = useState<{
    logType: WorkLog['logType'] | ''
    note: string
    hours: string
  }>({
    logType: '',
    note: '',
    hours: ''
  })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && workOrder) {
      loadLogs()
      loadUsers()
    }
  }, [isOpen, workOrder])

  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false)
      setFormData({ logType: '', note: '', hours: '' })
    }
  }, [isOpen])

  const loadLogs = async () => {
    if (!workOrder) return
    
    try {
      setLoading(true)
      const data = await getWorkLogsByOrder(workOrder.id)
      setLogs(data)
    } catch (error) {
      console.error('Error loading work logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const allUsers = await getUsers()
      setUsers(allUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const getUserName = (autorId: number) => {
    const user = users.find(u => u.id === autorId)
    return user ? user.name : `Usuario ${autorId}`
  }

  const getLogTypeConfig = (logType: WorkLog['logType']) => {
    return LOG_TYPES.find(type => type.value === logType) || LOG_TYPES[0]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!formData.logType) {
      errors.push("El tipo de log es requerido")
    }

    if (!formData.note.trim()) {
      errors.push("La nota es requerida")
    }

    if (formData.hours && isNaN(Number(formData.hours))) {
      errors.push("Las horas deben ser un número válido")
    }

    if (formData.hours && Number(formData.hours) < 0) {
      errors.push("Las horas no pueden ser negativas")
    }

    if (formData.hours && Number(formData.hours) > 24) {
      errors.push("Las horas no pueden ser mayores a 24")
    }

    return errors
  }

  const handleCreateLog = async () => {
    if (!workOrder) return

    const errors = validateForm()
    if (errors.length > 0) {
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error de Validación',
          html: errors.map(error => `• ${error}`).join('<br>'),
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
      return
    }

    try {
      setCreating(true)

      const logData: WorkLogCreateRequest = {
        workOrderId: workOrder.id,
        autorId: 1, // TODO: Get from auth context
        logType: formData.logType as WorkLog['logType'],
        note: formData.note.trim(),
        hours: formData.hours && Number(formData.hours) > 0 ? Number(formData.hours) : 0
      }

      const newLog = await createWorkLog(logData)
      
      setLogs(prev => [newLog, ...prev])

      setFormData({ logType: '', note: '', hours: '' })
      setShowCreateForm(false)

      if (window.Swal) {
        window.Swal.fire({
          title: 'Log Creado',
          text: 'El log de trabajo se creó exitosamente',
          icon: 'success',
          timer: 2000,
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

      if (onLogCreated) {
        onLogCreated(newLog)
      }
    } catch (error) {
      console.error('Error creating work log:', error)
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el log de trabajo',
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
      setCreating(false)
    }
  }

  const totalHours = logs.reduce((sum, log) => sum + (log.hours || 0), 0)

  if (!isOpen || !mounted || !workOrder) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4" 
      style={{ zIndex: 9999 }}
      data-modal="work-logs"
    >
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      ></div>
      
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <FaClipboardList className="text-2xl text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Logs de Trabajo
              </h2>
              <p className="text-sm text-gray-600">
                Orden: {workOrder.code} | Total horas: {totalHours.toFixed(2)}h
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <FaPlus />
              Nuevo Log
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-6 bg-white">
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Crear Nuevo Log</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Log *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {LOG_TYPES.map((type) => (
                      <div
                        key={type.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.logType === type.value
                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleInputChange('logType', type.value)}
                      >
                        <div className="flex items-center gap-2">
                          <type.icon className="text-gray-600" />
                          <span className="font-medium text-sm">{type.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nota *
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    placeholder="Describe el trabajo realizado, problema encontrado, etc..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows={3}
                    maxLength={1000}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.note.length}/1000 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas Trabajadas
                  </label>
                  <input
                    type="number"
                    value={formData.hours}
                    onChange={(e) => handleInputChange('hours', e.target.value)}
                    placeholder="Ej: 1.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    max="24"
                    step="0.25"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tiempo trabajado en horas (opcional)
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateLog}
                    disabled={creating || !formData.logType || !formData.note.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Crear Log
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Historial de Logs ({logs.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-indigo-600 mr-2 text-2xl" />
                <span className="text-gray-600">Cargando logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaClipboardList className="text-4xl text-gray-300 mx-auto mb-4" />
                <p>No hay logs de trabajo para esta orden</p>
                <p className="text-sm">Crea el primer log para comenzar el seguimiento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => {
                  const typeConfig = getLogTypeConfig(log.logType)
                  const IconComponent = typeConfig.icon
                  
                  return (
                    <div key={log.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeConfig.color} flex items-center gap-1`}>
                            <IconComponent />
                            {typeConfig.label}
                          </span>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaUser />
                            {getUserName(log.autorId)}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt />
                            {formatDate(log.logCreatedAt)}
                          </div>
                          {log.hours > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <FaClock />
                              {log.hours}h
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{log.note}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

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

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}
