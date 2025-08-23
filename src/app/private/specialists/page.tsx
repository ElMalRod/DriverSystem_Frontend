"use client"

import { useEffect, useState } from "react"
import { 
  FaUserTie, 
  FaPlus, 
  FaEye, 
  FaEdit, 
  FaToggleOff, 
  FaToggleOn,
  FaSearch,
  FaFilter,
  FaPhone,
  FaEnvelope,
  FaCertificate,
  FaCalendarAlt,
  FaTools,
  FaCog
} from "react-icons/fa"
import { 
  getUsers, 
  getRoles, 
  createUser,
  updateUserData,
  updateUserState,
  assignUserRole,
  User,
  Role,
  CreateUserRequest,
  UpdateUserRequest 
} from "@/features/users/api"

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

// Especialidades disponibles
const SPECIALTIES = [
  { value: 'ELECTRICAL', label: 'Electricista Automotriz' },
  { value: 'AC', label: 'Aire Acondicionado' },
  { value: 'TRANSMISSION', label: 'Transmisiones' },
  { value: 'BRAKES', label: 'Sistema de Frenos' },
  { value: 'ELECTRONICS', label: 'Electrónica Automotriz' },
  { value: 'ENGINE', label: 'Motor' },
  { value: 'SUSPENSION', label: 'Suspensión' },
  { value: 'BODYWORK', label: 'Carrocería' }
]

