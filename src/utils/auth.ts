export function homeByRole(role: string | undefined) {
  if (!role) return "/private/dashboard";
  
  switch (role.toUpperCase()) {
    case "ADMIN":
      return "/private/admin";
    case "CUSTOMER":
      return "/private/customers";
    case "EMPLOYEE":
      return "/private/employee";
    case "SPECIALIST":
      return "/private/specialist";
    case "SUPPLIER":
      return "/private/supplier";
    default:
      return "/private/dashboard";
  }
}

