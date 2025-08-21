export interface User {
  id: number;
  userName: string;
  email: string;
  phoneNumber: string;
  docType: string;
  docNumber: string;
  name: string;
  userType: string;
  createdAt: string;
  is_active: boolean;
  is_active_mfa: boolean;
  roleName: string | null;
}

export interface UserWithRoles extends User {
  userRoles: Role[];
}

export interface Role {
  id: number;
  name: string;
  code: string;
}

export interface CreateUserRequest {
  id?: number;
  email: string;
  userName: string;
  docNumber: string;
  phoneNumber: string;
  passwordHash: string;
  userType: string;
  name: string;
  role: number;
  docType: string;
}

export interface UpdateUserRequest {
  id: number;
  email: string;
  userName: string;
  docNumber: string;
  phoneNumber: string;
  passwordHash: string;
  userType: string;
  name: string;
  role: number;
  docType: string;
}

// Usuarios
export async function getUsers(): Promise<User[]> {
  const res = await fetch("/api/user/", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener usuarios");
  }
  return res.json();
}

export async function createUser(user: CreateUserRequest): Promise<User> {
  const res = await fetch("/api/user/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al crear usuario: ${error}`);
  }
  return res.json();
}

export async function updateUserData(user: UpdateUserRequest): Promise<User> {
  const res = await fetch("/api/user/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al actualizar usuario: ${error}`);
  }
  return res.json();
}

// Actualizar estado del usuario
export async function updateUserState(id: number, state: boolean): Promise<void> {
  const url = `/api/user/state`
  const body = { id: id, state: state }
  
  console.log(`[API] Calling: ${url}`)
  console.log(`[API] With body:`, body)
  
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    
    console.log(`[API] Response status: ${res.status}`)
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
      console.error(`[API] Error response:`, errorData)
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(errorData)}`)
    }
    
    const successData = await res.json()
    console.log(`[API] Success response:`, successData)
    
  } catch (error) {
    console.error(`[API] Fetch error:`, error)
    throw error
  }
}

// Actualizar estado de MFA del usuario
export async function updateUserMfaState(id: number, state: boolean): Promise<void> {
  const url = `/api/user/state/mfa`
  const body = { id: id, state: state }
  
  console.log(`[API MFA] Calling: ${url}`)
  console.log(`[API MFA] With body:`, body)
  
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    
    console.log(`[API MFA] Response status: ${res.status}`)
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
      console.error(`[API MFA] Error response:`, errorData)
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(errorData)}`)
    }
    
    const successData = await res.json()
    console.log(`[API MFA] Success response:`, successData)
    
  } catch (error) {
    console.error(`[API MFA] Fetch error:`, error)
    throw error
  }
}

// Asignar rol a usuario
export async function assignUserRole(userId: number, roleId: number): Promise<void> {
  const res = await fetch("/api/userRole/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId, roleId }),
  });
  if (!res.ok) {
    throw new Error("Error al asignar rol al usuario");
  }
}

// Roles
export async function getRoles(): Promise<Role[]> {
  const res = await fetch("/api/role/", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener roles");
  }
  return res.json();
}

export async function createRole(role: { name: string; code: string }): Promise<Role> {
  const res = await fetch("/api/role/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(role),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al crear rol: ${error}`);
  }
  return res.json();
}

// Obtener usuario por ID con sus roles
export async function getUserById(id: number): Promise<User> {
  const res = await fetch(`/api/user/${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener usuario");
  }
  return res.json();
}

// Obtener todos los usuarios con sus roles
export async function getUsersWithRoles(): Promise<UserWithRoles[]> {
  try {
    const [users, roles] = await Promise.all([
      getUsers(),
      getRoles()
    ]);
    
    // Por ahora, devolver usuarios sin roles específicos asignados
    // Esto se debe completar cuando el backend devuelva la relación user-role
    return users.map(user => ({
      ...user,
      userRoles: [] // Temporal hasta que el backend devuelva los roles por usuario
    }));
  } catch (error) {
    throw new Error("Error al obtener usuarios con roles");
  }
}
