import type { User, Rol } from "@/types/auth"

const KEY = "user"

export function setSessionUser(u: User) {
  if (!u) return
  sessionStorage.setItem(KEY, JSON.stringify(u))
}

export function getSessionUser(): User | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession() {
  sessionStorage.removeItem(KEY)
}

export const ROLE_HOME: Record<Rol, string> = {
  ADMIN: "/private/admin",
  EMPLOYEE: "/private/employee",
  SPECIALIST: "/private/specialist",
  CUSTOMER: "/private/customers",
  SUPPLIER: "/private/supplier",
}

export function getHomeByRole(rol?: Rol): string {
  return rol ? ROLE_HOME[rol] : "/private/dashboard"
}
