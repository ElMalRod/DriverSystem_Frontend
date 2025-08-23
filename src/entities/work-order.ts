// Work log related interfaces
export interface WorkLog {
  id: number
  workOrderId: number
  autorId: number
  logType: 'NOTE' | 'DIAGNOSIS' | 'PROGRESS' | 'ISSUE' | 'CUSTOMER_NOTE'
  note: string
  hours: number // Required by backend
  logCreatedAt?: string
}

export interface WorkLogCreateRequest {
  workOrderId: number
  autorId: number
  logType: 'NOTE' | 'DIAGNOSIS' | 'PROGRESS' | 'ISSUE' | 'CUSTOMER_NOTE'
  note: string
  hours: number // Required by backend - use 0 if no hours worked
}

// Basic work order response from API
export interface WorkOrderApiResponse {
  id: number
  code: string
  vehicleId: number
  customerId: number
  typeId: number
  statusType: number
  description?: string
  estimatedHours?: number
  openedAt: string
  closedAt?: string
  createdBy: number
  visitId?: number
}

export interface WorkOrder {
  id: number
  code: string
  description?: string
  estimatedHours?: number
  openedAt: string
  closedAt?: string
  maintenanceType: 'Corrective' | 'Preventive'
  status: string
  customerId: number
  vehicleId?: number // Add vehicleId field
  docNumberCustomer: string
  customer: string
  phoneCustomer: string
  createdBy: string
  vin: string
  plate: string
  model: string
  modelYear: number
  color: string
  make: string
}

export interface WorkOrderCreateRequest {
  id?: number
  vehicleId: number
  customerId: number
  typeId: number
  statusType: number
  description: string
  estimatedHours: number
  closedAt?: string
  createdBy: number
  visitId?: number
}

export interface WorkOrderViewRequest {
  userId: number
  statusId: number
}

export interface WorkOrderUserRequest {
  id: number
  userId: number
  vehicleId: number
}

export interface WorkStatus {
  id: number
  code: string
  name: string
}

export interface MaintenanceType {
  id: number
  code: string
  name: string
}

export interface WorkAssignment {
  id: number
  workOrderId: number
  assigneeId: number
  role: number
  assignedAt: string
  releasedAt?: string | null
}

export interface WorkAssignmentCreateRequest {
  id?: number
  workOrderId: number
  assigneeId: number
  role: number
  assignedAt?: string
  releasedAt?: string
}

export interface WorkAssignmentWithEmployeeInfo {
  id: number
  workOrderId: number
  assigneeId: number
  role: number
  assignedAt: string
  releasedAt?: string | null
  employeeName: string
  employeeEmail: string
  employeePhone: string
  roleName: string
}
