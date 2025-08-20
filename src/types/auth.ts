export type Rol = "ADMIN" | "EMPLOYEE" | "SPECIALIST" | "CUSTOMER" | "SUPPLIER"

export type User = {
  id?: number
  name?: string
  email?: string
  username?: string
  rol?: Rol
}
