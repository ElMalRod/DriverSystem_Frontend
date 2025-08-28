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
  FaFileInvoiceDollar,
  FaShoppingCart
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
  updateWorkOrderInfo,
  createWorkAssignment
} from "@/features/work-orders/api";
import { getUsers, User } from "@/features/users/api";
import { getAllProducts, getProductCategories, createQuotation, Product, ProductCategory } from "@/features/quotations/api";

declare global {
  interface Window {
    Swal: any;
  }
}

export default function EmployeePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assignments, setAssignments] = useState<WorkAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [specialists, setSpecialists] = useState<User[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
  
  // Estados para cotizaciones
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Filtros
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(user);
    setLoading(false);

    if (user?.id) {
      loadEmployeeWorkOrders(user.id);
      loadSpecialists();
    }
  }, []);

  async function loadEmployeeWorkOrders(userId: string | number) {
    try {
      console.log("[EMPLOYEE] Loading work orders for employee:", userId);
      setOrdersLoading(true);

      const allAssignments = await getAllWorkAssignments();
      const employeeAssignments = allAssignments.filter(
        assignment => assignment.assigneeId === Number(userId)
      );
      setAssignments(employeeAssignments);

      const allWorkOrders = await getAllWorkOrders();
      
      const employeeWorkOrders = allWorkOrders.filter(wo => 
        employeeAssignments.some(assignment => 
          assignment.workOrderId === wo.id && !assignment.releasedAt
        )
      );

      console.log("[EMPLOYEE] Employee work orders loaded:", employeeWorkOrders);
      setWorkOrders(employeeWorkOrders);

    } catch (err: any) {
      console.error("[EMPLOYEE] Error loading employee work orders:", err);

      if (window.Swal) {
        window.Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las órdenes de trabajo asignadas.",
          timer: 3000,
          showConfirmButton: false,
        });
      }

      setWorkOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }

  function getFilteredWorkOrders() {
    let filtered = [...workOrders];

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
        wo.model?.toLowerCase().includes(term) ||
        wo.code?.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }

  function getStatusColor(status: string) {
    const colors: { [key: string]: string } = {
      'Created': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Assigned': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-green-100 text-green-800',
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
              <p class="text-sm text-gray-500 mt-2">Los registros aparecerán aquí conforme documentes el progreso del trabajo.</p>
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
      console.error('[EMPLOYEE] Error loading work logs:', error);
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

  async function handleStartWork(workOrder: WorkOrder) {
    try {
      if (window.Swal) {
        const result = await window.Swal.fire({
          title: 'Iniciar Trabajo',
          html: `
            <div class="text-left">
              <p class="mb-3"><strong>¿Estás listo para iniciar este trabajo?</strong></p>
              <div class="bg-blue-50 p-3 rounded-lg">
                <p><strong>Orden:</strong> #${workOrder.code}</p>
                <p><strong>Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                <p><strong>Tipo:</strong> ${getMaintenanceTypeDisplayName(workOrder.maintenanceType)}</p>
                <p><strong>Descripción:</strong> ${workOrder.description || 'Sin descripción'}</p>
              </div>
            </div>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Sí, Iniciar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          await updateWorkOrderStatus(workOrder.id, 3, 'Trabajo iniciado por el empleado');
          
          if (currentUser?.id) {
            await loadEmployeeWorkOrders(currentUser.id);
          }

          window.Swal.fire({
            icon: 'success',
            title: '¡Trabajo Iniciado!',
            text: 'El trabajo ha sido marcado como en progreso.',
            confirmButtonColor: '#10B981'
          });
        }
      }
    } catch (error) {
      console.error('Error starting work:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo iniciar el trabajo. Intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  }

  async function handleCompleteWork(workOrder: WorkOrder) {
    try {
      if (window.Swal) {
        const result = await window.Swal.fire({
          title: 'Completar Trabajo',
          html: `
            <div class="text-left">
              <p class="mb-3"><strong>¿Has completado este trabajo?</strong></p>
              <div class="bg-green-50 p-3 rounded-lg">
                <p><strong>Orden:</strong> #${workOrder.code}</p>
                <p><strong>Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                <p><strong>Tipo:</strong> ${getMaintenanceTypeDisplayName(workOrder.maintenanceType)}</p>
              </div>
            </div>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Sí, Completar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          await updateWorkOrderStatus(workOrder.id, 5, 'Trabajo completado por el empleado');
          
          if (currentUser?.id) {
            await loadEmployeeWorkOrders(currentUser.id);
          }

          window.Swal.fire({
            icon: 'success',
            title: '¡Trabajo Completado!',
            text: 'El trabajo ha sido marcado como completado.',
            confirmButtonColor: '#10B981'
          });
        }
      }
    } catch (error) {
      console.error('Error completing work:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo completar el trabajo. Intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  }

  async function handleAddWorkLog(workOrder: WorkOrder) {
    try {
      if (window.Swal) {
        const { value: formValues } = await window.Swal.fire({
          title: `Registrar Trabajo`,
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
              
              <div class="bg-gray-50 p-4 rounded-lg border">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span class="font-medium text-gray-700">Estado Actual:</span>
                </div>
                <div class="ml-5">
                  <p class="font-semibold text-blue-800">${getStatusDisplayName(workOrder.status)}</p>
                  <p class="text-sm text-gray-600">${getStatusDescription(workOrder.status)}</p>
                </div>
              </div>
              
              <div>
                <label for="swal-log-type" class="block text-sm font-medium text-gray-700 mb-2">Tipo de Registro:</label>
                <select id="swal-log-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Seleccionar tipo de registro...</option>
                  <option value="PROGRESS">Progreso - Avance en el trabajo</option>
                  <option value="DIAGNOSIS">Diagnóstico - Evaluación técnica</option>
                  <option value="ISSUE">Problema - Reporte de inconvenientes</option>
                  <option value="NOTE">Nota - Observaciones generales</option>
                </select>
              </div>
              
              <div>
                <label for="swal-note" class="block text-sm font-medium text-gray-700 mb-2">Descripción del trabajo realizado:</label>
                <textarea 
                  id="swal-note" 
                  rows="4" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                  placeholder="Describe detalladamente el trabajo realizado, observaciones técnicas, síntomas detectados, herramientas utilizadas, repuestos cambiados, etc."
                  maxlength="500"
                ></textarea>
                <div class="flex justify-between items-center mt-1">
                  <span class="text-xs text-gray-500">Máximo 500 caracteres</span>
                  <span id="char-counter" class="text-xs text-gray-400">0/500 caracteres</span>
                </div>
              </div>
              
              <div>
                <label for="swal-hours" class="block text-sm font-medium text-gray-700 mb-2">Horas trabajadas:</label>
                <div class="relative">
                  <input 
                    type="number" 
                    id="swal-hours" 
                    min="0" 
                    max="24" 
                    step="0.25" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="0.0"
                  >
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 text-sm">horas</span>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-1">Usa incrementos de 0.25 (15 min), 0.5 (30 min), 0.75 (45 min), etc.</p>
              </div>

              ${workOrder.maintenanceType === 'Preventive' ? `
                <div class="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div class="flex items-start gap-2">
                    <div class="text-amber-600 mt-0.5 font-bold">!</div>
                    <div>
                      <h5 class="font-semibold text-amber-800 mb-1">Mantenimiento Preventivo</h5>
                      <p class="text-sm text-amber-700 mb-2">
                        Este servicio está orientado al mantenimiento programado del vehículo.
                      </p>
                      <p class="text-xs text-amber-600">
                        Si el cliente decide no autorizar este servicio tras la evaluación inicial, 
                        el trabajo se marcará como finalizado y quedarás disponible para otras tareas.
                      </p>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div class="flex items-start gap-2">
                    <div class="w-3 h-3 rounded-full bg-blue-500 mt-1.5"></div>
                    <div>
                      <h5 class="font-semibold text-blue-800 mb-1">Mantenimiento Correctivo</h5>
                      <p class="text-sm text-blue-700">
                        Este servicio está enfocado en reparar fallas detectadas en el vehículo.
                      </p>
                    </div>
                  </div>
                </div>
              `}
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonColor: '#3B82F6',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Guardar Registro',
          cancelButtonText: 'Cancelar',
          width: '650px',
          didOpen: () => {
            const noteTextarea = document.getElementById('swal-note') as HTMLTextAreaElement;
            const charCounter = document.getElementById('char-counter') as HTMLElement;
            
            if (noteTextarea && charCounter) {
              noteTextarea.addEventListener('input', () => {
                const currentLength = noteTextarea.value.length;
                charCounter.textContent = `${currentLength}/500 caracteres`;
                charCounter.className = currentLength > 450 
                  ? 'text-xs text-red-500' 
                  : currentLength > 400 
                    ? 'text-xs text-yellow-600' 
                    : 'text-xs text-gray-400';
              });
            }
          },
          preConfirm: () => {
            const logType = (document.getElementById('swal-log-type') as HTMLSelectElement).value;
            const note = (document.getElementById('swal-note') as HTMLTextAreaElement).value;
            const hours = parseFloat((document.getElementById('swal-hours') as HTMLInputElement).value) || 0;
            
            if (!logType) {
              window.Swal.showValidationMessage('Por favor selecciona un tipo de registro');
              return false;
            }
            
            if (!note.trim()) {
              window.Swal.showValidationMessage('Por favor ingresa una descripción del trabajo realizado');
              return false;
            }

            if (note.trim().length < 10) {
              window.Swal.showValidationMessage('La descripción debe tener al menos 10 caracteres');
              return false;
            }
            
            return { logType, note: note.trim(), hours };
          }
        });

        if (formValues) {
          window.Swal.fire({
            title: 'Guardando registro...',
            html: `
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p class="text-gray-600">Guardando el registro de trabajo</p>
              </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false
          });

          await createWorkLog({
            workOrderId: workOrder.id,
            autorId: Number(currentUser?.id) || 1,
            logType: formValues.logType as any,
            note: formValues.note,
            hours: formValues.hours
          });

          window.Swal.fire({
            icon: 'success',
            title: '¡Registro Guardado!',
            html: `
              <div class="text-left bg-green-50 p-4 rounded-lg">
                <p class="text-green-800 mb-2"><strong>El registro ha sido guardado exitosamente:</strong></p>
                <div class="text-sm space-y-1">
                  <p><span class="font-medium">Tipo:</span> ${getLogTypeDisplayName(formValues.logType)}</p>
                  <p><span class="font-medium">Horas:</span> ${formValues.hours || 0} horas</p>
                  <p><span class="font-medium">Fecha:</span> ${new Date().toLocaleString('es-ES')}</p>
                </div>
              </div>
            `,
            confirmButtonColor: '#10B981',
            confirmButtonText: 'Continuar'
          });
        }
      }
    } catch (error) {
      console.error('Error creating work log:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: 'No se pudo guardar el registro. Verifica tu conexión e intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  }

  function getStatusDescription(status: string) {
    const descriptions: { [key: string]: string } = {
      'Created': 'Orden creada, pendiente de asignación',
      'Assigned': 'Orden asignada a empleados',
      'In Progress': 'Trabajo en progreso',
      'Evaluating': 'En proceso de evaluación',
      'On Hold': 'Trabajo pausado temporalmente',
      'Completed': 'Trabajo completado',
      'Finished': 'Orden finalizada',
      'Cancelled': 'Orden cancelada',
      'Rejected': 'Orden rechazada',
      'Closed': 'Orden cerrada y finalizada',
      'No Authorized': 'No autorizada por el cliente'
    };
    return descriptions[status] || 'Estado desconocido';
  }

  async function handleChangeMaintenanceType(workOrder: WorkOrder) {
    try {
      if (window.Swal) {
        const currentType = workOrder.maintenanceType;
        const newType = currentType === 'Corrective' ? 'Preventive' : 'Corrective';
        
        // Primer modal: Explicación y confirmación
        const confirmResult = await window.Swal.fire({
          title: 'Cambiar Tipo de Mantenimiento',
          html: `
            <div class="text-left space-y-4">
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 class="font-semibold text-blue-900 mb-2">Orden: ${workOrder.code}</h4>
                <div class="space-y-1 text-sm">
                  <p><span class="font-medium">Vehículo:</span> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                  <p><span class="font-medium">Cliente:</span> ${workOrder.customer}</p>
                </div>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-lg border">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span class="font-medium text-gray-700">Tipo Actual:</span>
                </div>
                <div class="ml-5 mb-4">
                  <p class="font-semibold text-gray-800">${currentType === 'Corrective' ? 'Mantenimiento Correctivo' : 'Mantenimiento Preventivo'}</p>
                  <p class="text-sm text-gray-600">${currentType === 'Corrective' ? 'Enfocado en reparar fallas detectadas' : 'Orientado al mantenimiento programado del vehículo'}</p>
                </div>
                
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span class="font-medium text-gray-700">Nuevo Tipo:</span>
                </div>
                <div class="ml-5">
                  <p class="font-semibold text-blue-800">${newType === 'Corrective' ? 'Mantenimiento Correctivo' : 'Mantenimiento Preventivo'}</p>
                  <p class="text-sm text-blue-600">${newType === 'Corrective' ? 'Enfocado en reparar fallas detectadas' : 'Orientado al mantenimiento programado del vehículo. Si luego de la evaluación inicial el cliente decide no autorizar el servicio sugerido, el trabajo se marca como finalizado sin ejecución, y el empleado asignado queda libre para ser reubicado en otra tarea.'}</p>
                </div>
              </div>

              ${newType === 'Preventive' ? `
                <div class="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div class="flex items-start gap-2">
                    <div class="text-amber-600 mt-0.5 font-bold">!</div>
                    <div>
                      <h5 class="font-semibold text-amber-800 mb-2">Importante - Mantenimiento Preventivo:</h5>
                      <p class="text-sm text-amber-700 mb-2">
                        Al cambiar a preventivo, el trabajo requerirá autorización del cliente.
                      </p>
                      <p class="text-xs text-amber-600">
                        Si luego de la evaluación inicial el cliente decide no autorizar el servicio sugerido, 
                        el trabajo se marcará como finalizado sin ejecución, y quedarás disponible para ser 
                        reubicado en otra tarea.
                      </p>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div class="flex items-start gap-2">
                    <div class="text-blue-600 mt-0.5 font-bold">i</div>
                    <div>
                      <h5 class="font-semibold text-blue-800 mb-1">Mantenimiento Correctivo</h5>
                      <p class="text-sm text-blue-700">
                        Enfocado en reparar fallas detectadas y no requiere autorización adicional del cliente.
                      </p>
                    </div>
                  </div>
                </div>
              `}
            </div>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: newType === 'Preventive' ? '#F59E0B' : '#3B82F6',
          cancelButtonColor: '#6B7280',
          confirmButtonText: `Continuar`,
          cancelButtonText: 'Cancelar',
          width: '650px'
        });

        if (!confirmResult.isConfirmed) return;

        // Segundo modal: Solicitar motivo del cambio
        const result = await window.Swal.fire({
          title: 'Motivo del Cambio',
          html: `
            <div class="text-left space-y-4">
              <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p class="text-sm text-blue-800">
                  <strong>Cambiando a:</strong> ${newType === 'Corrective' ? 'Mantenimiento Correctivo' : 'Mantenimiento Preventivo'}
                </p>
              </div>
              
              <div>
                <label for="changeReason" class="block text-sm font-medium text-gray-700 mb-2">
                  Explica el motivo del cambio de tipo de mantenimiento:
                </label>
                <textarea
                  id="changeReason"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="4"
                  placeholder="Describe por qué es necesario cambiar el tipo de mantenimiento..."
                  maxlength="500"
                ></textarea>
                <div class="text-xs text-gray-500 mt-1 text-right">
                  <span id="charCount">0</span>/500 caracteres
                </div>
              </div>
            </div>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: newType === 'Preventive' ? '#F59E0B' : '#3B82F6',
          cancelButtonColor: '#6B7280',
          confirmButtonText: `Cambiar a ${newType === 'Corrective' ? 'Correctivo' : 'Preventivo'}`,
          cancelButtonText: 'Cancelar',
          width: '600px',
          didOpen: () => {
            const textarea = document.getElementById('changeReason');
            const charCount = document.getElementById('charCount');
            
            textarea?.addEventListener('input', (e) => {
              const count = (e.target as HTMLTextAreaElement).value.length;
              if (charCount) charCount.textContent = count.toString();
            });
            
            // Focus en el textarea
            textarea?.focus();
          },
          preConfirm: () => {
            const textarea = document.getElementById('changeReason') as HTMLTextAreaElement;
            const reason = textarea?.value.trim();
            
            if (!reason) {
              window.Swal.showValidationMessage('Debes proporcionar un motivo para el cambio');
              return false;
            }
            
            if (reason.length < 10) {
              window.Swal.showValidationMessage('El motivo debe tener al menos 10 caracteres');
              return false;
            }
            
            return { reason };
          }
        });

        if (result.isConfirmed && result.value?.reason) {
          window.Swal.fire({
            title: 'Cambiando tipo...',
            html: `
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p class="text-gray-600">Actualizando el tipo de mantenimiento</p>
              </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false
          });

          const typeId = newType === 'Preventive' ? 2 : 1;
          const changeReason = result.value.reason;
          
          // 1. Actualizar el tipo de mantenimiento
          await updateWorkOrderInfo({
            id: workOrder.id,
            description: workOrder.description || '',
            estimatedHours: workOrder.estimatedHours || 0,
            typeId: typeId,
            workOrder: workOrder
          });

          // 2. Crear log automático del cambio
          if (currentUser?.id) {
            await createWorkLog({
              workOrderId: workOrder.id,
              autorId: currentUser.id,
              logType: 'PROGRESS',
              note: `CAMBIO DE TIPO DE MANTENIMIENTO
              
De: ${currentType === 'Corrective' ? 'Mantenimiento Correctivo' : 'Mantenimiento Preventivo'}
A: ${newType === 'Corrective' ? 'Mantenimiento Correctivo' : 'Mantenimiento Preventivo'}

MOTIVO: ${changeReason}

${newType === 'Preventive' 
  ? 'NOTA: Este servicio preventivo requerirá autorización del cliente para continuar. Una vez autorizado, el trabajo podrá reanudarse.' 
  : 'NOTA: Este servicio correctivo se enfoca en reparar fallas detectadas y puede continuar sin autorización adicional.'
}`,
              hours: 0
            });
          }

          // 3. Cambiar estado según el tipo
          if (newType === 'Preventive') {
            await updateWorkOrderStatus(workOrder.id, 4, `Servicio preventivo - Requiere autorización del cliente antes de continuar`);
          } else {
            // Si cambia a correctivo, mantener en "In Progress" si estaba activo
            if (workOrder.status === 'In Progress') {
              await updateWorkOrderStatus(workOrder.id, 3, `Servicio correctivo - Continuando con las reparaciones`);
            }
          }

          if (currentUser?.id) {
            await loadEmployeeWorkOrders(currentUser.id);
          }

          window.Swal.fire({
            icon: 'success',
            title: '¡Tipo Cambiado!',
            html: `
              <div class="text-left">
                <p class="text-green-800 mb-3"><strong>El tipo de mantenimiento ha sido cambiado exitosamente:</strong></p>
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p class="text-sm"><strong>Nuevo tipo:</strong> ${newType === 'Corrective' ? 'Mantenimiento Correctivo' : 'Mantenimiento Preventivo'}</p>
                  <p class="text-sm mt-2"><strong>Motivo:</strong> ${changeReason}</p>
                  ${newType === 'Preventive' 
                    ? '<p class="text-sm mt-2 text-amber-700"><strong>Estado:</strong> El trabajo ahora requiere autorización del cliente para continuar.</p>' 
                    : '<p class="text-sm mt-2 text-blue-700"><strong>Estado:</strong> El trabajo puede continuar sin autorización adicional.</p>'
                  }
                </div>
                <div class="bg-blue-50 p-3 rounded-lg mt-3 border border-blue-200">
                  <p class="text-sm text-blue-800"><strong>Registro automático:</strong> Se ha creado un log automático documentando este cambio de tipo.</p>
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
      console.error('Error changing maintenance type:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error al cambiar tipo',
          text: 'No se pudo cambiar el tipo de mantenimiento. Verifica tu conexión e intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  }

  async function loadSpecialists() {
    try {
      setLoadingSpecialists(true);
      const allUsers = await getUsers();
      
      const specialistsData = allUsers.filter(user => 
        user.roleName === "SPECIALIST" || 
        user.roleName === "Specialist" || 
        user.roleName === "Especialista" ||
        user.roleName?.toLowerCase().includes('specialist') ||
        user.roleName?.toLowerCase().includes('especialista')
      );
      
      setSpecialists(specialistsData);
      console.log("[EMPLOYEE] Specialists loaded:", specialistsData);
    } catch (error) {
      console.error("Error loading specialists:", error);
      setSpecialists([]);
    } finally {
      setLoadingSpecialists(false);
    }
  }

  async function loadProducts() {
    try {
      console.log("[DEBUG] Starting to load products...");
      setLoadingProducts(true);
      const [productsData, categoriesData] = await Promise.all([
        getAllProducts(),
        getProductCategories()
      ]);
      
      console.log("[DEBUG] API Response - Products:", productsData);
      console.log("[DEBUG] API Response - Categories:", categoriesData);
      
      setProducts(productsData);
      setProductCategories(categoriesData);
      console.log("[EMPLOYEE] Products loaded:", productsData);
      console.log("[DEBUG] Products state updated, current length:", productsData.length);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
      setProductCategories([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function handleCreateQuotation(workOrder: WorkOrder) {
    try {
      console.log("[DEBUG] Starting quotation creation for work order:", workOrder.id);
      
      let currentProducts = products;
      
      // Cargar productos si no están cargados
      if (products.length === 0) {
        console.log("[DEBUG] Products not loaded, loading now...");
        try {
          const [productsData, categoriesData] = await Promise.all([
            getAllProducts(),
            getProductCategories()
          ]);
          
          console.log("[DEBUG] Fresh API data - Products:", productsData);
          
          // Actualizar el estado
          setProducts(productsData);
          setProductCategories(categoriesData);
          
          // Usar los datos frescos de la API directamente
          currentProducts = productsData;
        } catch (loadError) {
          console.error("[DEBUG] Error loading products in modal:", loadError);
          if (window.Swal) {
            window.Swal.fire({
              icon: 'error',
              title: 'Error de conexión',
              text: 'No se pudieron cargar los productos. Verifica tu conexión e intenta nuevamente.',
              confirmButtonColor: '#EF4444'
            });
          }
          return;
        }
      } else {
        console.log("[DEBUG] Products already loaded:", products.length, "products");
        currentProducts = products;
      }

      // Verificar si tenemos productos después de la carga
      if (!currentProducts || currentProducts.length === 0) {
        console.error("[DEBUG] No products available after loading");
        if (window.Swal) {
          window.Swal.fire({
            icon: 'warning',
            title: 'Sin productos disponibles',
            text: 'No hay productos o servicios disponibles para cotizar. Contacta al administrador.',
            confirmButtonColor: '#EF4444'
          });
        }
        return;
      }

      if (window.Swal) {
        const productsOptions = currentProducts.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} - $${p.price}</option>`).join('');
        console.log("[DEBUG] Generated options for", currentProducts.length, "products");
        console.log("[DEBUG] First few options:", productsOptions.substring(0, 200));
        
        const { value: formValues } = await window.Swal.fire({
          title: 'Crear Cotización',
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
                <label class="block text-sm font-medium text-gray-700 mb-2">Producto/Servicio:</label>
                <select id="swal-product" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Seleccionar producto/servicio...</option>
                  ${productsOptions}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad:</label>
                <input type="number" id="swal-quantity" min="1" value="1" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
              
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">
                  <strong>Nota:</strong> Esta es una cotización básica. El cliente podrá ver el precio estimado y aprobar o rechazar el servicio.
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  Productos disponibles: ${currentProducts.length}
                </p>
              </div>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonColor: '#3B82F6',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Crear Cotización',
          cancelButtonText: 'Cancelar',
          width: '600px',
          preConfirm: () => {
            const productId = parseInt((document.getElementById('swal-product') as HTMLSelectElement).value);
            const quantity = parseInt((document.getElementById('swal-quantity') as HTMLInputElement).value);
            
            if (!productId) {
              window.Swal.showValidationMessage('Por favor selecciona un producto/servicio');
              return false;
            }
            
            if (!quantity || quantity < 1) {
              window.Swal.showValidationMessage('Por favor ingresa una cantidad válida');
              return false;
            }
            
            return { productId, quantity };
          }
        });

        if (formValues) {
          window.Swal.fire({
            title: 'Creando cotización...',
            html: '<div class="text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div><p class="text-gray-600">Generando la cotización para el cliente</p></div>',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false
          });

          // Crear la cotización
          const quotationRequest = {
            workOrderId: workOrder.id,
            approveBy: workOrder.customerId,
            item: [{
              productId: formValues.productId,
              quantity: formValues.quantity
            }]
          };

          await createQuotation(quotationRequest);

          // Crear un log automático
          const selectedProduct = currentProducts.find(p => p.id === formValues.productId);
          await createWorkLog({
            workOrderId: workOrder.id,
            autorId: Number(currentUser?.id) || 1,
            logType: 'PROGRESS' as any,
            note: `COTIZACIÓN GENERADA\\n\\nProducto/Servicio: ${selectedProduct?.name || 'N/A'}\\nCantidad: ${formValues.quantity}\\nPrecio unitario: $${selectedProduct?.price || 0}\\n\\nLa cotización ha sido enviada al cliente para su aprobación.`,
            hours: 0
          });

          window.Swal.fire({
            icon: 'success',
            title: '¡Cotización Creada!',
            html: '<div class="text-left"><p class="text-green-800 mb-3"><strong>La cotización ha sido generada exitosamente.</strong></p><div class="bg-green-50 p-4 rounded-lg border border-green-200"><p class="text-sm">El cliente podrá ver y aprobar/rechazar esta cotización desde su portal.</p></div></div>',
            confirmButtonColor: '#10B981',
            confirmButtonText: 'Entendido'
          });
        }
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error al crear cotización',
          text: 'No se pudo generar la cotización. Verifica tu conexión e intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  }

  async function handleRequestSpecialistSupport(workOrder: WorkOrder) {
    try {
      if (specialists.length === 0) {
        if (window.Swal) {
          window.Swal.fire({
            icon: 'warning',
            title: 'Sin especialistas disponibles',
            text: 'No hay especialistas registrados en el sistema en este momento.',
            confirmButtonColor: '#F59E0B'
          });
        }
        return;
      }

      if (window.Swal) {
        const specialistOptions = specialists.map(specialist => 
          `<option value="${specialist.id}">${specialist.name} - ${specialist.docNumber}</option>`
        ).join('');

        const { value: formValues } = await window.Swal.fire({
          title: 'Solicitar Apoyo de Especialista',
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
                  Especialista a solicitar:
                </label>
                <select id="swal-specialist" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Seleccionar especialista...</option>
                  ${specialistOptions}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la solicitud:
                </label>
                <textarea 
                  id="swal-support-reason" 
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="4"
                  placeholder="Describe el problema técnico o la razón por la cual necesitas apoyo especializado..."
                  maxlength="500"
                ></textarea>
                <div class="text-right mt-1">
                  <span id="char-counter" class="text-xs text-gray-400">0/500 caracteres</span>
                </div>
              </div>
              
              <div class="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <div class="flex items-start gap-2">
                  <div class="text-amber-600 mt-0.5 font-bold">!</div>
                  <div class="text-sm">
                    <p class="font-medium text-amber-800 mb-1">¿Qué va a pasar?</p>
                    <p class="text-amber-700">
                      • El especialista seleccionado será <strong>asignado oficialmente</strong> a este trabajo<br>
                      • Se creará un registro automático documentando la asignación<br>
                      • El especialista podrá ver este trabajo en su interfaz especializada<br>
                      • El trabajo continuará bajo supervisión especializada
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
          confirmButtonText: 'Asignar Especialista',
          cancelButtonText: 'Cancelar',
          width: '650px',
          didOpen: () => {
            const reasonTextarea = document.getElementById('swal-support-reason') as HTMLTextAreaElement;
            const charCounter = document.getElementById('char-counter') as HTMLElement;
            
            if (reasonTextarea && charCounter) {
              reasonTextarea.addEventListener('input', () => {
                const currentLength = reasonTextarea.value.length;
                charCounter.textContent = `${currentLength}/500 caracteres`;
                charCounter.className = currentLength > 450 
                  ? 'text-xs text-red-500' 
                  : currentLength > 400 
                    ? 'text-xs text-yellow-600' 
                    : 'text-xs text-gray-400';
              });
            }
          },
          preConfirm: () => {
            const specialistId = (document.getElementById('swal-specialist') as HTMLSelectElement).value;
            const reason = (document.getElementById('swal-support-reason') as HTMLTextAreaElement).value;
            
            if (!specialistId) {
              window.Swal.showValidationMessage('Por favor selecciona un especialista');
              return false;
            }
            
            if (!reason.trim()) {
              window.Swal.showValidationMessage('Por favor describe el motivo de la solicitud');
              return false;
            }

            if (reason.trim().length < 20) {
              window.Swal.showValidationMessage('El motivo debe tener al menos 20 caracteres');
              return false;
            }
            
            return { specialistId: parseInt(specialistId), reason: reason.trim() };
          }
        });

        if (formValues) {
          window.Swal.fire({
            title: 'Asignando especialista...',
            html: `
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p class="text-gray-600">Asignando especialista al trabajo y registrando la solicitud de apoyo</p>
              </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false
          });

          const selectedSpecialist = specialists.find(s => s.id === formValues.specialistId);

          // Crear un log de trabajo documentando la solicitud de apoyo
          await createWorkLog({
            workOrderId: workOrder.id,
            autorId: Number(currentUser?.id) || 1,
            logType: 'ISSUE' as any,
            note: `SOLICITUD DE APOYO ESPECIALIZADO\n\nEspecialista solicitado: ${selectedSpecialist?.name} (${selectedSpecialist?.docNumber})\n\nMotivo: ${formValues.reason}`,
            hours: 0
          });

          // Crear asignación del especialista al trabajo
          await createWorkAssignment({
            workOrderId: workOrder.id,
            assigneeId: formValues.specialistId,
            role: 3, // Rol de especialista
            assignedAt: new Date().toISOString()
          });

          // Actualizar el estado del trabajo para indicar que requiere apoyo especializado
          await updateWorkOrderStatus(workOrder.id, 4, `Apoyo especializado solicitado - Especialista: ${selectedSpecialist?.name}`);

          if (currentUser?.id) {
            await loadEmployeeWorkOrders(currentUser.id);
          }

          window.Swal.fire({
            icon: 'success',
            title: '¡Especialista Asignado!',
            html: `
              <div class="text-left">
                <p class="text-green-800 mb-3"><strong>El especialista ha sido asignado exitosamente al trabajo.</strong></p>
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p class="text-sm"><strong>Especialista asignado:</strong> ${selectedSpecialist?.name}</p>
                  <p class="text-sm mt-1"><strong>Documento:</strong> ${selectedSpecialist?.docNumber}</p>
                  <p class="text-sm mt-1"><strong>Motivo de la asignación:</strong> ${formValues.reason}</p>
                  <p class="text-sm mt-1"><strong>Estado:</strong> En Espera (esperando apoyo especializado)</p>
                </div>
              </div>
            `,
            confirmButtonColor: '#10B981',
            confirmButtonText: 'Entendido',
            width: '650px'
          });
        }
      }
    } catch (error) {
      console.error('Error requesting specialist support:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error al solicitar apoyo',
          text: 'No se pudo registrar la solicitud de apoyo especializado. Verifica tu conexión e intenta nuevamente.',
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Mis Trabajos Asignados
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona y documenta el progreso de tus trabajos asignados
          </p>
        </div>
      </div>

      {currentUser && (
        <div className="bg-[var(--color-light)] border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FaUser className="text-[var(--color-primary)]" size={20} />
            <div>
              <h3 className="font-semibold">{currentUser.name}</h3>
              <p className="text-sm text-gray-600">{currentUser.email}</p>
              <p className="text-xs text-gray-500">
                Empleado ID: {currentUser.id}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaTools className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold">Órdenes de Trabajo Asignadas</h3>
            <span className="text-sm text-gray-500">
              ({getFilteredWorkOrders().length} trabajos)
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
          Aquí puedes ver y gestionar todos los trabajos que te han sido asignados.
        </p>

        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del trabajo
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="Assigned">Asignado</option>
                  <option value="In Progress">En Progreso</option>
                  <option value="Evaluating">En Evaluación</option>
                  <option value="On Hold">En Espera</option>
                  <option value="Completed">Completado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar trabajo
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar por orden, vehículo, descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {(selectedStatus !== "all" || searchTerm.trim()) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
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

        {ordersLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            <p className="ml-3 text-gray-600">Cargando trabajos asignados...</p>
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
                      <strong>Descripción:</strong> {workOrder.description}
                    </p>
                  </div>
                )}

                {workOrder.maintenanceType === 'Preventive' && 
                 (workOrder.status === 'Evaluating' || workOrder.status === 'No Authorized') && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FaExclamationTriangle className="text-yellow-600 mt-1 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 mb-1">
                          {workOrder.status === 'No Authorized' ? 'Servicio preventivo rechazado por el cliente' : 'Mantenimiento preventivo - Esperando autorización'}
                        </p>
                        <p className="text-xs text-yellow-700">
                          {workOrder.status === 'No Authorized' 
                            ? 'El cliente ha rechazado este servicio preventivo. El trabajo ha sido finalizado y puedes ser reasignado a otra tarea.'
                            : 'Este servicio preventivo requiere la aprobación del cliente antes de continuar. Las opciones de trabajo están temporalmente bloqueadas hasta recibir autorización.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {workOrder.maintenanceType === 'Preventive' && 
                 workOrder.status === 'Assigned' && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FaCogs className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          Mantenimiento Preventivo Asignado
                        </p>
                        <p className="text-xs text-blue-700">
                          Este servicio está orientado al mantenimiento programado del vehículo. Una vez que inicies el trabajo y realices la evaluación inicial, el cliente deberá autorizar el servicio para continuar.
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
                    {workOrder.status === 'Assigned' && (
                      <button
                        onClick={() => handleStartWork(workOrder)}
                        className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 flex items-center gap-1"
                        title="Iniciar trabajo"
                      >
                        <FaPlay size={12} />
                        <span className="text-xs hidden sm:inline">Iniciar</span>
                      </button>
                    )}

                    {workOrder.status === 'In Progress' && (
                      <button
                        onClick={() => handleCompleteWork(workOrder)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 flex items-center gap-1"
                        title="Completar trabajo"
                      >
                        <FaCheckCircle size={14} />
                        <span className="text-xs hidden sm:inline">Completar</span>
                      </button>
                    )}

                    {(workOrder.status === 'In Progress' || workOrder.status === 'Assigned') && (
                      <button
                        onClick={() => handleAddWorkLog(workOrder)}
                        className="text-purple-600 hover:text-purple-800 p-2 rounded-md hover:bg-purple-50 flex items-center gap-1"
                        title="Agregar registro de trabajo"
                      >
                        <FaPlus size={12} />
                        <span className="text-xs hidden sm:inline">Registrar</span>
                      </button>
                    )}

                    {(workOrder.status === 'Evaluating' || workOrder.status === 'No Authorized') && (
                      <button
                        disabled
                        className="text-gray-400 p-2 rounded-md bg-gray-100 flex items-center gap-1 cursor-not-allowed opacity-50"
                        title="Registro bloqueado - Esperando decisión del cliente"
                      >
                        <FaPause size={12} />
                        <span className="text-xs hidden sm:inline">Bloqueado</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleViewWorkLogs(workOrder)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 flex items-center gap-1"
                      title="Ver todos los registros"
                    >
                      <FaClipboardCheck size={14} />
                      <span className="text-xs hidden sm:inline">Ver Registros</span>
                    </button>

                    {(workOrder.status === 'In Progress' || workOrder.status === 'Assigned') && (
                      <button
                        onClick={() => handleCreateQuotation(workOrder)}
                        className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 flex items-center gap-1"
                        title="Crear cotización para el cliente"
                      >
                        <FaFileInvoiceDollar size={12} />
                        <span className="text-xs hidden sm:inline">Cotizar</span>
                      </button>
                    )}

                    {(workOrder.status === 'In Progress' || workOrder.status === 'Assigned') && (
                      <button
                        onClick={() => handleChangeMaintenanceType(workOrder)}
                        className="text-orange-600 hover:text-orange-800 p-2 rounded-md hover:bg-orange-50 flex items-center gap-1"
                        title={`Cambiar a ${workOrder.maintenanceType === 'Corrective' ? 'Preventivo' : 'Correctivo'}`}
                      >
                        <FaCogs size={12} />
                        <span className="text-xs hidden sm:inline">Cambiar Tipo</span>
                      </button>
                    )}

                    {(workOrder.status === 'In Progress' || workOrder.status === 'Assigned') && (
                      <button
                        onClick={() => handleRequestSpecialistSupport(workOrder)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 flex items-center gap-1"
                        title="Solicitar apoyo de especialista"
                        disabled={loadingSpecialists}
                      >
                        <FaWrench size={12} />
                        <span className="text-xs hidden sm:inline">Especialista</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (window.Swal) {
                          window.Swal.fire({
                            title: `Detalles del Trabajo #${workOrder.code}`,
                            html: `
                              <div class="text-left space-y-3">
                                <div class="bg-gray-50 p-3 rounded">
                                  <p><strong>Vehículo:</strong> ${workOrder.plate} - ${workOrder.make} ${workOrder.model}</p>
                                  <p><strong>Cliente:</strong> ${workOrder.customer}</p>
                                  <p><strong>Teléfono:</strong> ${workOrder.phoneCustomer || 'No registrado'}</p>
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
                                ${workOrder.maintenanceType === 'Preventive' ? `
                                  <div class="bg-amber-50 p-3 rounded border border-amber-200">
                                    <p class="text-sm"><strong>Mantenimiento Preventivo:</strong></p>
                                    <p class="text-xs text-amber-700 mt-1">
                                      Este servicio está orientado al mantenimiento programado del vehículo. 
                                      Si el cliente no autoriza el servicio tras la evaluación inicial, 
                                      el trabajo se marca como finalizado y el empleado queda disponible para otras tareas.
                                    </p>
                                  </div>
                                ` : `
                                  <div class="bg-blue-50 p-3 rounded border border-blue-200">
                                    <p class="text-sm"><strong>Mantenimiento Correctivo:</strong></p>
                                    <p class="text-xs text-blue-700 mt-1">
                                      Este servicio está enfocado en reparar fallas detectadas en el vehículo.
                                    </p>
                                  </div>
                                `}
                              </div>
                            `,
                            icon: "info",
                            width: "650px",
                            confirmButtonColor: "#3085d6",
                            confirmButtonText: "Cerrar",
                          });
                        }
                      }}
                      className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-50"
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
            <FaTools className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-2">
              {searchTerm || selectedStatus !== "all" 
                ? "No se encontraron trabajos con los filtros aplicados" 
                : "No tienes trabajos asignados en este momento"
              }
            </p>
            <p className="text-sm text-gray-500">
              {searchTerm || selectedStatus !== "all"
                ? "Intenta cambiar o limpiar los filtros para ver más resultados"
                : "Los trabajos asignados aparecerán aquí cuando el administrador te los asigne"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}