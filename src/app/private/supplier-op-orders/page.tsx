"use client"

import { useEffect, useState } from "react"
import { FaBoxes, FaSearch, FaTruck, FaEnvelope, FaClipboardList, FaPlus, FaEdit, FaTrash } from "react-icons/fa"
import { SupplierOrder, SupplierItemOrder, getSupplierOrders, getSupplierOrdersById } from "@/features/supplier-orders/api";

import { getSessionUser } from "@/utils/session";

declare global {
  interface Window {
    Swal: any;
  }
}

export default function SupplierOpOrdersPage() {
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredSupplierOrders, setFilteredSupplierOrders] = useState<SupplierOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const userSession = getSessionUser();
    loadSupplierOrders();
  }, []);

  useEffect(() => {
    filterOrders()
  }, [searchTerm, supplierOrders])

  async function loadSupplierOrders() {
    try {
      setLoading(true);
      const data = await getSupplierOrders();
      setSupplierOrders(Array.isArray(data) ? data : [])
      console.info('Supplier Orders: ',data)
    } catch (error) {
      console.error('Error of Product categories: ',error)
      setSupplierOrders([])
    } finally{
      setLoading(false)
    }
  }
  function filterOrders() {
    let filtered = supplierOrders;
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        //order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSupplierOrders(filtered)
    }
  }

  function selectOrderAccept() {
  }
  function selectOrderDened(){
    
  }


 return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Ordenes del Proveedor
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
                  <th className="px-4 py-2 text-left">Tiempo de Orden</th>
                  <th className="px-4 py-2 text-left">ExpectedAt</th>
                  <th className="px-4 py-2 text-left">Currency</th>
                  <th className="px-4 py-2 text-left">notas</th>
                  <th className="px-4 py-2 text-left">Lead Time (días)</th>
                </tr>
              </thead>
              <tbody>
                {filteredSupplierOrders.map(orders => (
                  <tr key={`${orders.id}-${orders.id}`} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{orders.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orders.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orders.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orders.orderedAt}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orders.expectedAt}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{orders.currency}</td>
                    <td className="px-4 py-3 text-center font-bold">{orders.notes}</td>
                    <td className="px-4 py-3 text-center">  </td>
                    <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => selectOrderAccept()}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                    title="Editar producto"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button
                    onClick={() => selectOrderDened()}
                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                    title="Eliminar producto"
                  >
                    <FaTrash size={14} />
                  </button>
                </td>
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
      </div>
    </div>
  )
}