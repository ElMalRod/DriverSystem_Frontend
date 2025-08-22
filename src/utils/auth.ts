import type { Rol } from "@/types/auth"

export function homeByRole(role: Rol): string {
  switch (role) {
    case "ADMIN":
      return "/private/admin"
    case "EMPLOYEE":
      return "/private/work-orders"
    case "SPECIALIST":
      return "/private/work-orders"
    case "CUSTOMER":
      return "/private/customers"
    case "SUPPLIER":
      return "/private/supplier"
    default:
      return "/private/dashboard"
  }
}

