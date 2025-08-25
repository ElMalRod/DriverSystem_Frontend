"use client"

import { useEffect, useState } from "react"
import { FaUser, FaPlus, FaEdit, FaToggleOn, FaToggleOff, FaSearch, FaLock,FaShieldAlt } from "react-icons/fa"
import { getUsers, getRoles, createUser, updateUserData, updateUserState, updateUserMfaState, User, Role, CreateUserRequest, UpdateUserRequest, } from "@/features/users/api"

declare global {
  interface Window {
    Swal: any;
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [rolesLoading, setRolesLoading] = useState(true)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    phoneNumber: "",
    docType: "DPI",
    docNumber: "",
    name: "",
    userType: "PERSON",
    role: 0,
    password: ""
  })

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await getUsers()
      const sortedUsers = Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : []
      setUsers(sortedUsers)
    } catch (err: any) {
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar usuarios'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadRoles() {
    try {
      setRolesLoading(true)
      const data = await getRoles()
      setRoles(Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : [])
    } catch (err: any) {
      console.error('Error loading roles:', err)
    } finally {
      setRolesLoading(false)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.userName.trim() || !formData.email.trim() || !formData.role) return

    try {
      const newUserData: CreateUserRequest = {
        userName: formData.userName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        docType: formData.docType,
        docNumber: formData.docNumber.trim(),
        name: formData.name.trim(),
        userType: formData.userType,
        role: formData.role,
        passwordHash: formData.password // el backend debería hashear esto
      }

      const newUser = await createUser(newUserData)
      setUsers(prev => [...prev, newUser].sort((a, b) => a.id - b.id))
      resetForm()
      setShowCreateUser(false)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: `Usuario "${newUser.name}" creado correctamente`,
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al crear el usuario'
        })
      }
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser || !formData.userName.trim() || !formData.email.trim() || !formData.role) return

    try {
      const updateData: UpdateUserRequest = {
        id: editingUser.id,
        userName: formData.userName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        docType: formData.docType,
        docNumber: formData.docNumber.trim(),
        name: formData.name.trim(),
        userType: formData.userType,
        role: formData.role,
        passwordHash: formData.password.trim() || "unchangedpassword" 
      }

      const updatedUser = await updateUserData(updateData)
      setUsers(prev => prev.map(u => 
        u.id === updatedUser.id ? updatedUser : u
      ).sort((a, b) => a.id - b.id))
      
      resetForm()
      setShowEditUser(false)
      setEditingUser(null)
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: `Usuario "${updatedUser.name}" actualizado correctamente`,
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      setError(err.message)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Error al actualizar el usuario'
        })
      }
    }
  }

  function openEditModal(user: User) {
    setEditingUser(user)
    setFormData({
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      docType: user.docType,
      docNumber: user.docNumber,
      name: user.name,
      userType: user.userType,
      role: roles.find(r => r.name === user.roleName)?.id || 0,
      password: "" 
    })
    setShowEditUser(true)
  }

  async function handleToggleUserState(user: User) {
    const newState = !user.is_active
    
    try {
      console.log(`Frontend: Toggling user ${user.id} state from ${user.is_active} to ${newState}`) // Debug
      await updateUserState(user.id, newState)
      
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, is_active: newState } : u
      ))
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: newState ? 'Usuario Activado' : 'Usuario Desactivado',
          text: `El usuario "${user.name}" ha sido ${newState ? 'activado' : 'desactivado'}`,
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      console.error('Frontend error updating user state:', err) // Debug
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Error: ${err.message}`
        })
      }
    }
  }

  async function handleToggleUserMfa(user: User) {
    const newMfaState = !user.is_active_mfa 
    
    try {
      console.log(`Changing user ${user.id} MFA from ${user.is_active_mfa} to ${newMfaState}`) // Debug
      await updateUserMfaState(user.id, newMfaState)
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, is_active_mfa: newMfaState } : u
      ))
      
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: newMfaState ? 'MFA Activado' : 'MFA Desactivado',
          text: `MFA ${newMfaState ? 'activado' : 'desactivado'} para ${user.name}`,
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (err: any) {
      console.error('Error updating user MFA:', err)
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cambiar el estado de MFA'
        })
      }
    }
  }

  function resetForm() {
    setFormData({
      userName: "",
      email: "",
      phoneNumber: "",
      docType: "DPI",
      docNumber: "",
      name: "",
      userType: "PERSON",
      role: 0,
      password: ""
    })
    setError("")
  }

  function closeModals() {
    setShowCreateUser(false)
    setShowEditUser(false)
    setEditingUser(null)
    resetForm()
  }


  const userTypeOptions = [
    { value: 'PERSON', label: 'Persona' },
    { value: 'ORGANIZATION', label: 'Organización' }
  ]

  const docTypeOptions = [
    { value: 'DPI', label: 'DPI' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'LICENCIA', label: 'Licencia' },
    { value: 'NIT', label: 'NIT' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-2">
            Administra clientes, empleados, especialistas y proveedores
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateUser(true)}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaPlus size={14} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {roles.map(role => {
          const count = users.filter(u => u.roleName === role.name).length
          return (
            <div key={role.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{role.name}</p>
                  <p className="text-2xl font-bold text-[var(--color-primary)]">{count}</p>
                </div>
                <FaShieldAlt className="text-[var(--color-primary)] opacity-70" size={24} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaUser className="text-[var(--color-primary)]" size={20} />
            <h3 className="text-lg font-semibold">Usuarios del Sistema</h3>
            <span className="text-sm text-gray-500">({users.length} usuarios)</span>
          </div>
          <button 
            onClick={loadUsers}
            className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-2"
          >
            <FaSearch size={12} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Teléfono</th>
                  <th className="px-4 py-2 text-left">Documento</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Rol</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">MFA</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{user.id}</td>
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm">{user.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm">{user.docType}: {user.docNumber}</td>
                    <td className="px-4 py-3 text-sm">{user.userType}</td>
                    <td className="px-4 py-3">
                      {user.roleName ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {user.roleName}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          Sin rol
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleUserState(user)}
                        className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <FaToggleOn size={16} />
                            Activo
                          </>
                        ) : (
                          <>
                            <FaToggleOff size={16} />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleUserMfa(user)}
                        className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${
                          user.is_active_mfa
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <FaLock size={12} />
                        {user.is_active_mfa ? 'ON' : 'OFF'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50"
                          title="Editar usuario"
                        >
                          <FaEdit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-8">
                <FaUser className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No hay usuarios registrados</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre de usuario *</label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>
              
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
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
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
                <label className="block text-sm font-medium mb-2">Tipo de usuario</label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                >
                  {userTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
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
                <label className="block text-sm font-medium mb-2">Contraseña *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
              </div>

              {error && <div className="md:col-span-2 text-red-600 text-sm">{error}</div>}

              <div className="md:col-span-2 flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditUser && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Editar Usuario: {editingUser.name}</h3>
            <form onSubmit={handleEditUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre de usuario *</label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>
              
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
                  <option value="DPI">DPI</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="LICENCIA">Licencia</option>
                  <option value="NIT">NIT</option>
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
                <label className="block text-sm font-medium mb-2">Tipo de usuario</label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="PERSON">Persona</option>
                  <option value="ORGANIZATION">Organización</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                  required
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
                  placeholder="Dejar vacío para no cambiar"
                />
                <p className="text-xs text-gray-500 mt-1">Solo ingresa una contraseña si deseas cambiarla</p>
              </div>

              {error && <div className="md:col-span-2 text-red-600 text-sm">{error}</div>}

              <div className="md:col-span-2 flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                >
                  Actualizar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
