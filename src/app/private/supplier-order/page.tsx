"use client"

import React, { useEffect, useState } from "react"
import { FaBoxes, FaSearch, FaTruck, FaEnvelope, FaClipboardList, FaPlus, FaEdit, FaTrash } from "react-icons/fa"
import { SupplierOrder, SupplierItemOrder, getSupplierOrders, getSupplierOrdersById, updateSupplierOrderById } from "@/features/supplier-orders/api";

import { getSessionUser } from "@/utils/session";
import type { User } from "@/types/auth"

declare global {
  interface Window {
    Swal: any;
  }
}

export default function SupplierOpOrdersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredSupplierOrders, setFilteredSupplierOrders] = useState<SupplierOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null);
  const [showEditOrders, setShowEditOrders] = useState(false);
  const [status, setStatus] = useState<string[]>(['DRAFT', 'SENT', 'RECEIVED', 'CANCELLED']);
  const [editOrders, setEditOrders] = useState<SupplierOrder | null>(null)
  const [orderForm, setOrderForm] = useState<Partial<SupplierOrder>>({
    id: 0,
    code: '',
    supplierId: Number(user?.id) || 0,
    status: "",
    orderedAt: "",
    expectedAt: '',
    currency: '',
    notes: '',
    items: []
  })


  
  useEffect(() => {
    const userSession = getSessionUser();
    setUser(userSession);
    loadSupplierOrders(userSession);
  }, []);

  useEffect(() => {
    filterOrders()
  }, [searchTerm, supplierOrders])

  async function loadSupplierOrders(u: User | null) {
    try {
      setLoading(true);
      const data = await getSupplierOrders();
    
      
      
      setSupplierOrders( Array.isArray(data) ? data : [] )
    } catch (error) {
      console.error('Error of Product categories: ',error)
      setSupplierOrders([])
    } finally{
      setLoading(false)
    }
  }
  function filterOrders() {
    let filtered = supplierOrders;
    //console.info('Search filterOrders:', filtered, searchTerm);
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        //order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
     setFilteredSupplierOrders(filtered)
  }

  async function handleEditOrder(e: React.FormEvent) {
    e.preventDefault();
    if(!editOrders) return;
    try {
      await updateSupplierOrderById(editOrders.id, orderForm as SupplierOrder)
      setShowEditOrders(false);
      setEditOrders(null);
    } catch (error: any) {
      setError(error.message || 'Error al actualizar la orden')
    }

  }

  function selectOrderAcceptModal(order: SupplierOrder) {
    setEditOrders(order);
    setOrderForm(order);
    setShowEditOrders(true);
    setError('');
  }

  function selectOrderDened(){
    
  }


 return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Ordenes a Proveedores
          </h1>
          <p className="text-gray-600 mt-2">
            Consulta las ordenes realizadas al proveedor
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Buscar No Orden</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
            disabled={supplierOrders.length === 0}
          />
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaBoxes className="text-[var(--color-accent)]" size={20} />
          <h3 className="text-lg font-semibold">Lista de Ordenes</h3>
          <span className="text-sm text-gray-500">({filteredSupplierOrders.length} Ordenes)</span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando Ordenes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Fecha inicio</th>
                  <th className="px-4 py-2 text-left">Fecha Final</th>
                  <th className="px-4 py-2 text-left">Currency</th>
                  <th className="px-4 py-2 text-left">notas</th>
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-left">Cantidad</th>
                  <th className="px-4 py-2 text-left">total</th>                  
                </tr>
              </thead>
              <tbody>
                {filteredSupplierOrders.map(orders => (
                  <tr key={`${orders.id}-${orders.id}`} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{orders.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orders.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orders.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orders.orderedAt ? orders.orderedAt.split("T")[0] : ""}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orders.expectedAt}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orders.currency}</td>
                    <td className="px-4 py-3 text-center font-bold">{orders.notes}</td>
                    <td className="px-4 py-3 text-center">{ orders.items?.[0]?.productId }</td>
                    <td className="px-4 py-3 text-center">{ orders.items?.reduce((total, item) => total + item.quantity, 0) }</td>
                    <td className="px-4 py-3 text-center">{ orders.items?.reduce((total, item) => total + (item.unitCost * item.quantity), 0).toFixed(2) }</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSupplierOrders.length === 0 && !loading && (
              <div className="text-center py-8">
                <FaClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">
                  {supplierOrders.length === 0
                    ? "Ingrese un ID de proveedor válido para ver productos"
                    : searchTerm
                      ? "No se encontraron productos con los filtros aplicados"
                      : "No hay productos registrados para este proveedor"}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-2 text-[var(--color-primary)] hover:underline"
                  >
                    Limpiar filtro
                  </button>
                )}
              </div>
            )}
          </div>
        )}

                     {/* Editar producto modal */}
      {showEditOrders && editOrders && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Actualizar Orden</h3>
            <form onSubmit={handleEditOrder}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">No. Orden:</label>
                <input
                  type="text"
                  value={orderForm.id || ""}
                  onChange={e => setOrderForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  readOnly
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Proveedor:</label>
                <input
                  type="number"
                  value={orderForm.supplierId || ""}
                  onChange={e => setOrderForm(prev => ({ ...prev, supplierId: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  readOnly
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Estado</label>
                <select
                  value={orderForm.status || ""}
                  onChange={e => {
                    setOrderForm(prev => ({ ...prev, status: e.target.value || "" }))
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Seleccione el Estado</option>
                  {status.map( status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Fecha inicial</label>
                <input
                  type="date"
                  value={orderForm.orderedAt ? orderForm.orderedAt.split("T")[0] : ""}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  readOnly
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Fecha Final</label>
                <input
                  type="date"
                  value={orderForm.expectedAt ? orderForm.expectedAt.split("T")[0] : ""}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  onChange={e => setOrderForm(prev => ({ ...prev, expectedAt: e.target.value }))}
                />
              </div>
             
              {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditOrders(false)
                    setEditOrders(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90"
                >
                  Actualizar Orden
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