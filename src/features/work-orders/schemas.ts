// Work Order validation schemas and types
export interface WorkOrderCreateData {
  vehicleId: number
  customerId: number
  typeId: number
  statusType: number
  description: string
  estimatedHours: number
  createdBy: number
  visitId?: number
  closedAt?: string
}

export interface WorkOrderUpdateData extends WorkOrderCreateData {
  id: number
}

export interface WorkOrderViewData {
  userId: number
  statusId: number
}

export interface WorkOrderUserData {
  id: number
  userId: number
  vehicleId: number
}

export interface WorkOrderFilters {
  searchTerm?: string
  statusId?: number
  typeId?: number
  customerId?: number
  dateFrom?: string
  dateTo?: string
}

// Validation functions
export const validateWorkOrderCreate = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!data.vehicleId || data.vehicleId < 1) {
    errors.push("Debe seleccionar un vehículo")
  }

  if (!data.customerId || data.customerId < 1) {
    errors.push("Debe seleccionar un cliente")
  }

  if (!data.typeId || data.typeId < 1) {
    errors.push("Debe seleccionar un tipo de mantenimiento")
  }

  if (!data.statusType || data.statusType < 1) {
    errors.push("Debe seleccionar un estado")
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push("La descripción debe tener al menos 10 caracteres")
  }

  if (!data.estimatedHours || data.estimatedHours < 0.1) {
    errors.push("Las horas estimadas deben ser mayor a 0")
  }

  if (!data.createdBy || data.createdBy < 1) {
    errors.push("Debe especificar quién crea la orden")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateWorkOrderUpdate = (data: any): { isValid: boolean; errors: string[] } => {
  const baseValidation = validateWorkOrderCreate(data)

  if (!data.id || data.id < 1) {
    baseValidation.errors.unshift("ID de orden requerido")
  }

  return {
    isValid: baseValidation.errors.length === 0,
    errors: baseValidation.errors
  }
}
