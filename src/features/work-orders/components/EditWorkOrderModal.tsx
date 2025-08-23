"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  FaTimes, 
  FaEdit,
  FaSpinner,
  FaSave,
  FaClipboardList,
  FaClock,
  FaFileAlt,
  FaTools
} from "react-icons/fa"
import { 
  WorkOrder,
  updateWorkOrderInfo,
  getMaintenanceTypes,
  MaintenanceType
} from "../api"

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

interface EditWorkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  workOrder: WorkOrder | null
  onWorkOrderUpdated?: (workOrder: WorkOrder) => void
}

export default function EditWorkOrderModal({ 
  isOpen, 
  onClose, 
  workOrder,
  onWorkOrderUpdated 
}: EditWorkOrderModalProps) {
  const [formData, setFormData] = useState({
    description: "",
    estimatedHours: "",
    maintenanceType: ""
  })
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTypes, setLoadingTypes] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted (for portal)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Load maintenance types when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMaintenanceTypes()
    }
  }, [isOpen])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && workOrder) {
      setFormData({
        description: workOrder.description || "",
        estimatedHours: workOrder.estimatedHours?.toString() || "",
        maintenanceType: workOrder.maintenanceType || ""
      })
    } else if (!isOpen) {
      setFormData({
        description: "",
        estimatedHours: "",
        maintenanceType: ""
      })
    }
  }, [isOpen, workOrder])

  const loadMaintenanceTypes = async () => {
    try {
      setLoadingTypes(true)
      const types = await getMaintenanceTypes()
      setMaintenanceTypes(types)
    } catch (error) {
      console.error('Error loading maintenance types:', error)
    } finally {
      setLoadingTypes(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!formData.description.trim()) {
      errors.push("La descripción es requerida")
    }

    if (formData.estimatedHours && isNaN(Number(formData.estimatedHours))) {
      errors.push("Las horas estimadas deben ser un número válido")
    }

    if (formData.estimatedHours && Number(formData.estimatedHours) < 0) {
      errors.push("Las horas estimadas no pueden ser negativas")
    }

    if (formData.estimatedHours && Number(formData.estimatedHours) > 100) {
      errors.push("Las horas estimadas no pueden ser mayores a 100")
    }

    return errors
  }

  const handleSave = async () => {
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
      setLoading(true)
      
      // Get the type ID for the selected maintenance type
      const selectedType = maintenanceTypes.find(type => type.name === formData.maintenanceType)
      const typeId = selectedType?.id || (formData.maintenanceType === 'Preventive' ? 1 : 2)

      // Prepare update data
      const updateData = {
        id: workOrder.id,
        description: formData.description.trim(),
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : null,
        typeId: typeId,
        workOrder: workOrder // Pass the complete work order
      }

      // Call API to update work order
      await updateWorkOrderInfo(updateData)
      
      // Update local work order object
      const updatedWorkOrder: WorkOrder = {
        ...workOrder,
        description: updateData.description,
        estimatedHours: updateData.estimatedHours || undefined,
        maintenanceType: formData.maintenanceType as 'Corrective' | 'Preventive'
      }

      // Show success message
      if (window.Swal) {
        window.Swal.fire({
          title: 'Orden Actualizada',
          text: 'La orden de trabajo se actualizó exitosamente',
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
      if (onWorkOrderUpdated) {
        onWorkOrderUpdated(updatedWorkOrder)
      }

      // Close modal
      onClose()
    } catch (error) {
      console.error('Error updating work order:', error)
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar la orden de trabajo',
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

  const hasChanges = () => {
    if (!workOrder) return false
    return (
      formData.description !== (workOrder.description || "") ||
      formData.estimatedHours !== (workOrder.estimatedHours?.toString() || "") ||
      formData.maintenanceType !== (workOrder.maintenanceType || "")
    )
  }

  if (!isOpen || !mounted || !workOrder) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4" 
      style={{ zIndex: 9999 }}
      data-modal="edit-work-order"
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
            <FaEdit className="text-2xl text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Editar Orden de Trabajo
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
          {/* Order Info (Read-only) */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaClipboardList className="text-gray-500" />
              Información de la Orden
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Código:</span>
                <p className="text-gray-600">{workOrder.code}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Estado:</span>
                <p className="text-gray-600">{workOrder.status}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Cliente:</span>
                <p className="text-gray-600">{workOrder.customer}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Vehículo:</span>
                <p className="text-gray-600">{workOrder.plate} - {workOrder.make} {workOrder.model}</p>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFileAlt className="inline mr-2 text-gray-500" />
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe el trabajo a realizar..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                rows={4}
                maxLength={1000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/1000 caracteres
              </p>
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaClock className="inline mr-2 text-gray-500" />
                Horas Estimadas
              </label>
              <input
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                placeholder="Ej: 2.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                max="100"
                step="0.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tiempo estimado en horas (opcional)
              </p>
            </div>

            {/* Maintenance Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaTools className="inline mr-2 text-gray-500" />
                Tipo de Mantenimiento
              </label>
              {loadingTypes ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <FaSpinner className="animate-spin" />
                  <span>Cargando tipos...</span>
                </div>
              ) : (
                <select
                  value={formData.maintenanceType}
                  onChange={(e) => handleInputChange('maintenanceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Preventive">Preventivo</option>
                  <option value="Corrective">Correctivo</option>
                </select>
              )}
            </div>
          </div>

          {/* Change Summary */}
          {hasChanges() && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Cambios Detectados:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {formData.description !== (workOrder.description || "") && (
                  <li>• Descripción modificada</li>
                )}
                {formData.estimatedHours !== (workOrder.estimatedHours?.toString() || "") && (
                  <li>• Horas estimadas modificadas</li>
                )}
                {formData.maintenanceType !== (workOrder.maintenanceType || "") && (
                  <li>• Tipo de mantenimiento modificado</li>
                )}
              </ul>
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
            onClick={handleSave}
            disabled={loading || !hasChanges() || !formData.description.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <FaSave />
                Guardar Cambios
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
