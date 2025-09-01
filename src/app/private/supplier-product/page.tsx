"use client"

import { useEffect, useState } from "react"
import { FaSearch, FaBoxOpen, FaTruck, FaCalendarAlt } from "react-icons/fa"
import { getSupplierProducts, SupplierProduct } from "@/features/supplier-products/api"
import { CreateSupplierOrder, postSupplierOrder } from "@/features/supplier-orders/api";
import { getSessionUser } from "@/utils/session";
import type { User } from "@/types/auth"
import EditWorkOrderModal from "@/features/work-orders/components/EditWorkOrderModal";

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

export default function SupplierProductsModule() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [editOrder, setEditOrder] = useState<CreateSupplierOrder | null >(null)
  const [filteredProducts, setFilteredProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showStartOrder, setShowStrartOrder] = useState(false)
  const [orderForm, setOrderForm] = useState<Partial<CreateSupplierOrder>>({
    code: '',
    supplierId: 0,
    status: 'DRAFT',
    expectedAt: '',
    currency: 'QTZ',
    notes: '',
    items: []
  })

  const [error, setError] = useState("")

  useEffect(() => {
    const userSession = getSessionUser();
    setUser(userSession)
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchTerm, products])

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await getSupplierProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      // Manejo de error
      console.error('Error loading all proveedor-producto: ', err.message)
    } finally {
      setLoading(false)
    }
  }

  function filterProducts() {
    let filtered = products
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredProducts(filtered)
  }

  function openCreateOrderModal(newOrder: SupplierProduct) {
    setEditOrder({
      code: newOrder.productName.substring(0,3).toUpperCase() + '-' + Date.now()+ Math.floor(Math.random() * 1000).toString(),
      supplierId: newOrder.supplierId,
      status: 'DRAFT',
      orderedAt: new Date(Date.now()).toISOString().split("T")[0], // Fecha actual YYYY-MM-DD
      expectedAt: new Date(
        Date.now() + newOrder.leadTimeDays * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0], // Fecha sumando días
      currency: 'QTZ',
      notes: '',
      items: [
        {
          id: 0,
          productId: newOrder.productId,
          quantity: 1,
          unitCost: newOrder.productCost,
          discount: 0,
          taxRate: 12,
        },
      ],
    });
    setOrderForm({
      code: newOrder.productName.substring(0,3).toUpperCase() + '-' + Date.now()+ Math.floor(Math.random() * 1000).toString(),
      supplierId: newOrder.supplierId,
      status: 'DRAFT',
      orderedAt: new Date(Date.now()).toISOString().split("T")[0], // Fecha actual YYYY-MM-DD
      expectedAt: new Date(
        Date.now() + newOrder.leadTimeDays * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0], // Fecha sumando días
      currency: 'QTZ',
      notes: '',
      items: [
        {
          id: 0,
          productId: newOrder.productId,
          quantity: 1,
          unitCost: newOrder.productCost,
          discount: 0,
          taxRate: 12,
        },
      ],
    });

    setShowStrartOrder(true);
    setError("");
  }


  async function handleCreateOrder(e: React.FormEvent){
    e.preventDefault();
    try {
      console.info('Creating order with data: ', orderForm)
      await postSupplierOrder(orderForm);
      setShowStrartOrder(false);
      setEditOrder(null);
    } catch (error: any) {
      setError(error.message || 'error desconocido create order');
    }
  }




  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FaBoxOpen /> Productos de Proveedores
        </h2>
        <button
          onClick={loadProducts}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaSearch size={14} />
          Actualizar
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por producto o proveedor..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando productos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Proveedor</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-left">Marca</th>
                  <th className="px-4 py-2 text-left">Categoria</th>
                  <th className="px-4 py-2 text-left">precio</th>
                  <th className="px-4 py-2 text-left">Stock</th>
                  <th className="px-4 py-2 text-left">Entrega (días)</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.productId} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">{product.supplierName}</td>
                    <td className="px-4 py-3">{product.supplierEmail}</td>
                    <td className="px-4 py-3 font-semibold">{product.productName}</td>
                    <td className="px-4 py-3">{product.productBrand}</td>
                    <td className="px-4 py-3">{product.productCategory}</td>
                    <td className="px-4 py-3">Q {product.productPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">{product.stockQuantity}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-500" size={12} />
                      {product.leadTimeDays}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { openCreateOrderModal(product); }}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-2"
                      >
                        <FaTruck size={14} />
                        Ordenar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-600">
                No se encontraron productos con los filtros aplicados
              </div>
            )}
          </div>
        )}
      {/* Realizar orden modal */}
{showStartOrder && editOrder && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Crear Orden de Proveedor</h3>

      <form onSubmit={handleCreateOrder} className="space-y-4">
        {/* Código */}
        <div>
          <label className="block text-sm font-medium mb-1">Código</label>
          <input
            type="text"
            value={orderForm.code || ""}
            onChange={e =>
              setOrderForm(prev => ({ ...prev, code: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            readOnly
          />
        </div>

        {/* Fecha ordenada */}
        <div>
          <label className="block text-sm font-medium mb-1">Fecha de orden</label>
          <input
            type="date"
            value={orderForm.orderedAt || ""}
            onChange={e =>
              setOrderForm(prev => ({ ...prev, orderedAt: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            readOnly
          />
        </div>

        {/* Fecha esperada */}
        <div>
          <label className="block text-sm font-medium mb-1">Fecha esperada</label>
          <input
            type="date"
            value={orderForm.expectedAt || ""}
            onChange={e =>
              setOrderForm(prev => ({ ...prev, expectedAt: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            readOnly
          />
        </div>

        {/* Moneda */}
        <div>
          <label className="block text-sm font-medium mb-1">Moneda</label>
          <input
            type="text"
            value={orderForm.currency || ""}
            onChange={e =>
              setOrderForm(prev => ({ ...prev, currency: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="QTZ"
            readOnly
          />
          
        </div>
        {/* Notas */}
        <div>
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            value={orderForm.notes || ""}
            onChange={e =>
              setOrderForm(prev => ({ ...prev, notes: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            rows={3}
          />
        </div>

        {/* Items (ejemplo del primero) */}
        {orderForm.items && orderForm.items.length > 0 && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="text-sm font-semibold mb-2">Producto</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs">Cantidad</label>
                <input
                  type="number"
                  value={orderForm.items[0].quantity}
                  onChange={e =>
                    setOrderForm(prev => ({
                      ...prev,
                      items: [
                        { ...prev.items[0], quantity: Number(e.target.value) },
                      ],
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-2 py-1"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs">Costo unitario</label>
                <input
                  type="number"
                  value={orderForm.items[0].unitCost}
                  onChange={e =>
                    setOrderForm(prev => ({
                      ...prev,
                      items: [
                        { ...prev.items[0], unitCost: Number(e.target.value) },
                      ],
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-2 py-1"
                  step="0.01"
                  readOnly
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-xs">Descuento (%)</label>
                <input
                  type="number"
                  value={orderForm.items[0].discount}
                  onChange={e =>
                    setOrderForm(prev => ({
                      ...prev,
                      items: [
                        { ...prev.items[0], discount: Number(e.target.value) },
                      ],
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-2 py-1"
                  step="0.01"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs">Impuesto (%)</label>
                <input
                  type="number"
                  value={orderForm.items[0].taxRate}
                  onChange={e =>
                    setOrderForm(prev => ({
                      ...prev,
                      items: [
                        { ...prev.items[0], taxRate: Number(e.target.value) },
                      ],
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-2 py-1"
                  step="0.01"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setShowStrartOrder(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90"
          >
            Crear Orden
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      </div>
    </div>
  )
}