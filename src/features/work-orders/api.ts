import { httpClient } from "@/services/http"
import { 
  WorkOrder,
  WorkOrderApiResponse,
  WorkOrderCreateRequest, 
  WorkOrderViewRequest, 
  WorkOrderUserRequest,
  WorkStatus,
  MaintenanceType,
  WorkAssignment,
  WorkAssignmentCreateRequest,
  WorkLog,
  WorkLogCreateRequest,
  WorkAssignmentWithEmployeeInfo
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
  WorkAssignmentCreateRequest,
  WorkAssignmentWithEmployeeInfo,
  WorkLog,
  WorkLogCreateRequest
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Get all work orders
// Get all work orders
export async function getAllWorkOrders(): Promise<WorkOrder[]> {
  try {
    const response = await httpClient(`${BASE_URL}/api/Work/order/`)
    const workOrdersData: WorkOrderApiResponse[] = await response.json()
    
    // The backend now returns all the data we need, so we can map it directly
    return workOrdersData.map((workOrderData): WorkOrder => ({
      id: workOrderData.id,
      code: workOrderData.code,
      description: workOrderData.description,
      estimatedHours: workOrderData.estimatedHours,
      openedAt: workOrderData.openedAt,
      closedAt: workOrderData.closedAt,
      maintenanceType: workOrderData.maintenanceType as 'Corrective' | 'Preventive',
      status: workOrderData.status,
      customerId: workOrderData.customerId,
      vehicleId: workOrderData.vehicleId,
      // Customer data from backend
      customer: workOrderData.customer,
      docNumberCustomer: workOrderData.docNumberCustomer,
      phoneCustomer: workOrderData.phoneCustomer,
      // Vehicle data from backend
      plate: workOrderData.plate,
      make: workOrderData.make,
      model: workOrderData.model,
      modelYear: workOrderData.modelYear,
      color: workOrderData.color,
      vin: workOrderData.vin,
      createdBy: workOrderData.createdBy
    }))
  } catch (error) {
    console.error('Error getting all work orders:', error)
    throw error
  }
}

// Get work order by ID with details
export async function getWorkOrderWithDetails(id: number): Promise<WorkOrder | null> {
  try {
    const workOrderResponse = await httpClient(`${BASE_URL}/api/Work/order/{id}?id=${id}`)
    const workOrderData: WorkOrderApiResponse = await workOrderResponse.json()
    
    // Map the backend response directly to WorkOrder
    return {
      id: workOrderData.id,
      code: workOrderData.code,
      description: workOrderData.description,
      estimatedHours: workOrderData.estimatedHours,
      openedAt: workOrderData.openedAt,
      closedAt: workOrderData.closedAt,
      maintenanceType: workOrderData.maintenanceType as 'Corrective' | 'Preventive',
      status: workOrderData.status,
      customerId: workOrderData.customerId,
      vehicleId: workOrderData.vehicleId,
      // Customer data from backend
      customer: workOrderData.customer,
      docNumberCustomer: workOrderData.docNumberCustomer,
      phoneCustomer: workOrderData.phoneCustomer,
      // Vehicle data from backend
      plate: workOrderData.plate,
      make: workOrderData.make,
      model: workOrderData.model,
      modelYear: workOrderData.modelYear,
      color: workOrderData.color,
      vin: workOrderData.vin,
      createdBy: workOrderData.createdBy
    }
  } catch (error) {
    console.error('Error getting work order details:', error)
    return null
  }
}

// Get work order by ID
export async function getWorkOrderById(id: number): Promise<WorkOrderApiResponse> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/{id}?id=${id}`)
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

// Update work order basic info
export async function updateWorkOrderInfo(updateData: {
  id: number
  description: string
  estimatedHours: number | null
  typeId: number
  workOrder: WorkOrder // Need the complete work order to send all required fields
}): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: updateData.id,
      vehicleId: updateData.workOrder.vehicleId || 1, // Get from original work order
      customerId: updateData.workOrder.customerId,
      typeId: updateData.typeId,
      statusType: getStatusTypeFromString(updateData.workOrder.status),
      description: updateData.description,
      estimatedHours: updateData.estimatedHours,
      closedAt: updateData.workOrder.closedAt || null,
      createdBy: 1, // TODO: Get from auth context
      visitId: null // Optional field
    })
  })

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return null
}

// Helper function to convert status string to number
function getStatusTypeFromString(status: string): number {
  const statusMapping: { [key: string]: number } = {
    'Created': 1,
    'Assigned': 2,
    'In Progress': 3,
    'On Hold': 4,
    'Completed': 5,
    'Cancelled': 6,
    'Closed': 7,
    'No Authorized': 8
  }
  return statusMapping[status] || 1
}

// Update work order status
export async function updateWorkOrderStatus(id: number, statusType: number, comment?: string): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/work/log/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workOrderId: id,
      autorId: 1, // TODO: Get from auth context
      logType: 'NOTE',
      note: comment || `Estado cambiado a ${statusType}`,
      hours: 0 // Always send 0 for status change logs
    })
  })

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return null
}
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

// =============================================================================
// WORK ASSIGNMENTS API
// =============================================================================

// Get all work assignments
export async function getAllWorkAssignments(): Promise<WorkAssignment[]> {
  const response = await httpClient(`${BASE_URL}/api/work/assignment/`)
  return response.json()
}

// Create work assignment
export async function createWorkAssignment(assignment: WorkAssignmentCreateRequest): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/work/assignment/`, {
    method: 'POST',
    body: JSON.stringify(assignment)
  })
  
  // Check if response has content before trying to parse JSON
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  } else {
    // If no JSON content, just return success status
    return { success: response.ok }
  }
}

// Update work assignment
export async function updateWorkAssignment(assignment: WorkAssignmentCreateRequest): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/work/assignment/`, {
    method: 'PUT',
    body: JSON.stringify(assignment)
  })
  return response.json()
}

// Delete work assignment
export async function deleteWorkAssignment(id: number): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/work/assignment/${id}`, {
    method: 'DELETE'
  })
  
  // Check if response has content before trying to parse JSON
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  } else {
    // If no JSON content, just return success status
    return { success: response.ok }
  }
}

// Get assignments for a specific work order
export async function getWorkAssignmentsByOrder(workOrderId: number): Promise<WorkAssignment[]> {
  const response = await getAllWorkAssignments()
  return response.filter(assignment => assignment.workOrderId === workOrderId)
}

// Work Log Functions
// Get all work logs
export async function getAllWorkLogs(): Promise<WorkLog[]> {
  const response = await httpClient(`${BASE_URL}/api/work/log/`)
  return response.json()
}

// Get work logs by order ID
export async function getWorkLogsByOrder(orderId: number): Promise<WorkLog[]> {
  const response = await httpClient(`${BASE_URL}/api/work/log/${orderId}`)
  return response.json()
}

// Create work log
export async function createWorkLog(logData: WorkLogCreateRequest): Promise<WorkLog> {
  const response = await httpClient(`${BASE_URL}/api/work/log/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workOrderId: logData.workOrderId,
      autorId: logData.autorId,
      logType: logData.logType,
      note: logData.note,
      hours: logData.hours || 0 // Always send a number, default to 0
    })
  })

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  throw new Error('No JSON response received')
}
