"use client"

import { useEffect, useState } from "react"
import { FaBoxes, FaSearch, FaTruck, FaEnvelope, FaClipboardList, FaPlus, FaEdit, FaTrash } from "react-icons/fa"
import {
  getProductsBySupplierId,
  SupplierProduct,
  SupplierProductUpdate,
  createSupplierProduct,
  updateSupplierProduct,
  deleteSupplierProduct
} from "@/features/supplier-products/api"
import { getProductCategories, ProductCategory } from "@/features/product-category/api";
import { getSessionUser } from "@/utils/session";
import type { User } from "@/types/auth"

declare global {
  interface Window {
    Swal: any;
  }
}

export default function SupplierOpProductPage() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [filteredProducts, setFilteredProducts] = useState<SupplierProduct[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<SupplierProductUpdate | null>(null)
  const [productForm, setProductForm] = useState<Partial<SupplierProduct>>({
    supplierId: Number(user?.id) || 0,
    productName: "",
    productBrand: "",
    productPrice: 0,
    productCost: 0,
    productUnit: '',
    productCategoryId: 0,
    productCategory: "",
    stockQuantity: 0,
    leadTimeDays: 0,
  })
  const [error, setError] = useState("")

  useEffect(() => {
    const userSession = getSessionUser(); // Obtén el valor una sola vez
    setUser(userSession); // Actualiza el estado
    loadProducts(userSession); // Pasa el valor directamente a la función
    loadProductCategory();
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchTerm, products])

  async function loadProductCategory() {
    try {
      setLoading(true);
      const data = await getProductCategories();
      console.info('product Categories: ',data)
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error of Product categories: ',error)
      setCategories([])
    } finally{
      setLoading(false)
    }
  }

  async function loadProducts(user: User | null) {
    try {
      setLoading(true)
      const data = await getProductsBySupplierId( Number(user?.id) || 0)
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading supplier products:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  function filterProducts() {
    let filtered = products
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productBrand?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredProducts(filtered)
  }

    function openCreateProductModal() {
    setProductForm({
      supplierId: Number(user?.id) || 0,
      productName: "",
      productBrand: "",
      productUnit: '',
      productCategoryId: 0,
      productCategory: "",
      productPrice: 0,
      productCost: 0,
      stockQuantity: 0,
      leadTimeDays: 0,
    })
    setShowCreateProduct(true)
    setError("")
  }

  function openEditProductModal(product: SupplierProductUpdate) {
    setEditingProduct(product)
    setProductForm(product)
    setShowEditProduct(true)
    setError("")
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    try {
      console.info('Creating product with data: ', productForm)
      await createSupplierProduct(productForm)
      setShowCreateProduct(false)
      await loadProducts(user)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleEditProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!editingProduct) return
    try {
      console.info('Updating product with data: ', productForm)
      console.info( await updateSupplierProduct(Number(user?.id) || 0, Number(editingProduct?.productId), productForm) )
      setShowEditProduct(false)
      setEditingProduct(null)
      await loadProducts(user)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDeleteProduct(product: SupplierProduct) {
    if (!window.confirm(`¿Eliminar el producto "${product.productName}"?`)) return
    try {
      await deleteSupplierProduct(product.supplierId, product.productId)
      await loadProducts(user)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Productos de Proveedor
          </h1>
          <p className="text-gray-600 mt-2">
            Consulta los productos de un proveedor específico
          </p>
        </div>
        <button
          onClick={openCreateProductModal}
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <FaPlus size={14} />
          Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Buscar producto</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
            disabled={products.length === 0}
          />
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaBoxes className="text-[var(--color-accent)]" size={20} />
          <h3 className="text-lg font-semibold">Lista de Productos</h3>
          <span className="text-sm text-gray-500">({filteredProducts.length} productos)</span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando productos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-left">Marca</th>
                  <th className="px-4 py-2 text-left">Precio</th>
                  <th className="px-4 py-2 text-left">Costo</th>
                  <th className="px-4 py-2 text-left">Unidad</th>
                  <th className="px-4 py-2 text-left">Categoría</th>
                  <th className="px-4 py-2 text-left">Stock</th>
                  <th className="px-4 py-2 text-left">Lead Time (días)</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={`${product.supplierId}-${product.productId}`} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{product.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.productBrand}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">Q{product.productPrice?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">Q{product.productCost?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.productUnit}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.productCategory}</td>
                    <td className="px-4 py-3 text-center font-bold">{product.stockQuantity}</td>
                    <td className="px-4 py-3 text-center">{product.leadTimeDays}</td>
                    <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => openEditProductModal(product)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                    title="Editar producto"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
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
            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-8">
                <FaClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">
                  {products.length === 0
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
      {showEditProduct && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Producto de Proveedor</h3>
            <form onSubmit={handleEditProduct}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nombre del producto</label>
                <input
                  type="text"
                  value={productForm.productName || ""}
                  onChange={e => setProductForm(prev => ({ ...prev, productName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Marca</label>
                <input
                  type="text"
                  value={productForm.productBrand || ""}
                  onChange={e => setProductForm(prev => ({ ...prev, productBrand: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Precio</label>
                <input
                  type="number"
                  value={productForm.productPrice || ""}
                  onChange={e => setProductForm(prev => ({ ...prev, productPrice: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Costo</label>
                <input
                  type="number"
                  value={productForm.productCost || ""}
                  onChange={e => setProductForm(prev => ({ ...prev, productCost: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Unidad</label>
                <input
                  type="text"
                  value={productForm.productUnit || ""}
                  onChange={e => setProductForm(prev => ({ ...prev, productUnit: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Categoría</label>
                <select
                  value={productForm.productCategoryId || ""}
                  onChange={e => {
                    const selectedId = Number(e.target.value)
                    const selectedCategory = categories.find(cat => cat.id === selectedId)
                    setProductForm(prev => ({ ...prev,
                      productCategoryId: selectedId,
                      productCategory: selectedCategory?.name || ""
                    }))
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Stock</label>
                <input
                  type="number"
                  value={productForm.stockQuantity || 0}
                  onChange={e => setProductForm(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                  min={0}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Lead Time (días)</label>
                <input
                  type="number"
                  value={productForm.leadTimeDays || 0}
                  onChange={e => setProductForm(prev => ({ ...prev, leadTimeDays: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                  min={0}
                />
              </div>
              {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProduct(false)
                    setEditingProduct(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90"
                >
                  Actualizar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crear producto modal */}
      {showCreateProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nuevo Producto de Proveedor</h3>
            <form onSubmit={handleCreateProduct}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nombre del producto</label>
                <input
                  type="text"
                  value={productForm.productName || ""}
                  onChange={e => setProductForm(prev => ({ ...prev, productName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Marca</label>
                <input
                  type="text"
                  value={productForm.productBrand || ""}
                  onChange={e => setProductForm(prev => ({ ...prev, productBrand: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Precio</label>
                <input
                  type="number"
                  value={productForm.productPrice || ""}
                  onChange={e => setProductForm(prev => ({ ...prev, productPrice: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Costo</label>
                <input
                  type="number"
                  value={productForm.productCost || ""}
                  onChange={e => setProductForm(prev => ({ ...prev, productCost: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Unidad</label>
                <input
                  type="text"
                  value={productForm.productUnit || ""}
                  onChange={e => setProductForm(prev => ({ ...prev, productUnit: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Categoría</label>
                <select
                  value={productForm.productCategoryId || ""}
                  onChange={e => {
                    const selectedId = Number(e.target.value)
                    const selectedCategory = categories.find(cat => cat.id === selectedId)
                    setProductForm(prev => ({
                      ...prev,
                      productCategoryId: selectedId,
                      productCategory: selectedCategory?.name || ""
                    }))
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Stock</label>
                <input
                  type="number"
                  value={productForm.stockQuantity || 0}
                  onChange={e => setProductForm(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                  min={0}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Lead Time (días)</label>
                <input
                  type="number"
                  value={productForm.leadTimeDays || 0}
                  onChange={e => setProductForm(prev => ({ ...prev, leadTimeDays: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                  min={0}
                />
              </div>
              {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateProduct(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                >
                  Crear Producto
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