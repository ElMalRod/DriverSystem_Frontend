"use client"

import { useEffect, useState } from "react"
import { 
  FaClipboardList, 
  FaPlus, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaFilter, 
  FaUser, 
  FaCar, 
  FaClock, 
  FaCalendarAlt,
  FaTools,
  FaSearch,
  FaUserTie,
  FaExchangeAlt,
  FaCheck
} from "react-icons/fa"
import { 
  getAllWorkOrders,
  getWorkOrdersByStatus,
  getAllWorkStatus,
  getMaintenanceTypes,
  WorkOrder,
  WorkStatus,
  MaintenanceType
} from "@/features/work-orders/api"
import AssignEmployeeModal from "@/features/work-orders/components/AssignEmployeeModal"
import WorkOrderDetailsModal from "@/features/work-orders/components/WorkOrderDetailsModal"
import ChangeStatusModal from "@/features/work-orders/components/ChangeStatusModal"
import EditWorkOrderModal from "@/features/work-orders/components/EditWorkOrderModal"
import WorkLogsModal from "@/features/work-orders/components/WorkLogsModal"
import AuthorizeWorkModal from "@/features/work-orders/components/AuthorizeWorkModal"
import ReassignWorkModal from "@/features/work-orders/components/ReassignWorkModal"

declare global {
  interface Window {
    Swal: any;
  }
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([])
  const [workStatus, setWorkStatus] = useState<WorkStatus[]>([])
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedType, setSelectedType] = useState("")

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [authorizeModalOpen, setAuthorizeModalOpen] = useState(false)
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterWorkOrders()
  }, [workOrders, searchTerm, selectedStatus, selectedType])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ordersData, statusData, typesData] = await Promise.all([
        getAllWorkOrders(),
        getAllWorkStatus(),
        getMaintenanceTypes()
      ])
      
      setWorkOrders(ordersData)
      setWorkStatus(statusData)
      setMaintenanceTypes(typesData)
    } catch (error) {
      console.error('Error loading data:', error)
      if (window.Swal) {
        window.Swal.fire({
          title: 'Error',
          text: 'Error al cargar las órdenes de trabajo',
          icon: 'error'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const filterWorkOrders = () => {
    let filtered = [...workOrders]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(order => 
        order.code.toLowerCase().includes(term) ||
        order.customer.toLowerCase().includes(term) ||
        order.plate.toLowerCase().includes(term) ||
        order.make.toLowerCase().includes(term) ||
        order.model.toLowerCase().includes(term) ||
        (order.description && order.description.toLowerCase().includes(term))
      )
    }

    if (selectedStatus) {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }

    if (selectedType) {
      filtered = filtered.filter(order => order.maintenanceType === selectedType)
    }

    setFilteredWorkOrders(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Created': return 'bg-blue-100 text-blue-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Assigned': return 'bg-blue-100 text-blue-800'
      case 'In Progress': return 'bg-orange-100 text-orange-800'
      case 'Evaluating': return 'bg-purple-100 text-purple-800'
      case 'On Hold': return 'bg-gray-100 text-gray-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Finished': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      case 'Closed': return 'bg-purple-100 text-purple-800'
      case 'No Authorized': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDisplayName = (status: string) => {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Corrective': return 'bg-red-50 text-red-700 border border-red-200'
      case 'Preventive': return 'bg-blue-50 text-blue-700 border border-blue-200'
      default: return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }

  const getTypeDisplayName = (type: string) => {
    const typeNames: { [key: string]: string } = {
      'Corrective': 'Correctivo',
      'Preventive': 'Preventivo'
    };
    return typeNames[type] || type;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleAssignEmployees = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder)
    setAssignModalOpen(true)
  }

  const handleViewDetails = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder)
    setDetailsModalOpen(true)
  }

  const handleEditWorkOrder = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder)
    setEditModalOpen(true)
  }

  const handleChangeStatus = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder)
    setStatusModalOpen(true)
  }

  const handleViewLogs = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder)
    setLogsModalOpen(true)
  }

  const handleAssignmentUpdated = () => {
    loadData()
  }

  const handleAuthorizeWork = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder)
    setAuthorizeModalOpen(true)
  }

  const handleReassignWork = (workOrder: WorkOrder, assignment: any) => {
    setSelectedWorkOrder(workOrder)
    setSelectedAssignment(assignment)
    setReassignModalOpen(true)
  }

  const handleStatusChanged = (updatedWorkOrder: WorkOrder) => {
    setWorkOrders(prev => 
      prev.map(wo => wo.id === updatedWorkOrder.id ? updatedWorkOrder : wo)
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FaClipboardList className="text-3xl text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Órdenes de Trabajo</h1>
        </div>
        <p className="text-gray-600">Gestión completa de órdenes de trabajo del taller</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, cliente, placa..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
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

          <select
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {maintenanceTypes.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>

          <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <FaPlus />
            Nueva Orden
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas Est.
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Apertura
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.code}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <FaUser className="text-gray-400 mr-2 mt-1 text-sm" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                        <div className="text-sm text-gray-500">{order.docNumberCustomer}</div>
                        <div className="text-sm text-gray-500">{order.phoneCustomer}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <FaCar className="text-gray-400 mr-2 mt-1 text-sm" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.plate}</div>
                        <div className="text-sm text-gray-500">{order.make} {order.model}</div>
                        <div className="text-sm text-gray-500">{order.modelYear} - {order.color}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(order.maintenanceType)}`}>
                      <FaTools className="mr-1" />
                      {getTypeDisplayName(order.maintenanceType)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusDisplayName(order.status)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <FaClock className="text-gray-400 mr-1 text-sm" />
                      {order.estimatedHours ? `${order.estimatedHours}h` : 'N/A'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-gray-400 mr-1 text-sm" />
                      {formatDate(order.openedAt)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewDetails(order)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Ver detalles"
                      >
                        <FaEye />
                      </button>
                      <button 
                        onClick={() => handleAssignEmployees(order)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Asignar empleados"
                      >
                        <FaUserTie />
                      </button>
                      <button 
                        onClick={() => handleEditWorkOrder(order)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="Editar orden"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleChangeStatus(order)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                        title="Cambiar estado"
                      >
                        <FaExchangeAlt />
                      </button>
                      {order.status === "No Authorized" && (
                        <button 
                          onClick={() => handleAuthorizeWork(order)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                          title="Autorizar trabajo"
                        >
                          <FaCheck />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredWorkOrders.length === 0 && (
            <div className="text-center py-12">
              <FaClipboardList className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {workOrders.length === 0 
                  ? "No hay órdenes de trabajo registradas" 
                  : "No se encontraron órdenes que coincidan con los filtros"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedWorkOrder && (
        <AssignEmployeeModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false)
            setSelectedWorkOrder(null)
          }}
          workOrder={{
            id: selectedWorkOrder.id,
            code: selectedWorkOrder.code,
            description: selectedWorkOrder.description,
            customer: selectedWorkOrder.customer,
            plate: selectedWorkOrder.plate,
            make: selectedWorkOrder.make,
            model: selectedWorkOrder.model
          }}
          onAssignmentUpdated={handleAssignmentUpdated}
        />
      )}

      {workOrders.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{workOrders.length}</div>
              <div className="text-sm text-gray-600">Total Órdenes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {workOrders.filter(o => o.status === 'Completed').length}
              </div>
              <div className="text-sm text-gray-600">Completadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {workOrders.filter(o => o.status === 'In Progress').length}
              </div>
              <div className="text-sm text-gray-600">En Progreso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {workOrders.filter(o => o.status === 'Created' || o.status === 'Assigned').length}
              </div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
          </div>
        </div>
      )}

      <WorkOrderDetailsModal 
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        workOrderId={selectedWorkOrder?.id ?? null}
        onEdit={(workOrder) => {
          setDetailsModalOpen(false)
          handleEditWorkOrder(workOrder)
        }}
        onAssign={(workOrder) => {
          setDetailsModalOpen(false)
          handleAssignEmployees(workOrder)
        }}
        onStatusChange={(workOrder) => {
          setDetailsModalOpen(false)
          handleChangeStatus(workOrder)
        }}
        onViewLogs={(workOrder) => {
          setDetailsModalOpen(false)
          handleViewLogs(workOrder)
        }}
      />

      <EditWorkOrderModal 
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        workOrder={selectedWorkOrder}
        onWorkOrderUpdated={(updatedWorkOrder) => {
          setWorkOrders(prev => prev.map(wo => 
            wo.id === updatedWorkOrder.id ? updatedWorkOrder : wo
          ))
          setFilteredWorkOrders(prev => prev.map(wo => 
            wo.id === updatedWorkOrder.id ? updatedWorkOrder : wo
          ))
        }}
      />

      <ChangeStatusModal 
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        workOrder={selectedWorkOrder}
        onStatusChanged={(updatedWorkOrder) => {
          setWorkOrders(prev => prev.map(wo => 
            wo.id === updatedWorkOrder.id ? updatedWorkOrder : wo
          ))
          setFilteredWorkOrders(prev => prev.map(wo => 
            wo.id === updatedWorkOrder.id ? updatedWorkOrder : wo
          ))
        }}
      />

      <WorkLogsModal 
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        workOrder={selectedWorkOrder}
        onLogCreated={(log) => {
          console.log('Log created:', log)
        }}
      />

      <AuthorizeWorkModal 
        isOpen={authorizeModalOpen}
        onClose={() => setAuthorizeModalOpen(false)}
        workOrder={selectedWorkOrder}
        onStatusChanged={handleStatusChanged}
      />

      <ReassignWorkModal 
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        workOrder={selectedWorkOrder}
        currentAssignment={selectedAssignment}
        onReassigned={() => {
          loadData() 
          setReassignModalOpen(false)
        }}
      />
    </div>
  )
}
