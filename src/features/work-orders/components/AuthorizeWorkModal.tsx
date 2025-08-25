"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  FaTimes, 
  FaExclamationTriangle,
  FaCheck,
  FaBan,
  FaSpinner
} from "react-icons/fa"
import { 
  updateWorkOrderStatus,
  WorkOrder
} from "../api"

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

interface AuthorizeWorkModal {
  isOpen: boolean
  onClose: () => void
  workOrder: WorkOrder | null
  onStatusChanged?: (workOrder: WorkOrder) => void
}

export default function AuthorizeWorkModal({ 
  isOpen, 
  onClose, 
  workOrder,
  onStatusChanged 
}: AuthorizeWorkModal) {
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setComment("")
      setLoading(false)
    }
  }, [isOpen])

  const handleAuthorize = async () => {
    if (!workOrder) return
    
    try {
      setLoading(true)
      
      await updateWorkOrderStatus(workOrder.id, 2, comment || "Trabajo autorizado por el cliente")
      
      const updatedWorkOrder: WorkOrder = {
        ...workOrder,
        status: "Assigned"
      }

      if (window.Swal) {
        window.Swal.fire({
          title: 'Trabajo Autorizado',
          text: 'El trabajo ha sido autorizado y asignado correctamente',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            container: 'swal-high-zindex'
          }
        })
      }

      if (onStatusChanged) {
        onStatusChanged(updatedWorkOrder)
      }

      onClose()
    } catch (error) {
      console.error('Error authorizing work:', error)
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'No se pudo autorizar el trabajo. Inténtalo de nuevo.',
          icon: 'error',
          customClass: {
            container: 'swal-high-zindex'
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!workOrder) return
    
    if (!comment.trim()) {
      if (window.Swal) {
        window.Swal.fire({
          title: 'Comentario Requerido',
          text: 'Debes proporcionar una razón para rechazar el trabajo',
          icon: 'warning',
          customClass: {
            container: 'swal-high-zindex'
          }
        })
      }
      return
    }
    
    try {
      setLoading(true)
      
      await updateWorkOrderStatus(workOrder.id, 6, `Cliente rechazó el trabajo: ${comment}`)
      
      const updatedWorkOrder: WorkOrder = {
        ...workOrder,
        status: "Cancelled"
      }

      if (window.Swal) {
        window.Swal.fire({
          title: 'Trabajo Rechazado',
          text: 'El trabajo ha sido rechazado y cancelado',
          icon: 'info',
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            container: 'swal-high-zindex'
          }
        })
      }

      if (onStatusChanged) {
        onStatusChanged(updatedWorkOrder)
      }

      onClose()
    } catch (error) {
      console.error('Error rejecting work:', error)
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'No se pudo rechazar el trabajo. Inténtalo de nuevo.',
          icon: 'error',
          customClass: {
            container: 'swal-high-zindex'
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || !isOpen || !workOrder) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <FaExclamationTriangle className="text-orange-500" />
            Autorización de Trabajo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Información del Trabajo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Orden:</span>
              <p className="font-mono">{workOrder.code}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Cliente:</span>
              <p>{workOrder.customer}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Vehículo:</span>
              <p>{workOrder.plate} - {workOrder.make} {workOrder.model}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Tipo:</span>
              <p>{workOrder.maintenanceType}</p>
            </div>
          </div>
          {workOrder.description && (
            <div className="mt-3">
              <span className="font-medium text-gray-600">Descripción:</span>
              <p className="text-gray-700 bg-white p-2 rounded border mt-1">
                {workOrder.description}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-orange-500 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-orange-800">Esperando Autorización del Cliente</h4>
              <p className="text-orange-700 text-sm mt-1">
                Este trabajo requiere autorización del cliente antes de proceder. 
                Puedes autorizar o rechazar el trabajo a continuación.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comentarios {workOrder.status === "No Authorized" ? "(opcional para autorizar, requerido para rechazar)" : ""}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Agregar comentarios sobre la autorización..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaBan />
            )}
            Rechazar Trabajo
          </button>
          
          <button
            onClick={handleAuthorize}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaCheck />
            )}
            Autorizar Trabajo
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
