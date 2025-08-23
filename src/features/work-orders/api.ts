import { httpClient } from "@/services/http"
import { 
  WorkOrder, 
  WorkOrderCreateRequest, 
  WorkOrderViewRequest, 
  WorkOrderUserRequest,
  WorkStatus,
  MaintenanceType,
  WorkAssignment,
  WorkLog
} from "@/entities/work-order"

// Re-export types for convenience
export type {
  WorkOrder,
  WorkOrderCreateRequest,
  WorkOrderViewRequest,
  WorkOrderUserRequest,
  WorkStatus,
  MaintenanceType,
  WorkAssignment,
  WorkLog
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Get all work orders
export async function getAllWorkOrders(): Promise<WorkOrder[]> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/`)
  return response.json()
}

// Get work order by ID
export async function getWorkOrderById(id: number): Promise<WorkOrder> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/${id}`)
  return response.json()
}

// Create work order
export async function createWorkOrder(workOrder: WorkOrderCreateRequest): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/`, {
    method: 'POST',
    body: JSON.stringify(workOrder)
  })
  return response.json()
}

// Update work order
export async function updateWorkOrder(workOrder: WorkOrderCreateRequest): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/`, {
    method: 'PUT',
    body: JSON.stringify(workOrder)
  })
  return response.json()
}

// Delete work order
export async function deleteWorkOrder(id: number): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/${id}`, {
    method: 'DELETE'
  })
  return response.json()
}

// Get work orders by status
export async function getWorkOrdersByStatus(statusId: number): Promise<WorkOrder[]> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/status/${statusId}`)
  return response.json()
}

// Get work orders by user and status
export async function getWorkOrdersByUserAndStatus(request: WorkOrderViewRequest): Promise<WorkOrder[]> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/view`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}

// Get work orders by vehicle and user
export async function getWorkOrdersByVehicleAndUser(request: WorkOrderUserRequest): Promise<WorkOrder[]> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/user`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}

// Get all work status
export async function getAllWorkStatus(): Promise<WorkStatus[]> {
  // Esta función necesitará ser implementada cuando tengas el endpoint
  // Por ahora retorno los estados predeterminados
  return [
    { id: 1, code: 'CREATED', name: 'Created' },
    { id: 2, code: 'ASSIGNED', name: 'Assigned' },
    { id: 3, code: 'IN_PROGRESS', name: 'In Progress' },
    { id: 4, code: 'ON_HOLD', name: 'On Hold' },
    { id: 5, code: 'COMPLETED', name: 'Completed' },
    { id: 6, code: 'CANCELLED', name: 'Cancelled' },
    { id: 7, code: 'CLOSED', name: 'Closed' },
    { id: 8, code: 'NO_AUTHORIZED', name: 'No Authorized' }
  ]
}

// Get maintenance types
export async function getMaintenanceTypes(): Promise<MaintenanceType[]> {
  // Esta función necesitará ser implementada cuando tengas el endpoint
  return [
    { id: 1, code: 'CORRECTIVE', name: 'Corrective' },
    { id: 2, code: 'PREVENTIVE', name: 'Preventive' }
  ]
}

// Work assignments (will need endpoints)
export async function getWorkAssignments(workOrderId: number): Promise<WorkAssignment[]> {
  // Pendiente implementar cuando tengas el endpoint
  throw new Error('Endpoint not implemented yet')
}

// Work logs (will need endpoints)
export async function getWorkLogs(workOrderId: number): Promise<WorkLog[]> {
  // Pendiente implementar cuando tengas el endpoint
  throw new Error('Endpoint not implemented yet')
}
