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

export async function getAllWorkOrders(): Promise<WorkOrder[]> {
  try {
    const response = await httpClient(`${BASE_URL}/api/Work/order/`)
    const workOrdersData: WorkOrderApiResponse[] = await response.json()
    
    const workOrders = workOrdersData.map((workOrderData): WorkOrder => ({
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
      // Cliente
      customer: workOrderData.customer,
      docNumberCustomer: workOrderData.docNumberCustomer,
      phoneCustomer: workOrderData.phoneCustomer,
      // vehiculo
      plate: workOrderData.plate,
      make: workOrderData.make,
      model: workOrderData.model,
      modelYear: workOrderData.modelYear,
      color: workOrderData.color,
      vin: workOrderData.vin,
      createdBy: workOrderData.createdBy
    }))

    // 🗂️ Sort by creation date - most recent first (descending order)
    return workOrders.sort((a, b) => {
      const dateA = new Date(a.openedAt).getTime()
      const dateB = new Date(b.openedAt).getTime()
      return dateB - dateA // Descending order (newest first)
    })
  } catch (error) {
    console.error('Error getting all work orders:', error)
    throw error
  }
}

export async function getWorkOrderWithDetails(id: number): Promise<WorkOrder | null> {
  try {
    const allWorkOrders = await getAllWorkOrders()
    const workOrder = allWorkOrders.find(wo => wo.id === id)
    
    if (!workOrder) {
      console.error(`Work order with ID ${id} not found`)
      return null
    }
    
    return workOrder
  } catch (error) {
    console.error('Error getting work order details:', error)
    return null
  }
}

export async function getWorkOrderById(id: number): Promise<WorkOrderApiResponse> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/${id}?id=${id}`)
  return response.json()
}

export async function createWorkOrder(workOrder: WorkOrderCreateRequest): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/`, {
    method: 'POST',
    body: JSON.stringify(workOrder)
  })
  return response.json()
}

export async function updateWorkOrderInfo(updateData: {
  id: number
  description: string
  estimatedHours: number | null
  typeId: number
  workOrder: WorkOrder 
}): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: updateData.id,
      vehicleId: updateData.workOrder.vehicleId || 1, 
      customerId: updateData.workOrder.customerId,
      typeId: updateData.typeId,
      statusType: getStatusTypeFromString(updateData.workOrder.status),
      description: updateData.description,
      estimatedHours: updateData.estimatedHours,
      closedAt: updateData.workOrder.closedAt || null,
      createdBy: 1, 
      visitId: null 
    })
  })

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return null
}

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

export async function updateWorkOrder(workOrder: WorkOrderCreateRequest): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/`, {
    method: 'PUT',
    body: JSON.stringify(workOrder)
  })
  return response.json()
}

export async function deleteWorkOrder(id: number): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/${id}`, {
    method: 'DELETE'
  })
  return response.json()
}

export async function getWorkOrdersByStatus(statusId: number): Promise<WorkOrder[]> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/status/${statusId}`)
  return response.json()
}

export async function getWorkOrdersByUserAndStatus(request: WorkOrderViewRequest): Promise<WorkOrder[]> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/view`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}