export default function SpecialistsPage() {
  const [specialists, setSpecialists] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Estado para manejar especialidades desde el frontend
  const [specialistDetails, setSpecialistDetails] = useState<{[key: string]: {
    specialty: string,
    hourlyRate: number,
    experience: number,
    certifications: string
  }}>({})
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("")
  
  // Modals
  const [showCreateSpecialist, setShowCreateSpecialist] = useState(false)
  const [showEditSpecialist, setShowEditSpecialist] = useState(false)
  const [selectedSpecialist, setSelectedSpecialist] = useState<User | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    id: 0,
    email: "",
    userName: "",
    docNumber: "",
    phoneNumber: "",
    passwordHash: "",
    userType: "PERSON",
    name: "",
    role: 0,
    docType: "DPI",
    password: "",
    specialty: "",
    hourlyRate: 0,
    experience: 0,
    certifications: ""
  })

  useEffect(() => {
    loadData()
    loadSpecialistDetails()
  }, [])

  // Cargar detalles de especialistas desde localStorage
  function loadSpecialistDetails() {
    try {
      const saved = localStorage.getItem('specialistDetails')
      if (saved) {
        setSpecialistDetails(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading specialist details:', error)
    }
  }

  // Guardar detalles de especialistas en localStorage
  function saveSpecialistDetails(details: typeof specialistDetails) {
    try {
      localStorage.setItem('specialistDetails', JSON.stringify(details))
      setSpecialistDetails(details)
    } catch (error) {
      console.error('Error saving specialist details:', error)
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      setError("")
      
      const [usersData, rolesData] = await Promise.all([
        getUsers(),
        getRoles()
      ])
      
      setAllUsers(usersData)
      setRoles(rolesData)
      
      // Filtrar solo especialistas - ser más flexible con los nombres de roles
      const specialistsData = usersData.filter(user => 
        user.roleName === "SPECIALIST" || 
        user.roleName === "Specialist" || 
        user.roleName === "Especialista" ||
        user.roleName?.toLowerCase().includes('specialist') ||
        user.roleName?.toLowerCase().includes('especialista')
      )
      setSpecialists(specialistsData)
      
      // Migrar claves temporales a claves reales con IDs
      const updatedDetails = { ...specialistDetails }
      let hasUpdates = false
      
      specialistsData.forEach(specialist => {
        const tempKey = `temp_${specialist.email}`
        if (updatedDetails[tempKey] && !updatedDetails[specialist.id.toString()]) {
          updatedDetails[specialist.id.toString()] = updatedDetails[tempKey]
          delete updatedDetails[tempKey]
          hasUpdates = true
        }
      })
      
      if (hasUpdates) {
        saveSpecialistDetails(updatedDetails)
      }
      
      // Debug: mostrar todos los usuarios y sus roles para debugging
      console.log('[SPECIALISTS] All users:', usersData.map(u => ({ id: u.id, name: u.name, roleName: u.roleName })))
      console.log('[SPECIALISTS] All roles:', rolesData)
      console.log('[SPECIALISTS] Filtered specialists:', specialistsData)
      
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSpecialist(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Campos requeridos',
          text: 'Por favor complete todos los campos obligatorios'
        })
      }
      return
    }

    try {
      setLoading(true)
      
      // Buscar el rol de especialista
      const specialistRole = roles.find(role => role.code === "SPECIALIST")
      if (!specialistRole) {
        throw new Error("Rol de especialista no encontrado")
      }

      // Crear el usuario
      const newUserData: CreateUserRequest = {
        email: formData.email,
        userName: formData.userName || formData.email,
        docNumber: formData.docNumber,
        phoneNumber: formData.phoneNumber,
        passwordHash: formData.password, // El backend manejará el hash
        userType: formData.userType,
        name: formData.name,
        role: specialistRole.id,
        docType: formData.docType
      }

      await createUser(newUserData)
      
      // Guardar detalles del especialista en localStorage
      const updatedDetails = {
        ...specialistDetails,
        // Usamos el email como clave temporal hasta obtener el ID real
        [`temp_${formData.email}`]: {
          specialty: formData.specialty,
          hourlyRate: formData.hourlyRate,
          experience: formData.experience,
          certifications: formData.certifications
        }
      }
      saveSpecialistDetails(updatedDetails)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Especialista Creado!',
          text: `Especialista ${formData.name} registrado exitosamente`,
          timer: 2000,
          showConfirmButton: false
        })
      }

      // Recargar datos y cerrar modal
      await loadData()
      resetForm()
      setShowCreateSpecialist(false)
      
    } catch (err: any) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al crear especialista'
        })
      }
      console.error('Error creating specialist:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleEditSpecialist(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedSpecialist || !formData.name.trim()) {
      return
    }

    try {
      setLoading(true)

      const updateData: UpdateUserRequest = {
        id: selectedSpecialist.id,
        email: formData.email,
        userName: formData.userName,
        docNumber: formData.docNumber,
        phoneNumber: formData.phoneNumber,
        passwordHash: formData.password || selectedSpecialist.userName, // Si no se cambió la contraseña
        userType: formData.userType,
        name: formData.name,
        role: formData.role,
        docType: formData.docType
      }

      await updateUserData(updateData)
      
      // Guardar detalles del especialista en localStorage
      const updatedDetails = {
        ...specialistDetails,
        [selectedSpecialist.id.toString()]: {
          specialty: formData.specialty,
          hourlyRate: formData.hourlyRate,
          experience: formData.experience,
          certifications: formData.certifications
        }
      }
      saveSpecialistDetails(updatedDetails)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Especialista Actualizado!',
          text: `Datos de ${formData.name} actualizados correctamente`,
          timer: 2000,
          showConfirmButton: false
        })
      }

      await loadData()
      resetForm()
      setShowEditSpecialist(false)
      setSelectedSpecialist(null)
      
    } catch (err: any) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al actualizar especialista'
        })
      }
      console.error('Error updating specialist:', err)
    } finally {
      setLoading(false)
    }
  }

  function openEditModal(specialist: User) {
    setSelectedSpecialist(specialist)
    
    // Cargar detalles desde localStorage
    const detailsKey = specialist.id.toString()
    const tempKey = `temp_${specialist.email}`
    const details = specialistDetails[detailsKey] || specialistDetails[tempKey]
    
    setFormData({
      id: specialist.id,
      email: specialist.email,
      userName: specialist.userName,
      docNumber: specialist.docNumber,
      phoneNumber: specialist.phoneNumber,
      passwordHash: "",
      userType: specialist.userType,
      name: specialist.name,
      role: roles.find(r => r.name === specialist.roleName)?.id || 0,
      docType: specialist.docType,
      password: "",
      specialty: details?.specialty || "",
      hourlyRate: details?.hourlyRate || 0,
      experience: details?.experience || 0,
      certifications: details?.certifications || ""
    })
    setShowEditSpecialist(true)
  }

  async function handleToggleSpecialistState(specialist: User) {
    if (!window.Swal) return
    
    const action = specialist.is_active ? 'desactivar' : 'activar'
    const result = await window.Swal.fire({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} especialista?`,
      text: `¿Está seguro que desea ${action} a ${specialist.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelButtonText: 'Cancelar',
      confirmButtonColor: specialist.is_active ? '#d33' : '#3085d6'
    })

    if (result.isConfirmed) {
      try {
        await updateUserState(specialist.id, !specialist.is_active)
        await loadData()
        
        window.Swal.fire({
          icon: 'success',
          title: '¡Estado actualizado!',
          text: `Especialista ${action}do correctamente`,
          timer: 2000,
          showConfirmButton: false
        })
      } catch (err: any) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || `Error al ${action} especialista`
        })
      }
    }
  }

  async function handleViewSpecialistDetails(specialist: User) {
    if (!window.Swal) return

    // Obtener datos del especialista desde localStorage
    const detailsKey = specialist.id.toString()
    const tempKey = `temp_${specialist.email}`
    const details = specialistDetails[detailsKey] || specialistDetails[tempKey]
    
    // Datos por defecto si no se encuentran
    const experience = details?.experience || 0
    const specialty = SPECIALTIES.find(s => s.value === details?.specialty) || SPECIALTIES[0]
    const hourlyRate = details?.hourlyRate || 0
    const certifications = details?.certifications || "No especificadas"
    
    window.Swal.fire({
      title: `Perfil de ${specialist.name}`,
      html: `
        <div class="text-left space-y-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <h4 class="font-semibold mb-2 flex items-center gap-2">
              Información General
            </h4>
            <p><strong>Email:</strong> ${specialist.email}</p>
            <p><strong>Teléfono:</strong> ${specialist.phoneNumber}</p>
            <p><strong>Documento:</strong> ${specialist.docType}: ${specialist.docNumber}</p>
          </div>
          
          <div class="bg-green-50 p-4 rounded-lg">
            <h4 class="font-semibold mb-2 flex items-center gap-2">
              Especialización
            </h4>
            <p><strong>Área:</strong> ${specialty.label}</p>
            <p><strong>Experiencia:</strong> ${experience} años</p>
            <p><strong>Tarifa por hora:</strong> Q${hourlyRate}.00</p>
            <p><strong>Certificaciones:</strong> ${certifications}</p>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg">
            <h4 class="font-semibold mb-2 flex items-center gap-2">
              Estado
            </h4>
            <p><strong>Estado:</strong> <span class="${specialist.is_active ? 'text-green-600' : 'text-red-600'}">${specialist.is_active ? 'Activo' : 'Inactivo'}</span></p>
            <p><strong>Registrado:</strong> ${new Date(specialist.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      `,
      width: '500px',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6'
    })
  }

  function resetForm() {
    setFormData({
      id: 0,
      email: "",
      userName: "",
      docNumber: "",
      phoneNumber: "",
      passwordHash: "",
      userType: "PERSON",
      name: "",
      role: 0,
      docType: "DPI",
      password: "",
      specialty: "",
      hourlyRate: 0,
      experience: 0,
      certifications: ""
    })
  }

  function closeModals() {
    setShowCreateSpecialist(false)
    setShowEditSpecialist(false)
    setSelectedSpecialist(null)
    resetForm()
  }

  // Filter specialists
  const filteredSpecialists = specialists.filter(specialist => {
    const matchesSearch = searchTerm === "" || 
      specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialist.phoneNumber.includes(searchTerm)

    const matchesStatus = statusFilter === "" || 
      (statusFilter === "active" && specialist.is_active) ||
      (statusFilter === "inactive" && !specialist.is_active)

    // Filtro por especialidad usando localStorage
    const matchesSpecialty = specialtyFilter === "" || (() => {
      const detailsKey = specialist.id.toString()
      const tempKey = `temp_${specialist.email}`
      const details = specialistDetails[detailsKey] || specialistDetails[tempKey]
      return details && details.specialty === specialtyFilter
    })()

    return matchesSearch && matchesStatus && matchesSpecialty
  })

  const docTypeOptions = [
    { value: 'DPI', label: 'DPI' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'LICENCIA', label: 'Licencia' },
    { value: 'NIT', label: 'NIT' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Gestión de Especialistas Externos
          </h1>
          <p className="text-gray-600 mt-2">
            Administra especialistas externos como electricistas, técnicos y otros profesionales
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateSpecialist(true)}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaPlus size={14} />
            Nuevo Especialista
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Especialistas</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">{specialists.length}</p>
            </div>
            <FaUserTie className="text-[var(--color-primary)] opacity-70" size={24} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">{specialists.filter(s => s.is_active).length}</p>
            </div>
            <FaToggleOn className="text-green-600 opacity-70" size={24} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-red-600">{specialists.filter(s => !s.is_active).length}</p>
            </div>
            <FaToggleOff className="text-red-600 opacity-70" size={24} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Especialidades</p>
              <p className="text-2xl font-bold text-blue-600">{SPECIALTIES.length}</p>
            </div>
            <FaTools className="text-blue-600 opacity-70" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="active">Solo activos</option>
            <option value="inactive">Solo inactivos</option>
          </select>

          {/* Specialty Filter */}
          <select
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
          >
            <option value="">Todas las especialidades</option>
            {SPECIALTIES.map(specialty => (
              <option key={specialty.value} value={specialty.value}>
                {specialty.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Specialists Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando especialistas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadData}
              className="mt-2 text-[var(--color-primary)] hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialista
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSpecialists.map((specialist) => (
                  <tr key={specialist.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                            <FaUserTie className="text-white" size={16} />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{specialist.name}</div>
                          <div className="text-sm text-gray-500">ID: {specialist.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-2">
                        <FaEnvelope className="text-gray-400" size={12} />
                        {specialist.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <FaPhone className="text-gray-400" size={12} />
                        {specialist.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(() => {
                        const detailsKey = specialist.id.toString()
                        const tempKey = `temp_${specialist.email}`
                        const details = specialistDetails[detailsKey] || specialistDetails[tempKey]
                        const specialty = SPECIALTIES.find(s => s.value === details?.specialty)
                        return specialty ? (
                          <div className="flex items-center gap-2">
                            <FaTools className="text-blue-500" size={12} />
                            <span className="text-sm font-medium text-blue-600">{specialty.label}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No especificada</span>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {specialist.docType}: {specialist.docNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        specialist.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {specialist.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" size={12} />
                        {new Date(specialist.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewSpecialistDetails(specialist)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <FaEye />
                        </button>
                        <button 
                          onClick={() => openEditModal(specialist)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleToggleSpecialistState(specialist)}
                          className={`p-1 rounded ${
                            specialist.is_active 
                              ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                              : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                          }`}
                          title={specialist.is_active ? "Desactivar" : "Activar"}
                        >
                          {specialist.is_active ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSpecialists.length === 0 && (
              <div className="text-center py-12">
                <FaUserTie className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">
                  {specialists.length === 0 
                    ? "No hay especialistas registrados" 
                    : "No se encontraron especialistas que coincidan con los filtros"
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Specialist Modal */}
      {showCreateSpecialist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Registrar Nuevo Especialista</h3>
            
            <form onSubmit={handleCreateSpecialist} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value, userName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Teléfono *</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo de documento</label>
                <select
                  value={formData.docType}
                  onChange={(e) => setFormData(prev => ({ ...prev, docType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                >
                  {docTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Número de documento</label>
                <input
                  type="text"
                  value={formData.docNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, docNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Especialidad</label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="">Seleccionar especialidad...</option>
                  {SPECIALTIES.map(specialty => (
                    <option key={specialty.value} value={specialty.value}>
                      {specialty.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Años de experiencia</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tarifa por hora (Q)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Contraseña *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Certificaciones (opcional)</label>
                <textarea
                  value={formData.certifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  rows={3}
                  placeholder="Ej: Certificación ASE, Curso de diagnóstico automotriz..."
                />
              </div>

              <div className="md:col-span-2 flex gap-3 justify-end pt-6 border-t">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar Especialista"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Specialist Modal */}
      {showEditSpecialist && selectedSpecialist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Editar Especialista - {selectedSpecialist.name}
            </h3>
            
            <form onSubmit={handleEditSpecialist} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Teléfono *</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo de documento</label>
                <select
                  value={formData.docType}
                  onChange={(e) => setFormData(prev => ({ ...prev, docType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                >
                  {docTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Número de documento</label>
                <input
                  type="text"
                  value={formData.docNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, docNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="">Seleccionar rol...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} ({role.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Nueva contraseña (opcional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="Dejar vacío para mantener la contraseña actual"
                />
              </div>

              <div className="md:col-span-2 flex gap-3 justify-end pt-6 border-t">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Actualizando..." : "Actualizar Especialista"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
