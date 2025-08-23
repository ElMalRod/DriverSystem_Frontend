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
  releasedAt?: string
}

export interface WorkLog {
  id: number
  workOrderId: number
  authorId: number
  logType: 'NOTE' | 'DIAGNOSIS' | 'PROGRESS' | 'ISSUE' | 'CUSTOMER_NOTE'
  note: string
  hours?: number
  createdAt: string
}
