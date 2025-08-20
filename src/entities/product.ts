export interface Product {
  id: number
  sku: string
  name: string
  brand?: string
  category_id?: number
  price: number
  cost: number
  is_service: boolean
  active: boolean
}
