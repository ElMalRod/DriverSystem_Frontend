export interface ProductCategory {
  id: number
  name: string
}

// Obtener todas las categorías de producto
export async function getProductCategories(): Promise<ProductCategory[]> {
  const res = await fetch("/api/product-category/", {
    method: "GET",
    credentials: "include",
  })
  if (!res.ok) {
    throw new Error("Error al obtener categorías de producto")
  }
  return res.json()
}