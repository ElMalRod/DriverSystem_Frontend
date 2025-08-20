"use client"

export default function WorkOrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-dark)] mb-4">
        Órdenes de Trabajo
      </h1>
      <p className="text-gray-600 mb-6">
        Gestiona las órdenes de trabajo del sistema.
      </p>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">Lista de Órdenes</h2>
        <p className="text-gray-500">Aquí se mostrarán las órdenes de trabajo...</p>
      </div>
    </div>
  )
}