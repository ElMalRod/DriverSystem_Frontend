import { useState, useEffect } from 'react';
import { 
  WorkOrder, 
  WorkOrderRequest, 
  WorkStatus, 
  MaintenanceType, 
  workOrdersApi 
} from './api';

// Hook principal para gestionar órdenes de trabajo
export const useWorkOrders = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todas las órdenes
  const fetchWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const orders = await workOrdersApi.getWorkOrders();
      setWorkOrders(orders);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Obtener órdenes por estado
  const fetchWorkOrdersByStatus = async (statusId: number) => {
    setLoading(true);
    setError(null);
    try {
      const orders = await workOrdersApi.getWorkOrdersByStatus(statusId);
      setWorkOrders(orders);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Obtener orden por ID
  const fetchWorkOrderById = async (id: number): Promise<WorkOrder | null> => {
    setLoading(true);
    setError(null);
    try {
      return await workOrdersApi.getWorkOrderById(id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Crear nueva orden
  const createWorkOrder = async (workOrder: WorkOrderRequest): Promise<WorkOrder | null> => {
    setLoading(true);
    setError(null);
    try {
      const newOrder = await workOrdersApi.createWorkOrder(workOrder);
      // Recargar la lista después de crear
      await fetchWorkOrders();
      return newOrder;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear orden');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar orden
  const updateWorkOrder = async (workOrder: WorkOrderRequest): Promise<WorkOrder | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedOrder = await workOrdersApi.updateWorkOrder(workOrder);
      // Recargar la lista después de actualizar
      await fetchWorkOrders();
      return updatedOrder;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar orden');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar orden
  const deleteWorkOrder = async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await workOrdersApi.deleteWorkOrder(id);
      // Recargar la lista después de eliminar
      await fetchWorkOrders();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar orden');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Obtener órdenes por cliente y estado
  const fetchWorkOrdersByCustomerAndStatus = async (userId: number, statusId: number) => {
    setLoading(true);
    setError(null);
    try {
      const orders = await workOrdersApi.getWorkOrdersByCustomerAndStatus(userId, statusId);
      setWorkOrders(orders);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Obtener órdenes por usuario y vehículo
  const fetchWorkOrdersByUserAndVehicle = async (id: number, userId: number, vehicleId: number) => {
    setLoading(true);
    setError(null);
    try {
      const orders = await workOrdersApi.getWorkOrdersByUserAndVehicle(id, userId, vehicleId);
      setWorkOrders(orders);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar órdenes al montar el componente
  useEffect(() => {
    fetchWorkOrders();
  }, []);

  return {
    workOrders,
    loading,
    error,
    fetchWorkOrders,
    fetchWorkOrdersByStatus,
    fetchWorkOrderById,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    fetchWorkOrdersByCustomerAndStatus,
    fetchWorkOrdersByUserAndVehicle
  };
};

// Hook para estados de trabajo
export const useWorkStatuses = () => {
  const [statuses, setStatuses] = useState<WorkStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workOrdersApi.getWorkStatuses();
      setStatuses(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar estados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  return { statuses, loading, error, fetchStatuses };
};

// Hook para tipos de mantenimiento
export const useMaintenanceTypes = () => {
  const [types, setTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workOrdersApi.getMaintenanceTypes();
      setTypes(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar tipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  return { types, loading, error, fetchTypes };
};
