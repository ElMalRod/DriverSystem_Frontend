"use client"

import { useState, useEffect } from 'react';
import { useWorkOrders, useWorkStatuses, useWorkTypes } from '@/features/work-orders/hooks';
import { WorkOrder } from '@/features/work-orders/api';
import { getUsers, getClients, User } from '@/features/users/api';
import { getAllVehicles } from '@/features/vehicles/api';
import Swal from 'sweetalert2';

export default function WorkOrdersPage() {
  const { 
    workOrders, 
    loading, 
    error, 
    fetchWorkOrders, 
    fetchWorkOrdersByStatus,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder
  } = useWorkOrders();
  
  const { statuses } = useWorkStatuses();
  const { types } = useWorkTypes();
  
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  
  // Form data para crear/editar orden
  const [formData, setFormData] = useState({
    vehicleId: 0,
    customerId: 0,
    typeId: 0,
    statusType: 1, // Default: Created
    description: '',
    estimatedHours: 0,
    createdBy: 1, // TODO: Get from auth
    visitId: 0
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [usersData, vehiclesData, customersData] = await Promise.all([
        getUsers(),
        getAllVehicles(),
        getClients()
      ]);
      
      setUsers(usersData);
      setVehicles(vehiclesData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleStatusFilter = (statusId: number | null) => {
    setSelectedStatus(statusId);
    if (statusId === null) {
      fetchWorkOrders();
    } else {
      fetchWorkOrdersByStatus(statusId);
    }
  };

  const handleCreateWorkOrder = async () => {
    try {
      await createWorkOrder(formData);
      setShowCreateModal(false);
      resetForm();
      Swal.fire({
        title: 'Éxito',
        text: 'Orden de trabajo creada exitosamente',
        icon: 'success',
        confirmButtonColor: '#3B82F6'
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo crear la orden de trabajo',
        icon: 'error',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  const handleEditWorkOrder = async () => {
    if (!selectedWorkOrder) return;
    
    try {
      const updatedOrder = { ...selectedWorkOrder, ...formData };
      await updateWorkOrder(updatedOrder);
      setShowEditModal(false);
      setSelectedWorkOrder(null);
      resetForm();
      Swal.fire({
        title: 'Éxito',
        text: 'Orden de trabajo actualizada exitosamente',
        icon: 'success',
        confirmButtonColor: '#3B82F6'
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar la orden de trabajo',
        icon: 'error',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  const handleDeleteWorkOrder = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteWorkOrder(id);
        Swal.fire({
          title: 'Eliminada',
          text: 'La orden de trabajo ha sido eliminada',
          icon: 'success',
          confirmButtonColor: '#3B82F6'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar la orden de trabajo',
          icon: 'error',
          confirmButtonColor: '#3B82F6'
        });
      }
    }
  };

  const openEditModal = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setFormData({
      vehicleId: workOrder.vehicleId,
      customerId: workOrder.customerId,
      typeId: workOrder.typeId,
      statusType: workOrder.statusType,
      description: workOrder.description,
      estimatedHours: workOrder.estimatedHours,
      createdBy: workOrder.createdBy,
      visitId: workOrder.visitId || 0
    });
    setShowEditModal(true);
  };

  const openAssignModal = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setShowAssignModal(true);
  };

  const resetForm = () => {
    setFormData({
      vehicleId: 0,
      customerId: 0,
      typeId: 0,
      statusType: 1,
      description: '',
      estimatedHours: 0,
      createdBy: 1,
      visitId: 0
    });
  };

  const getStatusName = (statusId: number) => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.name : 'Desconocido';
  };

  const getStatusColor = (statusId: number) => {
    const status = statuses.find(s => s.id === statusId);
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.code) {
      case 'CREATED': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'ON_HOLD': return 'bg-orange-100 text-orange-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      case 'NO_AUTHORIZED': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (typeId: number) => {
    const type = types.find(t => t.id === typeId);
    return type ? type.name : 'Desconocido';
  };

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.licensePlate} (${vehicle.make} ${vehicle.model})` : 'Vehículo desconocido';
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Cliente desconocido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando órdenes de trabajo...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-dark)]">
            Órdenes de Trabajo
          </h1>
          <p className="text-gray-600">
            Gestiona las órdenes de trabajo mecánicas
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Nueva Orden
        </button>
      </div>

      {/* Filtros por estado */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Filtrar por Estado</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusFilter(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedStatus === null 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {statuses.map(status => (
            <button
              key={status.id}
              onClick={() => handleStatusFilter(status.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === status.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Lista de Órdenes</h2>
          <p className="text-sm text-gray-600">
            {workOrders.length} órden(es) encontrada(s)
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
            {error}
          </div>
        )}

        {workOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron órdenes de trabajo
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas Est.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getVehicleInfo(order.vehicleId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCustomerName(order.customerId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTypeName(order.typeId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.statusType)}`}>
                        {getStatusName(order.statusType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {order.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.estimatedHours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(order)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openAssignModal(order)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        Asignar
                      </button>
                      <button
                        onClick={() => handleDeleteWorkOrder(order.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Orden */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Crear Nueva Orden de Trabajo</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({...formData, customerId: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value={0}>Seleccionar cliente</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehículo
                </label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({...formData, vehicleId: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value={0}>Seleccionar vehículo</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Trabajo
                </label>
                <select
                  value={formData.typeId}
                  onChange={(e) => setFormData({...formData, typeId: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value={0}>Seleccionar tipo</option>
                  {types.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Describir el trabajo a realizar..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas Estimadas
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({...formData, estimatedHours: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                  step="0.5"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateWorkOrder}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Crear Orden
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Orden - Similar al modal crear pero con datos prellenados */}
      {showEditModal && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Orden de Trabajo #{selectedWorkOrder.id}</h2>
            
            {/* Mismo formulario que crear, pero con los datos del selectedWorkOrder */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.statusType}
                  onChange={(e) => setFormData({...formData, statusType: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas Estimadas
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({...formData, estimatedHours: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                  step="0.5"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditWorkOrder}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Actualizar
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedWorkOrder(null);
                  resetForm();
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar - Placeholder por ahora */}
      {showAssignModal && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Asignar Orden #{selectedWorkOrder.id}</h2>
            
            <p className="text-gray-600 mb-4">
              Funcionalidad de asignación de empleados próximamente disponible.
            </p>

            <button
              onClick={() => {
                setShowAssignModal(false);
                setSelectedWorkOrder(null);
              }}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}