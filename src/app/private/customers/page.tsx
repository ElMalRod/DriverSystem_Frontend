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
  FaThumbsDown,
  FaStar
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
          showConfirmButton: false
        });
      }
    } finally {
      setVehiclesLoading(false);
    }
  }

  async function loadServiceHistory(userId: string | number) {
    try {
      console.log("[CUSTOMERS] Loading service history for user:", userId);
      setServicesLoading(true);

      const orders = await getAllWorkOrders();
      console.log("[CUSTOMERS] Work orders loaded:", orders);

      // Filtrar órdenes de trabajo del usuario actual
      const userOrders = orders.filter((order: WorkOrder) =>
        order.customerId === Number(userId)
      );

      setWorkOrders(userOrders);
    } catch (err: any) {
      console.error("[CUSTOMERS] Error loading service history:", err);

      if (window.Swal) {
        window.Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar el historial de servicios. Verifica la conexión.",
          timer: 3000,
          showConfirmButton: false
        });
      }
    } finally {
      setServicesLoading(false);
    }
  }

  async function handleApprovePreventiveService(workOrder: WorkOrder) {
    if (!currentUser?.id) return;

    try {
      if (window.Swal) {
        const result = await window.Swal.fire({
          title: '¿Aprobar Servicio Preventivo?',
          text: `¿Estás seguro de aprobar el servicio preventivo para la orden #${workOrder.code}?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#EF4444',
          confirmButtonText: 'Sí, aprobar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          // Cambiar el estado a IN_PROGRESS (3) para continuar el trabajo
          await updateWorkOrderStatus(workOrder.id, 3);

          // Recargar el historial
          await loadServiceHistory(currentUser.id);

          window.Swal.fire({
            icon: 'success',
            title: 'Servicio Aprobado',
            text: 'El servicio preventivo ha sido aprobado exitosamente.',
            timer: 3000,
            showConfirmButton: false
          });
        }
      }
    } catch (error) {
      console.error('Error approving preventive service:', error);

      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo aprobar el servicio preventivo. Inténtalo de nuevo.',
          timer: 3000,
          showConfirmButton: false
        });
      }
    }
  }

  async function handleRejectPreventiveService(workOrder: WorkOrder) {
    if (!currentUser?.id) return;

    try {
      if (window.Swal) {
        const result = await window.Swal.fire({
          title: '¿Rechazar Servicio Preventivo?',
          text: `¿Estás seguro de rechazar el servicio preventivo para la orden #${workOrder.code}? Esto finalizará la orden sin ejecución.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#EF4444',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Sí, rechazar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          // Cambiar el estado a NO_AUTHORIZED (8) para rechazar
          await updateWorkOrderStatus(workOrder.id, 8);

          // Recargar el historial
          await loadServiceHistory(currentUser.id);

          window.Swal.fire({
            icon: 'success',
            title: 'Servicio Rechazado',
            text: 'El servicio preventivo ha sido rechazado. La orden ha sido finalizada.',
            timer: 3000,
            showConfirmButton: false
          });
        }
      }
    } catch (error) {
      console.error('Error rejecting preventive service:', error);

      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo rechazar el servicio preventivo. Inténtalo de nuevo.',
          timer: 3000,
          showConfirmButton: false
        });
      }
    }
  }

  async function handleFeedback(workOrder: WorkOrder) {
    if (!currentUser?.id) return;

    try {
      if (window.Swal) {
        // Crear el HTML para las estrellas de rating
        const starsHtml = `
          <div class="rating-stars mb-4">
            <p class="text-sm text-gray-700 mb-2">Califica el servicio (1-5 estrellas):</p>
            <div class="flex gap-1 justify-center" id="rating-stars">
              ${[1, 2, 3, 4, 5].map(i => `
                <button type="button" class="star-btn text-2xl text-gray-300 hover:text-yellow-400 transition-colors" data-rating="${i}">
                  ★
                </button>
              `).join('')}
            </div>
            <p class="text-xs text-gray-500 mt-1 text-center" id="rating-text">Selecciona una calificación</p>
          </div>
        `;

        const result = await window.Swal.fire({
          title: `Feedback - Orden #${workOrder.code}`,
          html: `
            ${starsHtml}
            <div class="mt-4">
              <label for="feedback-comment" class="block text-sm text-gray-700 mb-2">
                Comentario (opcional):
              </label>
              <textarea
                id="feedback-comment"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                placeholder="Comparte tu experiencia con este servicio..."
                maxlength="500"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1 text-right" id="char-count">0/500</p>
            </div>
          `,
          width: "500px",
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Enviar Feedback',
          cancelButtonText: 'Cancelar',
          customClass: {
            popup: 'rounded-2xl'
          },
          didOpen: () => {
            // Agregar funcionalidad a las estrellas
            let selectedRating = 0;
            const stars = document.querySelectorAll('.star-btn');
            const ratingText = document.getElementById('rating-text');
            const commentTextarea = document.getElementById('feedback-comment') as HTMLTextAreaElement;
            const charCount = document.getElementById('char-count');

            stars.forEach((star, index) => {
              star.addEventListener('click', () => {
                selectedRating = index + 1;
                // Actualizar visual de estrellas
                stars.forEach((s, i) => {
                  if (i <= index) {
                    s.classList.remove('text-gray-300');
                    s.classList.add('text-yellow-400');
                  } else {
                    s.classList.remove('text-yellow-400');
                    s.classList.add('text-gray-300');
                  }
                });
                // Actualizar texto
                const ratingTexts = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
                ratingText!.textContent = ratingTexts[selectedRating];
              });
            });

            // Contador de caracteres
            commentTextarea?.addEventListener('input', () => {
              const count = commentTextarea.value.length;
              charCount!.textContent = `${count}/500`;
            });
          },
          preConfirm: () => {
            const stars = document.querySelectorAll('.star-btn');
            let selectedRating = 0;
            stars.forEach((star, index) => {
              if (star.classList.contains('text-yellow-400')) {
                selectedRating = index + 1;
              }
            });

            if (selectedRating === 0) {
              window.Swal.showValidationMessage('Por favor selecciona una calificación');
              return false;
            }

            const comment = (document.getElementById('feedback-comment') as HTMLTextAreaElement)?.value || '';

            return {
              rating: selectedRating,
              comment: comment.trim()
            };
          }
        });

        if (result.isConfirmed && result.value) {
          const { rating, comment } = result.value;

          // Enviar feedback a la API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/service/feedback/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              work_order_id: workOrder.id,
              customer_id: currentUser.id,
              rating: rating,
              comment: comment
            })
          });

          if (response.ok) {
            window.Swal.fire({
              icon: 'success',
              title: '¡Gracias por tu feedback!',
              text: 'Tu opinión nos ayuda a mejorar nuestros servicios.',
              timer: 3000,
              showConfirmButton: false
            });
          } else {
            throw new Error('Error al enviar feedback');
          }
        }
      }
    } catch (error) {
      console.error('Error sending feedback:', error);

      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo enviar el feedback. Inténtalo de nuevo.',
          timer: 3000,
          showConfirmButton: false
        });
      }
    }
  }

  function getPendingPreventiveServices(): WorkOrder[] {
    return workOrders.filter(order =>
      order.status === 'PENDING_PREVENTIVE_APPROVAL' ||
      (order.status === 'IN_PROGRESS' && order.description?.toLowerCase().includes('preventivo')) ||
      (order.status === 'On Hold' && order.maintenanceType === 'Preventive')
    );
  }

  // Filtrar órdenes de trabajo
  const filteredWorkOrders = workOrders.filter(order => {
    const matchesVehicle = selectedVehicle === "all" || order.vehicleId === selectedVehicle;
    const matchesStatus = selectedStatus === "all" ||
      order.status === selectedStatus ||
      (selectedStatus === "PENDING_PREVENTIVE_APPROVAL" &&
        (order.status === 'PENDING_PREVENTIVE_APPROVAL' ||
         (order.status === 'IN_PROGRESS' && order.description?.toLowerCase().includes('preventivo')) ||
         (order.status === 'On Hold' && order.maintenanceType === 'Preventive')));
    const matchesSearch = searchTerm === "" ||
      order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.model?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesVehicle && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaUser className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">Usuario no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Cliente
          </h1>
          <p className="text-gray-600">
            Gestiona tus vehículos y servicios
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FaUser className="text-blue-600" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentUser.name || 'Usuario'}
              </h2>
              <p className="text-gray-600">{currentUser.email}</p>
              <p className="text-xs text-gray-500">
                Cliente ID: {currentUser.id}
              </p>
            </div>
          </div>
        </div>

        {/* Preventive Services Notification - SIMPLE */}
        {!servicesLoading && getPendingPreventiveServices().length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-8">
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
              </div>
            </div>
          </div>
        )}

        {/* Vehicles Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-6">
            <FaCar className="text-blue-600 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Mis Vehículos</h3>
          </div>

          {vehiclesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando vehículos...</span>
            </div>
          ) : userVehicles.length === 0 ? (
            <div className="text-center py-8">
              <FaCar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-2">No tienes vehículos registrados</p>
              <p className="text-sm text-gray-500">
                Los vehículos aparecerán aquí cuando los registres en el taller
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userVehicles.map((vehicle) => (
                <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaCar className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {vehicle.vehicleResponse.make} {vehicle.vehicleResponse.model}
                      </h4>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2">
                          <FaHashtag className="text-gray-400" size={12} />
                          <span className="text-sm text-gray-600">{vehicle.vehicleResponse.plate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaPalette className="text-gray-400" size={12} />
                          <span className="text-sm text-gray-600">{vehicle.vehicleResponse.color}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" size={12} />
                          <span className="text-sm text-gray-600">{vehicle.vehicleResponse.createdAt ? new Date(vehicle.vehicleResponse.createdAt).getFullYear() : 'N/A'}</span>
                        </div>
                        {vehicle.vehicleResponse.vin && (
                          <div className="flex items-center gap-2">
                            <FaInfo className="text-gray-400" size={12} />
                            <span className="text-sm text-gray-600 font-mono">{vehicle.vehicleResponse.vin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service History Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FaClipboardList className="text-green-600 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">Historial de Servicios</h3>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <FaFilter size={14} />
              <span className="text-sm">Filtros</span>
              <FaChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} size={12} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehículo
                  </label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los vehículos</option>
                    {userVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleResponse.plate} - {vehicle.vehicleResponse.make} {vehicle.vehicleResponse.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="PENDING">Pendiente</option>
                    <option value="IN_PROGRESS">En Progreso</option>
                    <option value="COMPLETED">Completado</option>
                    <option value="CANCELLED">Cancelado</option>
                    <option value="PENDING_PREVENTIVE_APPROVAL" className="bg-amber-50 text-amber-800 font-semibold">
                      PREVENTIVOS PENDIENTES ({getPendingPreventiveServices().length})
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Buscar por código, descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {servicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando servicios...</span>
            </div>
          ) : filteredWorkOrders.length === 0 ? (
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
          ) : (
            <div className="space-y-4">
              {filteredWorkOrders.map((workOrder) => (
                <div key={workOrder.id} className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
                  (workOrder.status === 'PENDING_PREVENTIVE_APPROVAL' ||
                   (workOrder.status === 'IN_PROGRESS' && workOrder.description?.toLowerCase().includes('preventivo')) ||
                   (workOrder.status === 'On Hold' && workOrder.maintenanceType === 'Preventive'))
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-200'
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {(workOrder.status === 'PENDING_PREVENTIVE_APPROVAL' ||
                          (workOrder.status === 'IN_PROGRESS' && workOrder.description?.toLowerCase().includes('preventivo')) ||
                          (workOrder.status === 'On Hold' && workOrder.maintenanceType === 'Preventive')) ? (
                          <FaExclamationTriangle className="text-amber-600 mr-2" size={16} />
                        ) : (
                          <FaWrench className="text-green-600 mr-2" size={16} />
                        )}
                        <h4 className="font-semibold text-gray-900">
                          Orden #{workOrder.code}
                          {(workOrder.status === 'PENDING_PREVENTIVE_APPROVAL' ||
                            (workOrder.status === 'IN_PROGRESS' && workOrder.description?.toLowerCase().includes('preventivo')) ||
                            (workOrder.status === 'On Hold' && workOrder.maintenanceType === 'Preventive')) && (
                            <span className="ml-2 text-amber-700 font-bold"> PREVENTIVO</span>
                          )}
                        </h4>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          workOrder.status === 'COMPLETED' ? 'bg-green-200 text-green-800' :
                          workOrder.status === 'IN_PROGRESS' ? 'bg-blue-200 text-blue-800' :
                          workOrder.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' :
                          workOrder.status === 'PENDING_PREVENTIVE_APPROVAL' ? 'bg-amber-200 text-amber-800 font-bold' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {workOrder.status === 'COMPLETED' ? 'Completado' :
                           workOrder.status === 'IN_PROGRESS' ? 'En Progreso' :
                           workOrder.status === 'PENDING' ? 'Pendiente' :
                           workOrder.status === 'PENDING_PREVENTIVE_APPROVAL' ? 'Esperando Aprobación' :
                           workOrder.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><span className="font-medium">Vehículo:</span> {workOrder.plate} - {workOrder.make} {workOrder.model}</p>
                          <p><span className="font-medium">Color:</span> {workOrder.color}</p>
                          <p><span className="font-medium">VIN:</span> {workOrder.vin || "No registrado"}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Fecha de Inicio:</span> {new Date(workOrder.openedAt).toLocaleDateString('es-ES')}</p>
                          {workOrder.closedAt && (
                            <p><span className="font-medium">Fecha de Cierre:</span> {new Date(workOrder.closedAt).toLocaleDateString('es-ES')}</p>
                          )}
                          <p><span className="font-medium">Tiempo Estimado:</span> {workOrder.estimatedHours || 'No especificado'}h</p>
                        </div>
                      </div>

                      {workOrder.description && (
                        <div className="mt-3">
                          <p className="font-medium text-sm text-gray-700 mb-1">Descripción:</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{workOrder.description}</p>
                        </div>
                      )}

                      {/* Preventive Service Approval */}
                      {(workOrder.status === 'PENDING_PREVENTIVE_APPROVAL' ||
                        (workOrder.status === 'IN_PROGRESS' && workOrder.description?.toLowerCase().includes('preventivo')) ||
                        (workOrder.status === 'On Hold' && workOrder.maintenanceType === 'Preventive')) && (
                        <PreventiveServiceApproval
                          workOrder={workOrder}
                          onApprove={handleApprovePreventiveService}
                          onReject={handleRejectPreventiveService}
                        />
                      )}

                      {/* Work Logs Button */}
                      <div className="mt-4 border-t pt-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleFeedback(workOrder)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2 text-sm"
                            title="Enviar feedback del servicio"
                          >
                            <FaStar size={14} />
                            Feedback
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                console.log('Cargando registros de trabajo...');
                                const logs = await getWorkLogsByOrder(workOrder.id);
                                console.log('Logs obtenidos:', logs);

                                if (window.Swal) {
                                  const logsHtml = logs.length > 0
                                    ? logs.map(log => {
                                        console.log('Procesando log:', log.note);

                                        // Limpiar el texto de \n y formatear
                                        const cleanNote = log.note.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim();
                                        console.log('Nota limpiada:', cleanNote);

                                        // Arreglar fecha inválida - usar fecha de hoy si no hay fecha
                                        let formattedDate = 'Fecha no disponible';
                                        if (log.logCreatedAt) {
                                          const date = new Date(log.logCreatedAt);
                                          if (!isNaN(date.getTime())) {
                                            formattedDate = date.toLocaleDateString('es-ES', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            });
                                          } else {
                                            // Si es inválida, usar fecha actual
                                            const now = new Date();
                                            formattedDate = now.toLocaleDateString('es-ES', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            });
                                          }
                                        } else {
                                          // Si no hay fecha, usar fecha actual
                                          const now = new Date();
                                          formattedDate = now.toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          });
                                        }

                                        // Determinar el tipo de actividad y icono
                                        let activityType = 'actividad';
                                        let iconClass = 'fas fa-info-circle text-blue-500';
                                        let bgColor = 'bg-blue-50 border-blue-200';

                                        if (cleanNote.includes('COTIZACIÓN GENERADA')) {
                                          activityType = 'cotización';
                                          iconClass = 'fas fa-calculator text-green-500';
                                          bgColor = 'bg-green-50 border-green-200';
                                        } else if (cleanNote.includes('Trabajo iniciado')) {
                                          activityType = 'inicio de trabajo';
                                          iconClass = 'fas fa-play-circle text-blue-500';
                                          bgColor = 'bg-blue-50 border-blue-200';
                                        } else if (cleanNote.includes('CAMBIO DE TIPO')) {
                                          activityType = 'cambio de mantenimiento';
                                          iconClass = 'fas fa-exchange-alt text-orange-500';
                                          bgColor = 'bg-orange-50 border-orange-200';
                                        } else if (cleanNote.includes('Servicio preventivo')) {
                                          activityType = 'servicio preventivo';
                                          iconClass = 'fas fa-shield-alt text-purple-500';
                                          bgColor = 'bg-purple-50 border-purple-200';
                                        } else if (cleanNote.includes('Estado cambiado')) {
                                          activityType = 'actualización de estado';
                                          iconClass = 'fas fa-sync-alt text-gray-500';
                                          bgColor = 'bg-gray-50 border-gray-200';
                                        }

                                        // Simplificar el mensaje para el cliente
                                        let displayMessage = cleanNote;

                                        // Para cotizaciones, mostrar solo productos y precios
                                        if (cleanNote.includes('COTIZACIÓN GENERADA')) {
                                          const lines = cleanNote.split('Producto/Servicio:');
                                          if (lines.length > 1) {
                                            const productInfo = lines[1].split('La cotización')[0].trim();
                                            displayMessage = `Cotización generada: ${productInfo}`;
                                          }
                                        }

                                        // Para cambios de mantenimiento, simplificar
                                        if (cleanNote.includes('CAMBIO DE TIPO')) {
                                          displayMessage = 'Solicitud de cambio a mantenimiento preventivo';
                                        }

                                        const htmlResult = `
                                          <div class="${bgColor} p-4 rounded-lg mb-3 border-l-4 ${bgColor.replace('bg-', 'border-')}">
                                            <div class="flex items-start gap-3">
                                              <div class="flex-shrink-0 mt-1">
                                                <i class="${iconClass}"></i>
                                              </div>
                                              <div class="flex-1 min-w-0">
                                                <div class="flex items-center justify-between mb-2">
                                                  <span class="text-sm font-medium text-gray-900 capitalize">${activityType}</span>
                                                  <span class="text-xs text-gray-500">${formattedDate}</span>
                                                </div>
                                                <p class="text-sm text-gray-700 leading-relaxed">${displayMessage}</p>
                                                ${log.autorId ? `<div class="text-xs text-gray-600 mt-2 flex items-center gap-1">
                                                  <i class="fas fa-user text-gray-400"></i>
                                                  Registrado por el taller
                                                </div>` : ''}
                                              </div>
                                            </div>
                                          </div>
                                        `;

                                        console.log('HTML generado:', htmlResult);
                                        return htmlResult;
                                      }).join('')
                                    : `
                                      <div class="text-center py-8">
                                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                          <i class="fas fa-clipboard-list text-gray-400 text-2xl"></i>
                                        </div>
                                        <p class="text-gray-500 font-medium">No hay registros de trabajo</p>
                                        <p class="text-sm text-gray-400 mt-1">Los registros aparecerán aquí cuando se realice trabajo en tu vehículo</p>
                                      </div>
                                    `;

                                  console.log('HTML final:', logsHtml);

                                  window.Swal.fire({
                                    title: `<i class="fas fa-history text-blue-600 mr-2"></i>Historial de Trabajo - Orden #${workOrder.code}`,
                                    html: `
                                      <div class="max-h-96 overflow-y-auto px-2">
                                        ${logsHtml}
                                      </div>
                                      <div class="mt-4 pt-4 border-t border-gray-200">
                                        <div class="flex items-center justify-center gap-2 text-sm text-gray-600">
                                          <i class="fas fa-info-circle text-blue-500"></i>
                                          <span>Estos son los registros del progreso de tu servicio</span>
                                        </div>
                                      </div>
                                    `,
                                    width: "700px",
                                    confirmButtonColor: "#3B82F6",
                                    confirmButtonText: '<i class="fas fa-check mr-2"></i>Entendido',
                                    customClass: {
                                      popup: 'rounded-2xl',
                                      confirmButton: 'rounded-lg font-medium px-6 py-2.5'
                                    },
                                    showClass: {
                                      popup: 'animate__animated animate__fadeInDown'
                                    },
                                    hideClass: {
                                      popup: 'animate__animated animate__fadeOutUp'
                                    }
                                  });
                                }
                              } catch (error) {
                                console.error('Error loading work logs:', error);
                                if (window.Swal) {
                                  window.Swal.fire({
                                    icon: 'error',
                                    title: '<i class="fas fa-exclamation-triangle mr-2"></i>Error al cargar registros',
                                    html: `
                                      <div class="text-center py-4">
                                        <p class="text-gray-700 mb-2">No se pudieron cargar los registros de trabajo</p>
                                        <p class="text-sm text-gray-500">Por favor intenta nuevamente</p>
                                      </div>
                                    `,
                                    confirmButtonColor: '#EF4444',
                                    confirmButtonText: '<i class="fas fa-redo mr-2"></i>Intentar de nuevo',
                                    customClass: {
                                      popup: 'rounded-2xl'
                                    }
                                  });
                                }
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2 text-sm"
                            title="Ver registros de trabajo"
                          >
                            <FaHistory size={14} />
                            Ver Registros
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preventive Services Info */}
          {!servicesLoading && getPendingPreventiveServices().length === 0 && filteredWorkOrders.length > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Acerca de los Servicios Preventivos</h4>
                  <p className="text-sm text-blue-700">
                    Cuando un empleado solicita cambiar un trabajo a mantenimiento preventivo, aparecerá aquí una notificación
                    destacada pidiendo tu aprobación. Los servicios preventivos requieren autorización antes de ejecutarse
                    porque involucran mantenimientos programados para prevenir fallas futuras.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
