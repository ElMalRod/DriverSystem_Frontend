"use client"

import { useEffect, useState } from "react"
import { FaSearch, FaBoxOpen, FaTruck, FaCalendarAlt } from "react-icons/fa"
import { getSupplierProducts, SupplierProduct } from "@/features/supplier-products/api"

// Declarar Swal como global
declare global {
  interface Window {
    Swal: any;
  }
}

export default function SupplierProductsModule() {
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
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
                  <th className="px-4 py-2 text-left">Descripción</th>
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
                    <td className="px-4 py-3">{product.productDescription}</td>
                    <td className="px-4 py-3">{product.stockQuantity}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-500" size={12} />
                      {product.leadTimeDays}
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
      </div>
    </div>
  )
}