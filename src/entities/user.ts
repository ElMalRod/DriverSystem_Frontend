export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'SPECIALIST' | 'CUSTOMER' | 'SUPPLIER'

export interface User {
  id: number
  username: string
  email: string
  name: string
  phone?: string
  user_type: 'PERSON' | 'ORGANIZATION'
  doc_type?: string
  doc_number?: string
  roles: UserRole[]
}