export async function getWorkOrdersByVehicleAndUser(request: WorkOrderUserRequest): Promise<WorkOrder[]> {
  const response = await httpClient(`${BASE_URL}/api/Work/order/user`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}

export async function getAllWorkStatus(): Promise<WorkStatus[]> {
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

export async function getMaintenanceTypes(): Promise<MaintenanceType[]> {
  return [
    { id: 1, code: 'CORRECTIVE', name: 'Corrective' },
    { id: 2, code: 'PREVENTIVE', name: 'Preventive' }
  ]
}

export async function getWorkAssignments(workOrderId: number): Promise<WorkAssignment[]> {
  // Pendiente implementar cuando tengas el endpoint
  throw new Error('Endpoint not implemented yet')
}

export async function getWorkLogs(workOrderId: number): Promise<WorkLog[]> {
  // Pendiente implementar cuando tengas el endpoint
  throw new Error('Endpoint not implemented yet')
}

// =============================================================================
// WORK ASSIGNMENTS API
// =============================================================================

export async function getAllWorkAssignments(): Promise<WorkAssignment[]> {
  const response = await httpClient(`${BASE_URL}/api/work/assignment/`)
  return response.json()
}

export async function checkEmployeeAvailability(employeeId: number): Promise<{
  isAvailable: boolean;
  activeAssignments: WorkAssignment[];
  activeWorkOrders: string[];
}> {
  try {
    const allAssignments = await getAllWorkAssignments()
    const employeeAssignments = allAssignments.filter(
      assignment => assignment.assigneeId === employeeId && !assignment.releasedAt
    )
    
    if (employeeAssignments.length === 0) {
      return {
        isAvailable: true,
        activeAssignments: [],
        activeWorkOrders: []
      }
    }

    const allWorkOrders = await getAllWorkOrders()
    
    const activeStates = ['Created', 'Assigned', 'In Progress', 'On Hold']
    const activeAssignments = []
    const activeWorkOrderCodes = []

    for (const assignment of employeeAssignments) {
      const workOrder = allWorkOrders.find(wo => wo.id === assignment.workOrderId)
      if (workOrder && activeStates.includes(workOrder.status)) {
        activeAssignments.push(assignment)
        activeWorkOrderCodes.push(workOrder.code)
      }
    }

    return {
      isAvailable: activeAssignments.length === 0,
      activeAssignments: activeAssignments,
      activeWorkOrders: activeWorkOrderCodes
    }
  } catch (error) {
    console.error('Error checking employee availability:', error)
    return {
      isAvailable: false,
      activeAssignments: [],
      activeWorkOrders: []
    }
  }
}

export async function getAvailableEmployees(): Promise<{
  availableEmployees: number[];
  employeeWorkload: { [employeeId: number]: number };
}> {
  try {
    const allAssignments = await getAllWorkAssignments()
    const allWorkOrders = await getAllWorkOrders()
    
    const activeStates = ['Created', 'Assigned', 'In Progress', 'On Hold']
    const activeWorkOrders = allWorkOrders.filter(wo => activeStates.includes(wo.status))
    
    const employeeWorkload: { [employeeId: number]: number } = {}
    const occupiedEmployees = new Set<number>()
    
    for (const assignment of allAssignments) {
      if (!assignment.releasedAt) {
        const workOrder = activeWorkOrders.find(wo => wo.id === assignment.workOrderId)
        if (workOrder) {
          employeeWorkload[assignment.assigneeId] = (employeeWorkload[assignment.assigneeId] || 0) + 1
          occupiedEmployees.add(assignment.assigneeId)
        }
      }
    }
    
    const allEmployeeIds = Array.from(new Set(allAssignments.map(a => a.assigneeId)))
    const availableEmployees = allEmployeeIds.filter(id => !occupiedEmployees.has(id))
    
    return {
      availableEmployees,
      employeeWorkload
    }
  } catch (error) {
    console.error('Error getting available employees:', error)
    return {
      availableEmployees: [],
      employeeWorkload: {}
    }
  }
}

export async function reassignWorkOrder(
  workOrderId: number, 
  fromEmployeeId: number, 
  toEmployeeId: number,
  reason?: string
): Promise<boolean> {
  try {
    const allAssignments = await getAllWorkAssignments()
    const currentAssignment = allAssignments.find(
      a => a.workOrderId === workOrderId && a.assigneeId === fromEmployeeId && !a.releasedAt
    )
    
    if (!currentAssignment) {
      throw new Error('No active assignment found for this work order and employee')
    }

    await deleteWorkAssignment(currentAssignment.id)
    
    const newAssignmentData: WorkAssignmentCreateRequest = {
      workOrderId: workOrderId,
      assigneeId: toEmployeeId,
      role: 2, // empleado
      assignedAt: new Date().toISOString()
    }
    
    await createWorkAssignment(newAssignmentData)
    
    if (reason) {
      try {
        await createWorkLog({
          workOrderId: workOrderId,
          autorId: 1, // TODO: Get actual user ID from session
          logType: "NOTE",
          note: `Work reassigned from employee ${fromEmployeeId} to ${toEmployeeId}. Reason: ${reason}`,
          hours: 0
        })
      } catch (logError) {
        console.warn('Failed to create reassignment log:', logError)
      }
    }

    return true
  } catch (error) {
    console.error('Error reassigning work order:', error)
    throw error
  }
}

export async function createWorkAssignment(assignment: WorkAssignmentCreateRequest): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/work/assignment/`, {
    method: 'POST',
    body: JSON.stringify(assignment)
  })
  
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  } else {
    return { success: response.ok }
  }
}

export async function updateWorkAssignment(assignment: WorkAssignmentCreateRequest): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/work/assignment/`, {
    method: 'PUT',
    body: JSON.stringify(assignment)
  })
  return response.json()
}

