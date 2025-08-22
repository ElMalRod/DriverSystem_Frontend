export type Rol = "ADMIN" | "EMPLOYEE" | "SPECIALIST" | "CUSTOMER" | "SUPPLIER"

export interface User {
  id?: string | number;
  email: string;
  rol?: Rol;
  name?: string;
}

export interface LoginResponse {
  codeHttp: number;
  messsage: string;
  role: Rol;
  usaMfa: boolean;
  userId: string;
  name?: string;
}

export interface MfaResponse {
  codeHttp: number;
  messsage: string;
  role: Rol;
  userId: string;
  name?: string;
}
