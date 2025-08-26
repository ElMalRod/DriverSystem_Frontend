"use client";

import { useEffect, useState } from "react";
import {
  FaCar,
  FaUser,
  FaCalendarAlt,
  FaEye,
  FaInfo,
  FaPalette,
  FaHashtag,
  FaTools,
  FaClipboardList,
  FaFilter,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaChevronDown,
  FaHistory,
  FaWrench
} from "react-icons/fa";
import { getSessionUser } from "@/utils/session";
import { getUserVehicles, UserVehicleResponse } from "@/features/vehicles/api";
import { getVehicleVisitsByCustomer, VehicleVisit } from "@/features/vehicle-visits/api";
import { getAllWorkOrders, WorkOrder } from "@/features/work-orders/api";

declare global {
  interface Window {
    Swal: any;
  }
}

export default function CustomersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userVehicles, setUserVehicles] = useState<UserVehicleResponse[]>([]);
  const [vehicleVisits, setVehicleVisits] = useState<VehicleVisit[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  
  // Filtros
  const [selectedVehicle, setSelectedVehicle] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(user);
    setLoading(false);

    if (user?.id) {
      loadUserVehicles(user.id);
      loadServiceHistory(user.id);
    }
  }, []);

  async function loadUserVehicles(userId: string | number) {
    try {
      console.log("[CUSTOMERS] Loading vehicles for user:", userId);
      setVehiclesLoading(true);

      const vehicles = await getUserVehicles(Number(userId));
      console.log("[CUSTOMERS] Vehicles loaded:", vehicles);

      setUserVehicles(Array.isArray(vehicles) ? vehicles : []);
    } catch (err: any) {
      console.error("[CUSTOMERS] Error loading user vehicles:", err);

      // Mostrar error al usuario
      if (window.Swal) {
        window.Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los vehículos. Verifica la conexión.",
          timer: 3000,
          showConfirmButton: false,
        });
      }

      setUserVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }

  async function loadServiceHistory(userId: string | number) {
    try {
      console.log("[CUSTOMERS] Loading service history for user:", userId);
      setServicesLoading(true);

      // Cargar visitas de vehículos
      const visits = await getVehicleVisitsByCustomer(Number(userId));
      console.log("[CUSTOMERS] Vehicle visits loaded:", visits);
      setVehicleVisits(Array.isArray(visits) ? visits : []);

      // Cargar órdenes de trabajo del cliente
      const allWorkOrders = await getAllWorkOrders();
      const customerWorkOrders = allWorkOrders.filter(wo => wo.customerId === Number(userId));
      console.log("[CUSTOMERS] Work orders loaded:", customerWorkOrders);
      setWorkOrders(customerWorkOrders);

    } catch (err: any) {
      console.error("[CUSTOMERS] Error loading service history:", err);

      if (window.Swal) {
        window.Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar el historial de servicios.",
          timer: 3000,
          showConfirmButton: false,
        });
      }

      setVehicleVisits([]);
      setWorkOrders([]);
    } finally {
      setServicesLoading(false);
    }
  }

  function getFilteredWorkOrders() {
    let filtered = [...workOrders];

    // Filtrar por vehículo seleccionado
    if (selectedVehicle !== "all") {
      filtered = filtered.filter(wo => wo.vehicleId === selectedVehicle);
    }

    // Filtrar por estado
    if (selectedStatus !== "all") {
      filtered = filtered.filter(wo => wo.status === selectedStatus);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(wo => 
        wo.description?.toLowerCase().includes(term) ||
        wo.plate?.toLowerCase().includes(term) ||
        wo.customer?.toLowerCase().includes(term) ||
        wo.make?.toLowerCase().includes(term) ||
        wo.model?.toLowerCase().includes(term)
      );
    }

    // Ordenar por fecha más reciente
    return filtered.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }

  function getStatusColor(status: string) {
    const colors: { [key: string]: string } = {
      'Created': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Assigned': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Evaluating': 'bg-purple-100 text-purple-800',
      'On Hold': 'bg-gray-100 text-gray-800',
      'Completed': 'bg-green-100 text-green-800',
      'Finished': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Closed': 'bg-purple-100 text-purple-800',
      'No Authorized': 'bg-pink-100 text-pink-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function getStatusDisplayName(status: string) {
    const statusNames: { [key: string]: string } = {
      'Created': 'Creado',
      'Pending': 'Pendiente',
      'Assigned': 'Asignado',
      'In Progress': 'En Progreso',
      'Evaluating': 'En Evaluación',
      'On Hold': 'En Espera',
      'Completed': 'Completado',
      'Finished': 'Finalizado',
      'Cancelled': 'Cancelado',
      'Rejected': 'Rechazado',
      'Closed': 'Cerrado',
      'No Authorized': 'No Autorizado'
    };
    return statusNames[status] || status;
  }

  function getMaintenanceTypeDisplayName(type: string) {
    const typeNames: { [key: string]: string } = {
      'Corrective': 'Mantenimiento Correctivo',
      'Preventive': 'Mantenimiento Preventivo'
    };
    return typeNames[type] || type;
  }

  function handleViewVehicleDetails(vehicle: UserVehicleResponse) {
    const vehicleData = vehicle.vehicleResponse;
    if (window.Swal) {
      window.Swal.fire({
        title: `Detalles del Vehículo`,
        html: `
          <div class="text-left space-y-3">
            <div class="bg-gray-50 p-3 rounded">
              <p><strong>🚗 Placa:</strong> ${vehicleData.plate}</p>
              <p><strong>🏭 Marca:</strong> ${vehicleData.make}</p>
              <p><strong>🚙 Modelo:</strong> ${vehicleData.model}</p>
            </div>
            <div class="bg-blue-50 p-3 rounded">
              <p><strong>🎨 Color:</strong> ${vehicleData.color || "No especificado"}</p>
              <p><strong>📋 VIN:</strong> ${vehicleData.vin || "No registrado"}</p>
              <p><strong>🆔 ID Vehículo:</strong> ${vehicleData.id}</p>
            </div>
            <div class="bg-green-50 p-3 rounded">
              <p><strong>📅 Registrado:</strong> ${new Date(
                vehicleData.createdAt
              ).toLocaleString()}</p>
            </div>
          </div>
        `,
        icon: "info",
        width: "500px",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Cerrar",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Mis Servicios
          </h1>
          <p className="text-gray-600 mt-2">
            Consulta el estado de tus vehículos y servicios
          </p>
        </div>
      </div>

      {/* Customer Info */}
      {currentUser && (
        <div className="bg-[var(--color-light)] border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FaUser className="text-[var(--color-primary)]" size={20} />
            <div>
              <h3 className="font-semibold">{currentUser.name}</h3>
              <p className="text-sm text-gray-600">{currentUser.email}</p>
              <p className="text-xs text-gray-500">
                Cliente ID: {currentUser.id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* My Vehicles Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaCar className="text-[var(--color-primary)]" size={20} />
          <h3 className="text-lg font-semibold">Mis Vehículos</h3>
          <span className="text-sm text-gray-500">
            ({userVehicles.length} vehículos registrados)
          </span>
        </div>

        <p className="text-gray-600 mb-4">
          Estos son los vehículos que tienes registrados en el taller.
        </p>

        {vehiclesLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
            <span className="ml-2 text-gray-600">Cargando vehículos...</span>
          </div>
        ) : userVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userVehicles.map((userVehicle) => (
              <div
                key={`${userVehicle.id}-${userVehicle.vehicleResponse.id}`}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FaCar className="text-[var(--color-primary)]" size={18} />
                    <h4 className="font-semibold text-lg">
                      {userVehicle.vehicleResponse.plate}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleViewVehicleDetails(userVehicle)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                    title="Ver detalles completos"
                  >
                    <FaEye size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaHashtag className="text-gray-500" size={12} />
                    <span className="text-sm font-medium">
                      {userVehicle.vehicleResponse.make}{" "}
                      {userVehicle.vehicleResponse.model}
                    </span>
                  </div>

                  {userVehicle.vehicleResponse.color && (
                    <div className="flex items-center gap-2">
                      <FaPalette className="text-gray-500" size={12} />
                      <span className="text-sm text-gray-600">
                        {userVehicle.vehicleResponse.color}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-500" size={12} />
                    <span className="text-sm text-gray-600">
                      Registrado:{" "}
                      {new Date(
                        userVehicle.vehicleResponse.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  {userVehicle.vehicleResponse.vin && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <span className="text-xs text-gray-500">
                        VIN: {userVehicle.vehicleResponse.vin}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    ID: {userVehicle.vehicleResponse.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaCar className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-2">No tienes vehículos registrados</p>
            <p className="text-sm text-gray-500">
              Contacta al administrador del taller para registrar tu vehículo
            </p>
          </div>
        )}
      </div>

      {/* Service History Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaHistory className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold">Historial de Servicios</h3>
            <span className="text-sm text-gray-500">
              ({getFilteredWorkOrders().length} servicios)
            </span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FaFilter size={12} />
            Filtros
            <FaChevronDown 
              size={12} 
              className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Consulta el historial completo de servicios de tus vehículos con detalles de estado y progreso.
        </p>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por vehículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por vehículo
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="all">Todos los vehículos</option>
                  {userVehicles.map((userVehicle) => (
                    <option key={userVehicle.vehicleResponse.id} value={userVehicle.vehicleResponse.id}>
                      {userVehicle.vehicleResponse.plate} - {userVehicle.vehicleResponse.make} {userVehicle.vehicleResponse.model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del servicio
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="Created">Creado</option>
                  <option value="Pending">Pendiente</option>
                  <option value="Assigned">Asignado</option>
                  <option value="In Progress">En Progreso</option>
                  <option value="Evaluating">En Evaluación</option>
                  <option value="On Hold">En Espera</option>
                  <option value="Completed">Completado</option>
                  <option value="Finished">Finalizado</option>
                  <option value="Cancelled">Cancelado</option>
                  <option value="Rejected">Rechazado</option>
                  <option value="Closed">Cerrado</option>
                  <option value="No Authorized">No Autorizado</option>
                </select>
              </div>

              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar servicio
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar por descripción, placa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Botón limpiar filtros */}
            {(selectedVehicle !== "all" || selectedStatus !== "all" || searchTerm.trim()) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedVehicle("all");
                    setSelectedStatus("all");
                    setSearchTerm("");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Lista de servicios */}
        {servicesLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            <p className="ml-3 text-gray-600">Cargando historial de servicios...</p>
          </div>
        ) : getFilteredWorkOrders().length > 0 ? (
          <div className="space-y-4">
            {getFilteredWorkOrders().map((workOrder) => (
              <div key={workOrder.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <FaWrench className="text-[var(--color-primary)]" size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">
                        Orden #{workOrder.code}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {getMaintenanceTypeDisplayName(workOrder.maintenanceType)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workOrder.status)}`}>
                    {getStatusDisplayName(workOrder.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Vehículo:</strong> {workOrder.plate} - {workOrder.make} {workOrder.model} {workOrder.modelYear}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Color:</strong> {workOrder.color}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Iniciado:</strong> {new Date(workOrder.openedAt).toLocaleString('es-ES')}
                    </p>
                    {workOrder.closedAt && (
                      <p className="text-sm text-gray-600">
                        <strong>Finalizado:</strong> {new Date(workOrder.closedAt).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>

                {workOrder.description && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Descripción:</strong> {workOrder.description}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {workOrder.estimatedHours && (
                      <span>Tiempo estimado: {workOrder.estimatedHours}h</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (window.Swal) {
                          window.Swal.fire({
                            title: `Detalles del Servicio #${workOrder.code}`,
                            html: `
                              <div class="text-left space-y-3">
                                <div class="bg-gray-50 p-3 rounded">
                                  <p><strong>🚗 Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                                  <p><strong>🎨 Color:</strong> ${workOrder.color}</p>
                                  <p><strong>📋 VIN:</strong> ${workOrder.vin || "No registrado"}</p>
                                </div>
                                <div class="bg-blue-50 p-3 rounded">
                                  <p><strong>📅 Iniciado:</strong> ${new Date(workOrder.openedAt).toLocaleString('es-ES')}</p>
                                  ${workOrder.closedAt ? `<p><strong>🏁 Finalizado:</strong> ${new Date(workOrder.closedAt).toLocaleString('es-ES')}</p>` : ''}
                                  <p><strong>⏱️ Tiempo estimado:</strong> ${workOrder.estimatedHours || 'No especificado'}h</p>
                                </div>
                                <div class="bg-green-50 p-3 rounded">
                                  <p><strong>📝 Descripción:</strong> ${workOrder.description || 'Sin descripción'}</p>
                                  <p><strong>👤 Creado por:</strong> ${workOrder.createdBy}</p>
                                </div>
                              </div>
                            `,
                            icon: "info",
                            width: "600px",
                            confirmButtonColor: "#3085d6",
                            confirmButtonText: "Cerrar",
                          });
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50"
                      title="Ver detalles completos"
                    >
                      <FaEye size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-2">
              {searchTerm || selectedVehicle !== "all" || selectedStatus !== "all" 
                ? "No se encontraron servicios con los filtros aplicados" 
                : "No tienes servicios registrados aún"
              }
            </p>
            <p className="text-sm text-gray-500">
              {searchTerm || selectedVehicle !== "all" || selectedStatus !== "all"
                ? "Intenta cambiar o limpiar los filtros para ver más resultados"
                : "Los servicios aparecerán aquí cuando lleves tu vehículo al taller"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}