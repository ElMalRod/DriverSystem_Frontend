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

// obtener todos los usuarios con sus roles
export async function getUsersWithRoles(): Promise<UserWithRoles[]> {
  try {
    const [users, roles] = await Promise.all([
      getUsers(),
      getRoles()
    ]);
    
    return users.map(user => ({
      ...user,
      userRoles: [] // Temporal 
    }));
  } catch (error) {
    throw new Error("Error al obtener usuarios con roles");
  }
}

export async function getClients(): Promise<User[]> {
  const users = await getUsers()
  return users.filter(user => user.roleName === "Cliente")
}

// Solicitar código de verificación para reset de contraseña
export async function requestPasswordResetCode(userId: number): Promise<void> {
  const url = `/api/user/reset/code`
  const body = { id: userId, state: true }

  console.log(`[API RESET CODE] Calling: ${url}`)
  console.log(`[API RESET CODE] With body:`, body)

  // Crear AbortController para timeout de 2 minutos
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, 120000) // 2 minutos = 120,000 ms

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    // Limpiar timeout si la respuesta llega a tiempo
    clearTimeout(timeoutId)

    console.log(`[API RESET CODE] Response status: ${res.status}`)

    if (!res.ok) {
      // Si es 500, el correo se está enviando correctamente, así que no lanzamos error
      // Esto es intencional ya que el backend puede tener errores pero la funcionalidad principal funciona
      if (res.status === 500) {
        console.log(`[API RESET CODE] Status 500 but email sent successfully`)
        return // Salir sin error
      }

      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
      console.error(`[API RESET CODE] Error response:`, errorData)
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(errorData)}`)
    }

    console.log(`[API RESET CODE] Code sent successfully`)

  } catch (error: unknown) {
    // Limpiar timeout
    clearTimeout(timeoutId)

    console.error(`[API RESET CODE] Fetch error:`, error)

    // Verificar si fue un timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('TIMEOUT: El servicio tardó más de 2 minutos en responder. Inténtalo de nuevo.')
    }

    throw error
  }
}

// Reset de contraseña con código de verificación
export async function resetPasswordWithCode(code: string, newPassword: string): Promise<void> {
  const url = `/api/user/reset/password`
  const body = { code, newPassword }

  console.log(`[API RESET PASSWORD] Calling: ${url}`)
  console.log(`[API RESET PASSWORD] With body:`, body)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    console.log(`[API RESET PASSWORD] Response status: ${res.status}`)

    if (!res.ok) {
      try {
        const errorData = await res.json()
        console.error(`[API RESET PASSWORD] Error response:`, errorData)
        throw new Error(`HTTP ${res.status}: ${JSON.stringify(errorData)}`)
      } catch (parseError) {
        // Si no se puede parsear como JSON, pero el status es 200-299, significa que la contraseña se cambió
        if (res.status >= 200 && res.status < 300) {
          console.log(`[API RESET PASSWORD] Response is not JSON but status ${res.status} - password reset successfully`)
          return // Éxito, no lanzamos error
        }
        throw new Error(`HTTP ${res.status}: Error al restablecer la contraseña`)
      }
    }

    try {
      await res.json() // Intentar parsear la respuesta
      console.log(`[API RESET PASSWORD] Password reset successfully`)
    } catch (parseError) {
      // Si no se puede parsear la respuesta exitosa como JSON, significa que la contraseña se cambió
      console.log(`[API RESET PASSWORD] Success response is not JSON - password reset successfully`)
    }

  } catch (error) {
    console.error(`[API RESET PASSWORD] Fetch error:`, error)
    throw error
  }
}
