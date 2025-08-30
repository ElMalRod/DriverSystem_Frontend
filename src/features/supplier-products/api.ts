export interface SupplierProduct {
  supplierId: number;
  productId: number;
  productName: string;
  productBrand: string;
  productCategoryId: number;
  productPrice: number;
  productCost: number;
  productUnit: string;
  productCategory: string;
  stockQuantity: number;
  leadTimeDays: number;
}

export interface SupplierProductUpdate {
  productName: string;
  productBrand: string;
  productCategoryId: number;
  productUnit: string;
  productPrice: number;
  productCost: number;
  stockQuantity: number;
  leadTimeDays: number;
}

export interface SupplierProductNew {
  supplierId: number;
  productName: string;
  productBrand: string;
  productCategory: number;
  productUnit: string;
  productPrice: number;
  productCost: number;
  stockQuantity: number;
  leadTimeDays: number;
}

// Obtener todos los supplier products
export async function getSupplierProducts(): Promise<SupplierProduct[]> {
  const res = await fetch("/api/supplier-products/", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.statusText;
    console.error('Error response from getSupplierProducts: -> ', error);
    throw new Error("Error al obtener productos de proveedores");
  }
  return res.json();
}

// Obtener un supplier product por ID
export async function getSupplierProductById(supplierId: number, productId: number): Promise<SupplierProduct> {
  const res = await fetch(`/api/supplier-products/${supplierId}/${productId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener el producto del proveedor");
  }
  return res.json();
}

// OBtener product de supplier por ID
export async function getProductsBySupplierId(id: number): Promise<SupplierProduct[]> {
  const res = await fetch(`/api/supplier-products/supplier/${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.statusText;
    console.error('Error response from getProductsBySupplierId: -> ',error);
    throw new Error("Error al obtener productos del proveedor-> ");
  }
  return res.json();
}

// ...existing code...
export async function createSupplierProduct( product: Partial<SupplierProduct>): Promise<SupplierProduct> {
  const res = await fetch("/api/supplier-products/", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Error al crear producto de proveedor");
  return res.json();
}

export async function updateSupplierProduct(supplierId: number, productId: number, product: Partial<SupplierProductUpdate>): Promise<SupplierProduct> {
  const res = await fetch(`/api/supplier-products/${supplierId}/${productId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    throw new Error("Error al actualizar producto de proveedor-> " + await res.text());
  }
    return res.json();
}

export async function deleteSupplierProduct(supplierId: number, productId: number): Promise<void> {
  const res = await fetch(`/api/supplier-products/${supplierId}/${productId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al eliminar producto de proveedor");
}