import { useState, useEffect } from 'react';
import { workOrdersApi, WorkOrder, WorkStatus, WorkType } from './api';

export const useWorkOrders = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const orders = await workOrdersApi.getWorkOrders();
      setWorkOrders(orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes de trabajo');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrdersByStatus = async (statusId: number) => {
    setLoading(true);
    setError(null);
    try {
      const orders = await workOrdersApi.getWorkOrdersByStatus(statusId);
      setWorkOrders(orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes por estado');
    } finally {
      setLoading(false);
    }
  };

  const createWorkOrder = async (workOrder: Omit<WorkOrder, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      await workOrdersApi.createWorkOrder(workOrder);
      await fetchWorkOrders(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear orden de trabajo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkOrder = async (workOrder: WorkOrder) => {
    setLoading(true);
    setError(null);
    try {
      await workOrdersApi.updateWorkOrder(workOrder);
      await fetchWorkOrders(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar orden de trabajo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkOrder = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await workOrdersApi.deleteWorkOrder(id);
      await fetchWorkOrders(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar orden de trabajo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  return {
    workOrders,
    loading,
    error,
    fetchWorkOrders,
    fetchWorkOrdersByStatus,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
  };
};

export const useWorkStatuses = () => {
  const [statuses, setStatuses] = useState<WorkStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusList = await workOrdersApi.getWorkStatuses();
      setStatuses(statusList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  return {
    statuses,
    loading,
    error,
    fetchStatuses,
  };
};

export const useWorkTypes = () => {
  const [types, setTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const typeList = await workOrdersApi.getWorkTypes();
      setTypes(typeList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tipos de trabajo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  return {
    types,
    loading,
    error,
    fetchTypes,
  };
};