export async function updateWorkOrderStatus(
  workOrderId: number, 
  newStatus: number, 
  comment?: string
): Promise<WorkOrder> {
  try {
    console.log('Starting updateWorkOrderStatus for ID:', workOrderId, 'New Status:', newStatus)

    // Get current work order data from API directly (this gives us the raw data needed for PUT)
    const apiResponse = await httpClient(`${BASE_URL}/api/Work/order/${workOrderId}?id=${workOrderId}`)
    const apiData = await apiResponse.json()
    
    if (!apiData) {
      throw new Error(`Work order with ID ${workOrderId} not found`)
    }

    console.log('Current work order API data:', apiData)

    const statusMap: { [key: number]: string } = {
      1: 'Created',
      2: 'Assigned', 
      3: 'In Progress',
      4: 'On Hold',
      5: 'Completed',
      6: 'Cancelled',
      7: 'Closed',
      8: 'No Authorized'
    }

    const statusString = statusMap[newStatus]
    if (!statusString) {
      throw new Error(`Invalid status code: ${newStatus}`)
    }

    console.log('Changing status to:', statusString, '(', newStatus, ')')

    // Use the exact data structure from the API response for the PUT
    const updateData = {
      id: apiData.id,
      vehicleId: apiData.vehicleId,
      customerId: apiData.customerId,
      typeId: apiData.typeId,
      statusType: newStatus, // This is the only field we're changing
      description: apiData.description,
      estimatedHours: apiData.estimatedHours,
      closedAt: (newStatus === 5 || newStatus === 7) ? new Date().toISOString() : apiData.closedAt,
      createdBy: apiData.createdBy,
      visitId: apiData.visitId
    }

    console.log('📤 Update payload:', JSON.stringify(updateData, null, 2))

    const response = await httpClient(`${BASE_URL}/api/Work/order/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    })

    console.log('📡 Update response status:', response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Update error response:', errorData)
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorData}`)
    }

    console.log('Status update successful!')

    // Create work log if comment is provided
    if (comment) {
      try {
        console.log('Creating work log...')
        await createWorkLog({
          workOrderId: workOrderId,
          autorId: 1, // TODO: Get actual user ID from session
          logType: "PROGRESS",
          note: `${comment} - Estado cambiado a: ${statusString}`,
          hours: 0
        })
      } catch (logError) {
        console.warn('Failed to create work log:', logError)
      }
    }

    // Return the updated work order
    const updatedWorkOrder = await getWorkOrderWithDetails(workOrderId)
    if (updatedWorkOrder) {
      console.log('🔄 Returning updated work order')
      return updatedWorkOrder
    }

    // Fallback: return work order with updated status using API data
    const currentWorkOrderFormatted = await getWorkOrderWithDetails(workOrderId)
    return {
      ...currentWorkOrderFormatted!,
      status: statusString,
      closedAt: updateData.closedAt || currentWorkOrderFormatted?.closedAt
    }
  } catch (error) {
    console.error('Error updating work order status:', error)
    throw error
  }
}

export async function deleteWorkAssignment(id: number): Promise<any> {
  const response = await httpClient(`${BASE_URL}/api/work/assignment/${id}`, {
    method: 'DELETE'
  })
  
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  } else {
    return { success: response.ok }
  }
}

export async function releaseSpecialistAssignment(workOrderId: number, specialistId: number): Promise<any> {
  try {
    // Buscar la asignación activa del especialista para este trabajo
    const allAssignments = await getAllWorkAssignments()
    const specialistAssignment = allAssignments.find(
      assignment => 
        assignment.workOrderId === workOrderId && 
        assignment.assigneeId === specialistId && 
        !assignment.releasedAt &&
        assignment.role === 3 // Rol de especialista
    )

    if (!specialistAssignment) {
      throw new Error('No se encontró asignación activa del especialista para este trabajo')
    }

    // Marcar la asignación como liberada
    const updatedAssignment: WorkAssignmentCreateRequest = {
      id: specialistAssignment.id,
      workOrderId: specialistAssignment.workOrderId,
      assigneeId: specialistAssignment.assigneeId,
      role: specialistAssignment.role,
      assignedAt: specialistAssignment.assignedAt,
      releasedAt: new Date().toISOString()
    }

    const response = await httpClient(`${BASE_URL}/api/work/assignment/${specialistAssignment.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedAssignment)
    })

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    } else {
      return { success: response.ok }
    }
  } catch (error) {
    console.error('Error releasing specialist assignment:', error)
    throw error
  }
}

export async function getWorkAssignmentsByOrder(workOrderId: number): Promise<WorkAssignment[]> {
  const response = await getAllWorkAssignments()
  return response.filter(assignment => assignment.workOrderId === workOrderId)
}

export async function getAllWorkLogs(): Promise<WorkLog[]> {
  const response = await httpClient(`${BASE_URL}/api/work/log/`)
  return response.json()
}

export async function getWorkLogsByOrder(orderId: number): Promise<WorkLog[]> {
  const response = await httpClient(`${BASE_URL}/api/work/log/${orderId}`)
  return response.json()
}

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
      hours: logData.hours || 0 
    })
  })

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  throw new Error('No JSON response received')
}
