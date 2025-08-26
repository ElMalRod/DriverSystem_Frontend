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
  FaCogs,
  FaExclamationTriangle,
  FaComments,
  FaThumbsUp,
  FaThumbsDown,
  FaPlay,
  FaStop,
  FaPlus,
  FaPause,
  FaMicroscope,
  FaFileAlt,
  FaLightbulb
} from "react-icons/fa";
import { getSessionUser } from "@/utils/session";
import { 
  getAllWorkOrders, 
  WorkOrder, 
  getWorkLogsByOrder, 
  WorkLog, 
  updateWorkOrderStatus,
  createWorkLog,
  getAllWorkAssignments,
  WorkAssignment,
  updateWorkOrderInfo
} from "@/features/work-orders/api";

declare global {
  interface Window {
    Swal: any;
  }
}

export default function SpecialistPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  // Filtros
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(user);
    setLoading(false);

    if (user?.id) {
      loadSpecialistWorkOrders(user.id);
    }
  }, []);

  async function loadSpecialistWorkOrders(userId?: string | number) {
    try {
      const specialistId = userId || currentUser?.id;
      if (!specialistId) return;
      
      console.log("[SPECIALIST] Loading work orders assigned to specialist:", specialistId);
      setOrdersLoading(true);

      // Obtener las asignaciones del especialista actual
      const allAssignments = await getAllWorkAssignments();
      const specialistAssignments = allAssignments.filter(
        assignment => assignment.assigneeId === Number(specialistId) && !assignment.releasedAt
      );

      const allWorkOrders = await getAllWorkOrders();
      
      // Filtrar órdenes de trabajo asignadas al especialista
      const specialistWorkOrders = allWorkOrders.filter(wo => 
        specialistAssignments.some(assignment => 
          assignment.workOrderId === wo.id
        )
      );

      console.log("[SPECIALIST] Specialist work orders loaded:", specialistWorkOrders);
      setWorkOrders(specialistWorkOrders);

    } catch (err: any) {
      console.error("[SPECIALIST] Error loading specialist work orders:", err);

      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error al cargar trabajos',
          text: 'No se pudieron cargar los trabajos asignados. Verifica tu conexión.',
          confirmButtonColor: '#EF4444'
        });
      }
    } finally {
      setOrdersLoading(false);
    }
  }

  function getMaintenanceTypeDisplayName(type: string) {
    switch (type) {
      case 'Corrective': return 'Correctivo';
      case 'Preventive': return 'Preventivo';
      default: return type;
    }
  }

  function getStatusDisplayName(status: string) {
    const statusMap: { [key: string]: string } = {
      'Pending': 'Pendiente',
      'Assigned': 'Asignado',
      'In Progress': 'En Progreso',
      'On Hold': 'En Espera',
      'Evaluating': 'Evaluando',
      'Completed': 'Completado',
      'Specialist Support': 'Apoyo Especializado',
      'Requires Specialist': 'Requiere Especialista',
      'No Authorized': 'No Autorizado'
    };
    return statusMap[status] || status;
  }

  async function handleViewWorkLogs(workOrder: WorkOrder) {
    try {
      const workLogs = await getWorkLogsByOrder(workOrder.id);
      const sortedLogs = workLogs.sort((a, b) => 
        new Date(b.logCreatedAt || 0).getTime() - new Date(a.logCreatedAt || 0).getTime()
      );

      if (window.Swal) {
        const logsHtml = sortedLogs.length > 0 
          ? sortedLogs.map(log => `
              <div class="border-b border-gray-200 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                <div class="flex justify-between items-start mb-2">
                  <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    ${log.logType}
                  </span>
                  <span class="text-xs text-gray-500">
                    ${log.logCreatedAt ? new Date(log.logCreatedAt).toLocaleString('es-ES') : 'Fecha no disponible'}
                  </span>
                </div>
                <p class="text-sm text-gray-800 whitespace-pre-wrap">${log.note}</p>
                ${log.hours > 0 ? `<p class="text-xs text-gray-600 mt-1">Horas trabajadas: ${log.hours}</p>` : ''}
              </div>
            `).join('')
          : '<p class="text-gray-500 text-center py-4">No hay registros de trabajo para esta orden.</p>';

        window.Swal.fire({
          title: `Registros de Trabajo - Orden #${workOrder.code}`,
          html: `
            <div class="text-left max-h-96 overflow-y-auto">
              <div class="bg-blue-50 p-3 rounded-lg mb-4">
                <p class="text-sm"><strong>Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                <p class="text-sm"><strong>Cliente:</strong> ${workOrder.customer}</p>
              </div>
              ${logsHtml}
            </div>
          `,
          confirmButtonColor: '#3B82F6',
          confirmButtonText: 'Cerrar',
          width: '700px'
        });
      }
    } catch (error) {
      console.error('Error loading work logs:', error);
    }
  }

  async function handleProvideSpecialistDiagnosis(workOrder: WorkOrder) {
    try {
      if (window.Swal) {
        const { value: formValues } = await window.Swal.fire({
          title: 'Diagnóstico Técnico Especializado',
          html: `
            <div class="text-left space-y-4">
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 class="font-semibold text-blue-900 mb-2">Orden: ${workOrder.code}</h4>
                <div class="space-y-1 text-sm">
                  <p><span class="font-medium">Vehículo:</span> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                  <p><span class="font-medium">Cliente:</span> ${workOrder.customer}</p>
                  <p><span class="font-medium">Tipo:</span> ${getMaintenanceTypeDisplayName(workOrder.maintenanceType)}</p>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de diagnóstico:
                </label>
                <select id="swal-diagnosis-type" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Seleccionar tipo...</option>
                  <option value="DIAGNOSIS">Diagnóstico inicial</option>
                  <option value="PROGRESS">Avance del análisis</option>
                  <option value="NOTE">Observaciones técnicas</option>
                  <option value="ISSUE">Problema identificado</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico detallado:
                </label>
                <textarea 
                  id="swal-diagnosis-note" 
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="6"
                  placeholder="Describe tu diagnóstico técnico, pruebas realizadas, resultados obtenidos y recomendaciones..."
                  maxlength="1000"
                ></textarea>
                <div class="text-right mt-1">
                  <span id="char-counter" class="text-xs text-gray-400">0/1000 caracteres</span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Horas trabajadas:
                </label>
                <input 
                  type="number" 
                  id="swal-diagnosis-hours"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0" 
                  max="24" 
                  step="0.5"
                  placeholder="0.0"
                />
              </div>
              
              <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                <div class="flex items-start gap-2">
                  <div class="text-green-600 mt-0.5 font-bold">✓</div>
                  <div class="text-sm">
                    <p class="font-medium text-green-800 mb-1">Especialista:</p>
                    <p class="text-green-700">
                      Tu diagnóstico especializado ayudará al equipo a tomar decisiones técnicas informadas. 
                      Incluye detalles sobre sistemas evaluados, herramientas utilizadas y recomendaciones específicas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonColor: '#3B82F6',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Registrar Diagnóstico',
          cancelButtonText: 'Cancelar',
          width: '650px',
          didOpen: () => {
            const noteTextarea = document.getElementById('swal-diagnosis-note') as HTMLTextAreaElement;
            const charCounter = document.getElementById('char-counter') as HTMLElement;
            
            if (noteTextarea && charCounter) {
              noteTextarea.addEventListener('input', () => {
                const currentLength = noteTextarea.value.length;
                charCounter.textContent = `${currentLength}/1000 caracteres`;
                charCounter.className = currentLength > 900 
                  ? 'text-xs text-red-500' 
                  : currentLength > 800 
                    ? 'text-xs text-yellow-600' 
                    : 'text-xs text-gray-400';
              });
            }
          },
          preConfirm: () => {
            const diagnosisType = (document.getElementById('swal-diagnosis-type') as HTMLSelectElement).value;
            const note = (document.getElementById('swal-diagnosis-note') as HTMLTextAreaElement).value;
            const hours = parseFloat((document.getElementById('swal-diagnosis-hours') as HTMLInputElement).value) || 0;
            
            if (!diagnosisType) {
              window.Swal.showValidationMessage('Por favor selecciona un tipo de diagnóstico');
              return false;
            }
            
            if (!note.trim()) {
              window.Swal.showValidationMessage('Por favor ingresa el diagnóstico técnico');
              return false;
            }

            if (note.trim().length < 30) {
              window.Swal.showValidationMessage('El diagnóstico debe tener al menos 30 caracteres');
              return false;
            }
            
            return { diagnosisType, note: note.trim(), hours };
          }
        });

        if (formValues) {
          window.Swal.fire({
            title: 'Registrando diagnóstico...',
            html: `
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p class="text-gray-600">Guardando el diagnóstico técnico</p>
              </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false
          });

          // Crear el log de diagnóstico especializado
          await createWorkLog({
            workOrderId: workOrder.id,
            autorId: Number(currentUser?.id) || 1,
            logType: formValues.diagnosisType as any,
            note: `DIAGNÓSTICO ESPECIALIZADO\n\n${formValues.note}`,
            hours: formValues.hours
          });

          // Recargar los trabajos
          await loadSpecialistWorkOrders(currentUser?.id);

          window.Swal.fire({
            icon: 'success',
            title: '¡Diagnóstico Registrado!',
            html: `
              <div class="text-left">
                <p class="text-green-800 mb-3"><strong>Tu diagnóstico especializado ha sido registrado exitosamente.</strong></p>
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p class="text-sm"><strong>Tipo:</strong> ${formValues.diagnosisType}</p>
                  <p class="text-sm mt-1"><strong>Horas:</strong> ${formValues.hours}h</p>
                  <p class="text-sm mt-1"><strong>Diagnóstico:</strong> ${formValues.note.substring(0, 100)}${formValues.note.length > 100 ? '...' : ''}</p>
                </div>
                <div class="bg-blue-50 p-3 rounded-lg mt-3 border border-blue-200">
                  <p class="text-sm text-blue-800">
                    <strong>El diagnóstico ha sido registrado</strong> y estará disponible para el equipo técnico y administrativo.
                  </p>
                </div>
              </div>
            `,
            confirmButtonColor: '#10B981',
            confirmButtonText: 'Continuar',
            width: '600px'
          });
        }
      }
    } catch (error) {
      console.error('Error providing specialist diagnosis:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error al registrar diagnóstico',
          text: 'No se pudo registrar el diagnóstico. Verifica tu conexión e intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  }

  async function handleCompleteSpecialistWork(workOrder: WorkOrder) {
    try {
      if (window.Swal) {
        const { value: confirmed } = await window.Swal.fire({
          title: '¿Completar Análisis Especializado?',
          html: `
            <div class="text-left">
              <p class="text-gray-800 mb-4">
                ¿Estás seguro de que has completado tu análisis especializado para esta orden de trabajo?
              </p>
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p class="text-sm"><strong>Orden:</strong> ${workOrder.code}</p>
                <p class="text-sm"><strong>Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                <p class="text-sm"><strong>Cliente:</strong> ${workOrder.customer}</p>
              </div>
              <div class="bg-amber-50 p-3 rounded-lg mt-3 border border-amber-200">
                <p class="text-sm text-amber-800">
                  <strong>Al completar:</strong> El trabajo retornará al estado normal para que el empleado pueda continuar 
                  con las recomendaciones y diagnósticos que has proporcionado.
                </p>
              </div>
              <div class="bg-red-50 p-3 rounded-lg mt-3 border border-red-200">
                <p class="text-sm text-red-800">
                  <strong>Importante:</strong> Una vez completado, ya no podrás interactuar con este trabajo. 
                  Asegúrate de haber proporcionado toda la información necesaria.
                </p>
              </div>
            </div>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Sí, Completar Análisis',
          cancelButtonText: 'Cancelar',
          width: '600px'
        });

        if (confirmed) {
          window.Swal.fire({
            title: 'Completando análisis...',
            html: `
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                <p class="text-gray-600">Finalizando el análisis especializado</p>
              </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false
          });

          // 1. Actualizar el estado del trabajo para devolver el control al empleado
          await updateWorkOrderStatus(workOrder.id, 3, 'Análisis especializado completado - Trabajo puede continuar normalmente');

          // 2. Crear un log final
          await createWorkLog({
            workOrderId: workOrder.id,
            autorId: Number(currentUser?.id) || 1,
            logType: 'PROGRESS' as any,
            note: 'ANÁLISIS ESPECIALIZADO COMPLETADO\n\nEl análisis técnico especializado ha sido finalizado. El trabajo puede continuar con las recomendaciones y diagnósticos proporcionados.',
            hours: 0
          });

          // 3. Marcar localmente como completado para ocultar botones
          setWorkOrders(prevOrders => 
            prevOrders.map(wo => 
              wo.id === workOrder.id 
                ? { ...wo, specialistCompleted: true }
                : wo
            )
          );

          window.Swal.fire({
            icon: 'success',
            title: '¡Análisis Completado!',
            html: `
              <div class="text-left">
                <p class="text-green-800 mb-3"><strong>El análisis especializado ha sido completado exitosamente.</strong></p>
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p class="text-sm">El trabajo ha retornado al flujo normal y el empleado puede continuar con las tareas basándose en tus recomendaciones técnicas.</p>
                </div>
                <div class="bg-blue-50 p-3 rounded-lg mt-3 border border-blue-200">
                  <p class="text-sm text-blue-800">
                    <strong>Trabajo finalizado:</strong> Ya no podrás interactuar con este trabajo desde tu interfaz.
                  </p>
                </div>
              </div>
            `,
            confirmButtonColor: '#10B981',
            confirmButtonText: 'Entendido',
            width: '600px'
          });
        }
      }
    } catch (error) {
      console.error('Error completing specialist work:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error al completar análisis',
          text: 'No se pudo completar el análisis especializado. Intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  }

  // Filtrar órdenes de trabajo
  const filteredWorkOrders = workOrders.filter(workOrder => {
    const matchesStatus = selectedStatus === "all" || workOrder.status === selectedStatus;
    const matchesSearch = searchTerm === "" || 
      workOrder.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${workOrder.make} ${workOrder.model}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaMicroscope className="text-blue-600" />
              Panel de Especialista
            </h1>
            <p className="text-gray-600 mt-1">
              Trabajos que requieren tu análisis técnico especializado
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Conectado como: <span className="font-medium">{currentUser?.name}</span>
            </p>
            <p className="text-xs text-gray-500">Rol: Especialista Técnico</p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por cliente, placa, código de orden o vehículo..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FaFilter size={14} />
              Filtros
              <FaChevronDown className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} size={12} />
            </button>
            
            <button
              onClick={() => loadSpecialistWorkOrders(currentUser?.id)}
              disabled={ordersLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FaClipboardList size={14} />
              {ordersLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="Specialist Support">Apoyo Especializado</option>
                  <option value="Requires Specialist">Requiere Especialista</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaWrench className="text-blue-600" size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Casos</p>
              <p className="text-2xl font-bold text-gray-900">{workOrders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FaExclamationTriangle className="text-amber-600" size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Filtrados</p>
              <p className="text-2xl font-bold text-gray-900">{filteredWorkOrders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaMicroscope className="text-green-600" size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Análisis</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredWorkOrders.filter(wo => wo.status === 'Specialist Support').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de órdenes de trabajo */}
      <div className="space-y-4">
        {filteredWorkOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <FaMicroscope className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay trabajos que requieran análisis especializado
            </h3>
            <p className="text-gray-500">
              Los trabajos aparecerán aquí cuando los empleados soliciten tu apoyo técnico.
            </p>
          </div>
        ) : (
          filteredWorkOrders.map((workOrder) => (
            <div key={workOrder.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Orden #{workOrder.code}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        workOrder.status === 'Specialist Support' || workOrder.status === 'Requires Specialist'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusDisplayName(workOrder.status)}
                      </span>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        workOrder.maintenanceType === 'Corrective' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {getMaintenanceTypeDisplayName(workOrder.maintenanceType)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información del vehículo y cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Vehículo:</strong> {workOrder.plate} - {workOrder.make} {workOrder.model} {workOrder.modelYear}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Cliente:</strong> {workOrder.customer}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Asignado:</strong> {new Date(workOrder.openedAt).toLocaleString('es-ES')}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Tiempo estimado:</strong> {workOrder.estimatedHours || 'No especificado'}h
                    </p>
                  </div>
                </div>

                {workOrder.description && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Descripción del trabajo:</strong> {workOrder.description}
                    </p>
                  </div>
                )}

                {/* Mostrar mensaje si ya fue completado por el especialista */}
                {(workOrder as any).specialistCompleted ? (
                  <div className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200">
                    <div className="flex items-start gap-2">
                      <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-medium text-green-800 mb-1">
                          Análisis especializado completado
                        </p>
                        <p className="text-xs text-green-700">
                          Has completado tu análisis técnico para este trabajo. El trabajo ha retornado al flujo normal para que el empleado pueda continuar.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                    <div className="flex items-start gap-2">
                      <FaExclamationTriangle className="text-red-600 mt-1 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-medium text-red-800 mb-1">
                          Requiere análisis técnico especializado
                        </p>
                        <p className="text-xs text-red-700">
                          Este trabajo ha sido derivado para análisis especializado. Revisa los registros previos para comprender el contexto 
                          y proporciona tu diagnóstico técnico profesional.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    ID de Trabajo: {workOrder.id}
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Solo mostrar botones de interacción si no ha sido completado por el especialista */}
                    {!(workOrder as any).specialistCompleted ? (
                      <>
                        <button
                          onClick={() => handleProvideSpecialistDiagnosis(workOrder)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 flex items-center gap-1"
                          title="Proporcionar diagnóstico técnico"
                        >
                          <FaFileAlt size={12} />
                          <span className="text-xs hidden sm:inline">Diagnóstico</span>
                        </button>

                        <button
                          onClick={() => handleCompleteSpecialistWork(workOrder)}
                          className="text-purple-600 hover:text-purple-800 p-2 rounded-md hover:bg-purple-50 flex items-center gap-1"
                          title="Completar análisis especializado"
                        >
                          <FaCheckCircle size={14} />
                          <span className="text-xs hidden sm:inline">Completar</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-green-600 flex items-center gap-1 px-2 py-1 text-xs">
                        <FaCheckCircle size={12} />
                        <span>Análisis Completado</span>
                      </div>
                    )}

                    {/* Siempre mostrar botón de historial */}
                    <button
                      onClick={() => handleViewWorkLogs(workOrder)}
                      className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 flex items-center gap-1"
                      title="Ver historial técnico"
                    >
                      <FaHistory size={12} />
                      <span className="text-xs hidden sm:inline">Historial</span>
                    </button>

                    {/* Siempre mostrar botón de detalles */}
                    <button
                      onClick={() => {
                        if (window.Swal) {
                          window.Swal.fire({
                            title: `Detalles Técnicos - Orden #${workOrder.code}`,
                            html: `
                              <div class="text-left space-y-3">
                                <div class="bg-gray-50 p-3 rounded">
                                  <p><strong>Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                                  <p><strong>Cliente:</strong> ${workOrder.customer}</p>
                                  <p><strong>Teléfono:</strong> ${workOrder.phoneCustomer || 'No registrado'}</p>
                                  <p><strong>VIN:</strong> ${workOrder.vin || 'No disponible'}</p>
                                </div>
                                <div class="bg-blue-50 p-3 rounded">
                                  <p><strong>Asignado:</strong> ${new Date(workOrder.openedAt).toLocaleString('es-ES')}</p>
                                  ${workOrder.closedAt ? `<p><strong>Finalizado:</strong> ${new Date(workOrder.closedAt).toLocaleString('es-ES')}</p>` : ''}
                                  <p><strong>Tiempo estimado:</strong> ${workOrder.estimatedHours || 'No especificado'}h</p>
                                </div>
                                <div class="bg-green-50 p-3 rounded">
                                  <p><strong>Descripción:</strong> ${workOrder.description || 'Sin descripción'}</p>
                                  <p><strong>Tipo:</strong> ${getMaintenanceTypeDisplayName(workOrder.maintenanceType)}</p>
                                </div>
                                <div class="bg-red-50 p-3 rounded border border-red-200">
                                  <p class="text-sm"><strong>Análisis Especializado Requerido:</strong></p>
                                  <p class="text-xs text-red-700 mt-1">
                                    Este trabajo requiere tu intervención técnica especializada. Revisa el historial completo 
                                    para comprender el contexto y las razones de la derivación especializada.
                                  </p>
                                </div>
                              </div>
                            `,
                            confirmButtonColor: '#3B82F6',
                            confirmButtonText: 'Cerrar',
                            width: '600px'
                          });
                        }
                      }}
                      className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-50 flex items-center gap-1"
                      title="Ver detalles completos"
                    >
                      <FaInfo size={12} />
                      <span className="text-xs hidden sm:inline">Detalles</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
