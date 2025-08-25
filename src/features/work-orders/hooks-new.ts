import { useState, useEffect } from 'react'
import { 
  getAllWorkOrders,
  getWorkOrderById,
  getWorkOrdersByStatus,
  getAllWorkStatus,
  getMaintenanceTypes,
  WorkOrder,
  WorkStatus,
  MaintenanceType
} from './api'

export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllWorkOrders()
      setWorkOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching work orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  return {
    workOrders,
    loading,
    error,
    refetch: fetchWorkOrders
  }
}

export function useWorkOrder(id: number) {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getWorkOrderById(id)
      const mappedData: WorkOrder = {
        ...data,
        maintenanceType: data.maintenanceType === "Corrective" ? "Corrective" : "Preventive"
      }
      setWorkOrder(mappedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching work order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchWorkOrder()
    }
  }, [id])

  return {
    workOrder,
    loading,
    error,
    refetch: fetchWorkOrder
  }
}

export function useWorkOrdersByStatus(statusId?: number) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkOrdersByStatus = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getWorkOrdersByStatus(id)
      setWorkOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching work orders by status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (statusId) {
      fetchWorkOrdersByStatus(statusId)
    }
  }, [statusId])

  return {
    workOrders,
    loading,
    error,
    fetchByStatus: fetchWorkOrdersByStatus
  }
}

export function useWorkStatus() {
  const [workStatus, setWorkStatus] = useState<WorkStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllWorkStatus()
      setWorkStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching work status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkStatus()
  }, [])

  return {
    workStatus,
    loading,
    error,
    refetch: fetchWorkStatus
  }
}

export function useMaintenanceTypes() {
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMaintenanceTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMaintenanceTypes()
      setMaintenanceTypes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching maintenance types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaintenanceTypes()
  }, [])

  return {
    maintenanceTypes,
    loading,
    error,
    refetch: fetchMaintenanceTypes
  }
}
