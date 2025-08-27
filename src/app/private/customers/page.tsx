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
  FaWrench,
  FaClipboardCheck,
  FaStickyNote,
  FaSearch as FaDiagnosis,
  FaCogs,
  FaExclamationTriangle,
  FaComments,
  FaThumbsUp,
  FaThumbsDown
} from "react-icons/fa";
import { getSessionUser } from "@/utils/session";
import { getUserVehicles, UserVehicleResponse } from "@/features/vehicles/api";
import { getAllWorkOrders, WorkOrder, getWorkLogsByOrder, WorkLog, updateWorkOrderStatus } from "@/features/work-orders/api";

declare global {
  interface Window {
    Swal: any;
  }
}

// Componente para mostrar la sección de aprobación de servicios preventivos
function PreventiveServiceApproval({ 
  workOrder, 
  onApprove, 
  onReject 
}: { 
  workOrder: WorkOrder;
  onApprove: (workOrder: WorkOrder) => Promise<void>;
  onReject: (workOrder: WorkOrder) => Promise<void>;
}) {
  const [changeReason, setChangeReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadChangeReason() {
      setLoading(true);
      try {
        const logs = await getWorkLogsByOrder(workOrder.id);
        
        // Buscar el log más reciente que contenga "CAMBIO DE TIPO DE MANTENIMIENTO"
        const changeLog = logs
          .filter(log => log.note.includes('CAMBIO DE TIPO DE MANTENIMIENTO'))
          .sort((a, b) => new Date(b.logCreatedAt || '').getTime() - new Date(a.logCreatedAt || '').getTime())[0];
        
        if (changeLog) {
          // Extraer el motivo del log
          const lines = changeLog.note.split('\n');
          const motiveLineIndex = lines.findIndex(line => line.includes('MOTIVO:'));
          if (motiveLineIndex >= 0 && motiveLineIndex < lines.length - 1) {
            const motiveLine = lines[motiveLineIndex];
            const motiveText = motiveLine.replace('MOTIVO:', '').trim();
            setChangeReason(motiveText || 'Sin motivo especificado');
          } else {
            setChangeReason('Sin motivo especificado');
          }
        } else {
          setChangeReason('Sin información disponible');
        }
      } catch (error) {
        console.error('Error getting preventive change reason:', error);
        setChangeReason('Error al obtener el motivo');
      } finally {
        setLoading(false);
      }
    }

    loadChangeReason();
  }, [workOrder.id]);

  return (
    <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <FaExclamationTriangle className="text-amber-600" size={16} />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-800 mb-2">
            Servicio Preventivo - Requiere tu Autorización
          </h4>
          <p className="text-sm text-amber-700 mb-3">
            Un empleado ha solicitado cambiar este trabajo a <strong>mantenimiento preventivo</strong>. 
            Este tipo de servicio requiere tu aprobación antes de continuar.
          </p>
          
          {/* Motivo del empleado */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
            <div className="flex items-start gap-2">
              <FaComments className="text-blue-600 mt-0.5 flex-shrink-0" size={14} />
              <div className="flex-1">
                <p className="text-xs text-blue-800 font-medium mb-1">
                  Motivo del empleado:
                </p>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span className="text-xs text-blue-600">Cargando motivo...</span>
                  </div>
                ) : (
                  <p className="text-xs text-blue-700 italic">
                    "{changeReason}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información resumida */}
          <div className="bg-white p-3 rounded-lg border border-amber-200 mb-4">
            <p className="text-xs text-amber-800 mb-2">
              <strong>¿Qué significa esto?</strong>
            </p>
            <p className="text-xs text-amber-700">
              <strong>Mantenimiento preventivo:</strong> Orientado al mantenimiento programado para prevenir fallas futuras. 
              Si no lo autorizas, se finalizará sin ejecución y el empleado quedará disponible.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onApprove(workOrder)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <FaThumbsUp size={16} />
              Aprobar Servicio
            </button>
            <button
              onClick={() => onReject(workOrder)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <FaThumbsDown size={16} />
              Rechazar Servicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userVehicles, setUserVehicles] = useState<UserVehicleResponse[]>([]);
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

      // Solo cargar work orders que es lo que realmente necesitamos
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

      setWorkOrders([]);
    } finally {
      setServicesLoading(false);
    }
  }

  function getFilteredWorkOrders() {
    let filtered = [...workOrders];

    if (selectedVehicle !== "all") {
      filtered = filtered.filter(wo => wo.vehicleId === selectedVehicle);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(wo => wo.status === selectedStatus);
    }

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

    return filtered.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }

  function getPendingPreventiveServices() {
    const pending = workOrders.filter(wo => 
      wo.maintenanceType === 'Preventive' && (wo.status === 'Evaluating' || wo.status === 'On Hold')
    );
    console.log('[DEBUG] Preventive services:', workOrders.filter(wo => wo.maintenanceType === 'Preventive'));
    console.log('[DEBUG] Pending preventive services:', pending);
    return pending;
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
              <p><strong>Placa:</strong> ${vehicleData.plate}</p>
              <p><strong>Marca:</strong> ${vehicleData.make}</p>
              <p><strong>Modelo:</strong> ${vehicleData.model}</p>
            </div>
            <div class="bg-blue-50 p-3 rounded">
              <p><strong>Color:</strong> ${vehicleData.color || "No especificado"}</p>
              <p><strong>VIN:</strong> ${vehicleData.vin || "No registrado"}</p>
              <p><strong>ID Vehículo:</strong> ${vehicleData.id}</p>
            </div>
            <div class="bg-green-50 p-3 rounded">
              <p><strong>Registrado:</strong> ${new Date(
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

  async function handleViewWorkLogs(workOrder: WorkOrder) {
    try {
      if (window.Swal) {
        window.Swal.fire({
          title: 'Cargando registros...',
          text: 'Por favor espera mientras cargamos los registros de trabajo.',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            window.Swal.showLoading();
          }
        });

        const workLogs = await getWorkLogsByOrder(workOrder.id);
        
        let logsHtml = '';
        if (workLogs && workLogs.length > 0) {
          logsHtml = workLogs.map((log: WorkLog) => {
            const logTypeDisplay = getLogTypeDisplayName(log.logType);
            const logDate = log.logCreatedAt ? new Date(log.logCreatedAt).toLocaleString('es-ES') : 'Fecha no registrada';
            
            return `
              <div class="border-l-4 border-blue-500 bg-gray-50 p-3 mb-3 rounded-r-lg">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-semibold text-sm text-blue-800">${logTypeDisplay}</span>
                  <span class="text-xs text-gray-500">${logDate}</span>
                </div>
                <p class="text-sm text-gray-700 mb-1">${log.note}</p>
                ${log.hours > 0 ? `<p class="text-xs text-gray-500">Tiempo registrado: ${log.hours} horas</p>` : ''}
              </div>
            `;
          }).join('');
        } else {
          logsHtml = `
            <div class="text-center py-6">
              <p class="text-gray-600">No hay registros de trabajo disponibles para esta orden.</p>
              <p class="text-sm text-gray-500 mt-2">Los registros aparecerán aquí conforme el personal del taller trabaje en tu vehículo.</p>
            </div>
          `;
        }

        window.Swal.fire({
          title: `Registros de Trabajo - Orden #${workOrder.code}`,
          html: `
            <div class="text-left">
              <div class="bg-blue-50 p-3 rounded-lg mb-4">
                <p class="text-sm"><strong>Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                <p class="text-sm"><strong>Descripción:</strong> ${workOrder.description || 'Sin descripción'}</p>
                <p class="text-sm"><strong>Estado:</strong> ${getStatusDisplayName(workOrder.status)}</p>
              </div>
              <div style="max-height: 400px; overflow-y: auto;">
                <h4 class="font-semibold mb-3 text-gray-800">Historial de Registros:</h4>
                ${logsHtml}
              </div>
            </div>
          `,
          icon: "info",
          width: "700px",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Cerrar",
          customClass: {
            htmlContainer: 'text-left'
          }
        });
      }
    } catch (error) {
      console.error('[CUSTOMERS] Error loading work logs:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los registros de trabajo. Intenta nuevamente.',
          confirmButtonColor: '#d33'
        });
      }
    }
  }

  function getLogTypeDisplayName(logType: string) {
    const typeNames: { [key: string]: string } = {
      'NOTE': 'Nota',
      'DIAGNOSIS': 'Diagnóstico',
      'PROGRESS': 'Progreso',
      'ISSUE': 'Problema',
      'CUSTOMER_NOTE': 'Nota del Cliente'
    };
    return typeNames[logType] || logType;
  }

  async function handleApprovePreventiveService(workOrder: WorkOrder) {
    try {
      if (window.Swal) {
        const result = await window.Swal.fire({
          title: 'Aprobar Servicio Preventivo',
          html: `
            <div class="text-left">
              <p class="mb-3"><strong>¿Estás seguro que deseas aprobar este servicio preventivo?</strong></p>
              <div class="bg-blue-50 p-3 rounded-lg">
                <p><strong>Orden:</strong> #${workOrder.code}</p>
                <p><strong>Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                <p><strong>Descripción:</strong> ${workOrder.description || 'Sin descripción'}</p>
                <p><strong>Tiempo estimado:</strong> ${workOrder.estimatedHours || 'No especificado'}h</p>
              </div>
            </div>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Sí, Aprobar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          window.Swal.fire({
            title: 'Procesando...',
            text: 'Aprobando el servicio preventivo',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              window.Swal.showLoading();
            }
          });

          await updateWorkOrderStatus(workOrder.id, 3, 'Servicio preventivo aprobado por el cliente - Trabajo reanudado');
          
          if (currentUser?.id) {
            await loadServiceHistory(currentUser.id);
          }

          window.Swal.fire({
            icon: 'success',
            title: '¡Servicio Aprobado!',
            html: `
              <div class="text-left">
                <p class="text-green-800 mb-3"><strong>El servicio preventivo ha sido aprobado exitosamente.</strong></p>
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p class="text-sm"><strong>Estado actual:</strong> En Progreso</p>
                  <p class="text-sm mt-1"><strong>Acción:</strong> El empleado asignado ahora puede continuar con el trabajo</p>
                  <p class="text-sm mt-1 text-gray-600">El servicio preventivo autorizado procederá según lo programado</p>
                </div>
              </div>
            `,
            confirmButtonColor: '#10B981',
            width: '500px'
          });
        }
      }
    } catch (error) {
      console.error('Error approving preventive service:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo aprobar el servicio. Intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  }

  async function handleRejectPreventiveService(workOrder: WorkOrder) {
    try {
      if (window.Swal) {
        const result = await window.Swal.fire({
          title: 'Rechazar Servicio Preventivo',
          html: `
            <div class="text-left">
              <p class="mb-3"><strong>¿Estás seguro que deseas rechazar este servicio preventivo?</strong></p>
              <div class="bg-red-50 p-3 rounded-lg mb-3">
                <p><strong>Orden:</strong> #${workOrder.code}</p>
                <p><strong>Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                <p><strong>Descripción:</strong> ${workOrder.description || 'Sin descripción'}</p>
              </div>
              <p class="text-sm text-gray-600">Al rechazar este servicio, la orden se marcará como finalizada sin ejecución y el empleado asignado quedará disponible para otras tareas.</p>
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#EF4444',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Sí, Rechazar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          window.Swal.fire({
            title: 'Procesando...',
            text: 'Rechazando el servicio preventivo',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              window.Swal.showLoading();
            }
          });

          await updateWorkOrderStatus(workOrder.id, 8, 'Servicio preventivo rechazado por el cliente - Empleado liberado');
          
          if (currentUser?.id) {
            await loadServiceHistory(currentUser.id);
          }

          window.Swal.fire({
            icon: 'info',
            title: 'Servicio Rechazado',
            html: `
              <div class="text-left">
                <p class="text-blue-800 mb-3"><strong>El servicio preventivo ha sido rechazado.</strong></p>
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p class="text-sm"><strong>Estado actual:</strong> No Autorizado</p>
                  <p class="text-sm mt-1"><strong>Acción:</strong> La orden se ha marcado como finalizada sin ejecución</p>
                  <p class="text-sm mt-1 text-gray-600">El empleado asignado ha sido liberado y está disponible para otras tareas</p>
                </div>
              </div>
            `,
            confirmButtonColor: '#3B82F6',
            width: '500px'
          });
        }
      }
    } catch (error) {
      console.error('Error rejecting preventive service:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo rechazar el servicio. Intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
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

      {/* Preventive Services Notification */}
      {!servicesLoading && getPendingPreventiveServices().length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-amber-600" size={24} />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                Servicios Preventivos Pendientes de Aprobación
              </h3>
              <p className="text-amber-700 mb-4">
                Tienes <strong>{getPendingPreventiveServices().length}</strong> servicio{getPendingPreventiveServices().length > 1 ? 's' : ''} preventivo{getPendingPreventiveServices().length > 1 ? 's' : ''} que {getPendingPreventiveServices().length > 1 ? 'requieren' : 'requiere'} tu autorización para continuar.
              </p>
              <div className="space-y-2 mb-4">
                {getPendingPreventiveServices().slice(0, 3).map((service) => (
                  <div key={service.id} className="bg-white p-3 rounded-lg border border-amber-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-amber-800">Orden #{service.code}</h4>
                        <p className="text-sm text-amber-700">{service.plate} - {service.make} {service.model}</p>
                        <p className="text-xs text-amber-600 mt-1">{service.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
                          Esperando Aprobación
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {getPendingPreventiveServices().length > 3 && (
                  <p className="text-sm text-amber-600 text-center mt-2">
                    ... y {getPendingPreventiveServices().length - 3} más
                  </p>
                )}
              </div>
              <div className="bg-amber-100 p-4 rounded-lg border border-amber-200">
                <h5 className="font-medium text-amber-800 mb-2">¿Qué son los servicios preventivos?</h5>
                <p className="text-sm text-amber-700 mb-2">
                  <strong>Mantenimiento Preventivo:</strong> Orientado al mantenimiento programado del vehículo para prevenir fallas futuras.
                </p>
                <p className="text-xs text-amber-600">
                  Si luego de la evaluación inicial decides no autorizar el servicio sugerido, 
                  el trabajo se marcará como finalizado sin ejecución, y el empleado asignado 
                  quedará libre para ser reubicado en otra tarea.
                </p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-amber-700">
                  <strong>Los servicios aparecen destacados abajo</strong> con botones grandes para aprobar/rechazar.
                </p>
                <button
                  onClick={() => {
                    const element = document.querySelector('[data-preventive-services]');
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Ver Servicios ↓
                </button>
              </div>
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
      <div className="bg-white border border-gray-200 rounded-lg p-6" data-preventive-services>
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

                {workOrder.maintenanceType === 'Preventive' && 
                 (workOrder.status === 'Evaluating' || workOrder.status === 'On Hold') && (
                  <PreventiveServiceApproval 
                    workOrder={workOrder} 
                    onApprove={handleApprovePreventiveService}
                    onReject={handleRejectPreventiveService}
                  />
                )}

                {workOrder.maintenanceType === 'Preventive' && 
                 workOrder.status === 'Assigned' && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FaCogs className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          Servicio Preventivo Asignado
                        </p>
                        <p className="text-xs text-blue-700">
                          Este servicio está orientado al mantenimiento programado del vehículo. Una vez iniciado por el empleado, podrá requerir tu autorización para continuar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {workOrder.estimatedHours && (
                      <span>Tiempo estimado: {workOrder.estimatedHours}h</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {workOrder.maintenanceType === 'Preventive' && 
                     workOrder.status === 'Assigned' && (
                      <>
                        <button
                          onClick={() => handleApprovePreventiveService(workOrder)}
                          className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 flex items-center gap-1"
                          title="Aprobar servicio preventivo"
                        >
                          <FaThumbsUp size={14} />
                          <span className="text-xs hidden sm:inline">Aprobar</span>
                        </button>
                        <button
                          onClick={() => handleRejectPreventiveService(workOrder)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 flex items-center gap-1"
                          title="Rechazar servicio preventivo"
                        >
                          <FaThumbsDown size={14} />
                          <span className="text-xs hidden sm:inline">Rechazar</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewWorkLogs(workOrder)}
                      className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 flex items-center gap-1"
                      title="Ver registros de trabajo"
                    >
                      <FaClipboardCheck size={14} />
                      <span className="text-xs hidden sm:inline">Registros</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.Swal) {
                          window.Swal.fire({
                            title: `Detalles del Servicio #${workOrder.code}`,
                            html: `
                              <div class="text-left space-y-3">
                                <div class="bg-gray-50 p-3 rounded">
                                  <p><strong>Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                                  <p><strong>Color:</strong> ${workOrder.color}</p>
                                  <p><strong>VIN:</strong> ${workOrder.vin || "No registrado"}</p>
                                </div>
                                <div class="bg-blue-50 p-3 rounded">
                                  <p><strong>Iniciado:</strong> ${new Date(workOrder.openedAt).toLocaleString('es-ES')}</p>
                                  ${workOrder.closedAt ? `<p><strong>Finalizado:</strong> ${new Date(workOrder.closedAt).toLocaleString('es-ES')}</p>` : ''}
                                  <p><strong>Tiempo estimado:</strong> ${workOrder.estimatedHours || 'No especificado'}h</p>
                                </div>
                                <div class="bg-green-50 p-3 rounded">
                                  <p><strong>Descripción:</strong> ${workOrder.description || 'Sin descripción'}</p>
                                  <p><strong>Creado por:</strong> ${workOrder.createdBy}</p>
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