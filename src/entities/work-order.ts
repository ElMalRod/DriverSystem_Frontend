export interface WorkOrder {
  id: number
  code: string
  description?: string
  type: 'CORRECTIVE' | 'PREVENTIVE'
  status: string
  estimated_hours?: number
  opened_at: string
  closed_at?: string
  created_by: number
  customer_id: number
  vehicle_id: number
}
