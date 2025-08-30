export interface SupplierOrder {
    id: number;
    code: string;
    supplierId: number;
    status: string;
    orderedAt: string;
    expectedAt: string;
    currency: string;
    notes: string;
    items: SupplierItemOrder[];
}

export interface SupplierItemOrder {
    id: number;
    productId: number;
    quantity: number;
    unitCost: number;
    discount: number;
    taxRate: number;
}

export async function getSupplierOrders(): Promise<SupplierOrder[]>{
  const res = await fetch("/api/purchase-orders", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.statusText;
    console.error('Error response from getSupplierOrden: -> ', error);
    throw new Error("Error al obtener odenes de productos-proveedores");
  }
  return res.json();
}

// Obtener un supplier product por ID
export async function getSupplierOrdersById(supplierId: number): Promise<SupplierOrder[]> {
  const res = await fetch(`/api/purchase-orders/${supplierId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.statusText;
    console.error('Error response from get SupplierOrdenById: ->', error);
    throw new Error("Error al obtener el producto del proveedor");
  }
  return res.json();
}