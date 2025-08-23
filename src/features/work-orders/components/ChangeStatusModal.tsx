"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  FaTimes, 
  FaExchangeAlt,
  FaSpinner,
  FaSave,
  FaInfoCircle,
  FaCheck
} from "react-icons/fa"
import { 
  WorkOrder,
  updateWorkOrderStatus
} from "../api"

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

interface ChangeStatusModalProps {
  isOpen: boolean
  onClose: () => void
  workOrder: WorkOrder | null
  onStatusChanged?: (workOrder: WorkOrder) => void
}

const STATUS_OPTIONS = [
  { value: 1, label: 'Created', color: 'bg-blue-100 text-blue-800', description: 'Orden creada, pendiente de asignación' },
  { value: 2, label: 'Assigned', color: 'bg-yellow-100 text-yellow-800', description: 'Orden asignada a empleados' },
  { value: 3, label: 'In Progress', color: 'bg-orange-100 text-orange-800', description: 'Trabajo en progreso' },
  { value: 4, label: 'On Hold', color: 'bg-gray-100 text-gray-800', description: 'Trabajo pausado temporalmente' },
  { value: 5, label: 'Completed', color: 'bg-green-100 text-green-800', description: 'Trabajo completado' },
  { value: 6, label: 'Cancelled', color: 'bg-red-100 text-red-800', description: 'Orden cancelada' },
  { value: 7, label: 'Closed', color: 'bg-purple-100 text-purple-800', description: 'Orden cerrada y finalizada' },
  { value: 8, label: 'No Authorized', color: 'bg-pink-100 text-pink-800', description: 'No autorizada por el cliente' }
]

export default function ChangeStatusModal({ 
  isOpen, 
  onClose, 
  workOrder,
  onStatusChanged 
}: ChangeStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted (for portal)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && workOrder) {
      // Set current status as default
      const currentStatusOption = STATUS_OPTIONS.find(opt => opt.label === workOrder.status)
      setSelectedStatus(currentStatusOption?.value || null)
      setComment("")
    } else if (!isOpen) {
      setSelectedStatus(null)
      setComment("")
    }
  }, [isOpen, workOrder])

  const getCurrentStatusOption = () => {
    if (!workOrder) return null
    return STATUS_OPTIONS.find(opt => opt.label === workOrder.status)
  }

  const getSelectedStatusOption = () => {
    return STATUS_OPTIONS.find(opt => opt.value === selectedStatus)
  }

  const handleStatusChange = async () => {
    if (!workOrder || !selectedStatus) return

    const selectedOption = getSelectedStatusOption()
    if (!selectedOption) return

    // Check if status actually changed
    const currentOption = getCurrentStatusOption()
    if (currentOption?.value === selectedStatus) {
      if (window.Swal) {
        window.Swal.fire({
          title: 'Sin Cambios',
          text: 'El estado seleccionado es el mismo que el actual',
          icon: 'info',
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
      setLoading(true)
      
      // Call API to update status
      await updateWorkOrderStatus(workOrder.id, selectedStatus, comment)
      
      // Update local work order object
      const updatedWorkOrder: WorkOrder = {
        ...workOrder,
        status: selectedOption.label
      }

      // Show success message
      if (window.Swal) {
        window.Swal.fire({
          title: 'Estado Actualizado',
          text: `El estado se cambió a "${selectedOption.label}" exitosamente`,
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

      // Notify parent component
      if (onStatusChanged) {
        onStatusChanged(updatedWorkOrder)
      }

      // Close modal
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el estado de la orden',
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

  if (!isOpen || !mounted || !workOrder) return null

  const currentStatusOption = getCurrentStatusOption()
  const selectedStatusOption = getSelectedStatusOption()

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4" 
      style={{ zIndex: 9999 }}
      data-modal="change-status"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <FaExchangeAlt className="text-2xl text-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Cambiar Estado
              </h2>
              <p className="text-sm text-gray-600">Orden: {workOrder.code}</p>
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
          {/* Current Status */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Estado Actual:</h3>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-2 rounded-full text-sm font-medium border ${currentStatusOption?.color || 'bg-gray-100 text-gray-800'}`}>
                {workOrder.status}
              </span>
              <span className="text-sm text-gray-600">
                {currentStatusOption?.description}
              </span>
            </div>
          </div>

          {/* New Status Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Nuevo Estado:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STATUS_OPTIONS.map((status) => (
                <div
                  key={status.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedStatus === status.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedStatus(status.value)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {selectedStatus === status.value && (
                      <FaCheck className="text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{status.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario (Opcional):
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Agregar comentario sobre el cambio de estado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Status Change Preview */}
          {selectedStatusOption && currentStatusOption?.value !== selectedStatus && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <FaInfoCircle className="text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">Vista Previa del Cambio</h4>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatusOption?.color}`}>
                  {currentStatusOption?.label}
                </span>
                <FaExchangeAlt className="text-gray-400" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedStatusOption.color}`}>
                  {selectedStatusOption.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleStatusChange}
            disabled={loading || !selectedStatus || (currentStatusOption?.value === selectedStatus)}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <FaSave />
                Cambiar Estado
              </>
            )}
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
