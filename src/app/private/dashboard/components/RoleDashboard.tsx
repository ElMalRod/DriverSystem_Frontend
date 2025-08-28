"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { clearSession, getHomeByRole, getSessionUser } from "@/utils/session"
import type { Rol } from "@/types/auth"
import {
  FaBars,
  FaTachometerAlt,
  FaChartBar,
  FaBoxes,
  FaClipboardList,
  FaClipboardCheck,
  FaTools,
  FaFileInvoiceDollar,
  FaTruck,
  FaShoppingCart,
  FaSignOutAlt,
  FaUserCircle,
  FaCar,
  FaUser,
  FaClipboard
} from "react-icons/fa"

type Props = { children: React.ReactNode }
type MenuItem = { label: string; href: string; Icon: React.ComponentType<{ size?: number; className?: string }> }

export default function RoleDashboard({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<Rol | null>(null)
  const [name, setName] = useState<string | undefined>()
  const [email, setEmail] = useState<string | undefined>()
  const [ready, setReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const u = getSessionUser()
    if (!u?.rol) {
      router.replace("/")
      return
    }
    setRole(u.rol)
    setName(u.name)
    setEmail(u.email)
    setReady(true)

    if (pathname === "/private") {
      router.replace(getHomeByRole(u.rol))
    }
  }, [pathname, router])

  const logout = () => {
    clearSession()
    router.replace("/")
  }

  const go = (href: string) => {
    setSidebarOpen(false)
    router.push(href)
  }

  const menuByRole: Record<Rol, MenuItem[]> = {
    ADMIN: [
      { label: "Inicio", href: "/private/admin",         Icon: FaTachometerAlt },
      { label: "Usuarios",  href: "/private/users",         Icon: FaUser },
      { label: "Vehículos", href: "/private/vehicles",      Icon: FaCar },
      { label: "Visitas",   href: "/private/vehicle-visits", Icon: FaClipboard },
      { label: "Reportes",  href: "/private/reports",       Icon: FaChartBar },
      { label: "Inventario",href: "/private/inventary",     Icon: FaBoxes },
      { label: "Producto de Proveedor",href: "/private/supplier-product",     Icon: FaBoxes },
      { label: "Ordenes a Proveedor",href: "/private/supplier-product",     Icon: FaBoxes },
      { label: "Órdenes",   href: "/private/work-orders",   Icon: FaClipboardList },
    ],
    EMPLOYEE: [
      { label: "Trabajos asignados",href: "/private/employee", Icon: FaClipboardCheck },
    ],
    SPECIALIST: [
      { label: "Intervenciones",      href: "/private/work-orders", Icon: FaTools },
    ],
    CUSTOMER: [
      { label: "Inicio", href: "/private/admin",         Icon: FaTachometerAlt },
      { label: "Mis servicios", href: "/private/supplier",         Icon: FaClipboardList },
      { label: "Mis facturas",  href: "/private/invoices",          Icon: FaFileInvoiceDollar },
    ],
    SUPPLIER: [
      { label: "Inicio", href: "/private/supplier",         Icon: FaTachometerAlt },
      { label: "Productos",href: "/private/supplier-op-product",     Icon: FaBoxes },
      { label: "Pedidos activos",   href: "/private/supplier-op-orden",         Icon: FaTruck },
      { label: "Órdenes de compra", href: "/private/purchase-orders",  Icon: FaShoppingCart },
    ],
  }

  const menuItems = useMemo(() => (role ? menuByRole[role] : []), [role])
  const isActive = (href: string) => pathname.startsWith(href)

  if (!ready) return null

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR - solo uno */}
      <nav className="fixed top-0 z-50 w-full bg-[var(--color-primary)] border-b border-gray-300 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-md sm:hidden hover:bg-white hover:text-[var(--color-primary)]"
                aria-label="Abrir menú"
              >
                <FaBars size={16} />
                Menú
              </button>
              <div className="flex items-center ml-2">
                <span className="text-xl font-semibold text-white">
                  DriveSys
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-white">
                <FaUserCircle size={18} className="opacity-70" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium">{name ?? "Usuario"}</span>
                  <span className="text-xs text-[var(--color-light)] uppercase">{role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-sm px-3 py-1 rounded-md bg-[var(--color-accent)] text-white hover:opacity-90 inline-flex items-center gap-2"
              >
                <FaSignOutAlt size={14} />
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* SIDEBAR */}
      <aside
        className={[
          "fixed top-0 left-0 z-40 w-64 h-screen pt-16 transition-transform bg-white border-r border-gray-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "sm:translate-x-0",
        ].join(" ")}
      >
        <div className="h-full px-3 pb-6 overflow-y-auto">
          <ul className="space-y-1 font-medium">
            {menuItems.map((item) => (
              <li key={item.href}>
                <button
                  onClick={() => go(item.href)}
                  className={[
                    "w-full text-left block p-2 rounded-md flex items-center gap-3",
                    pathname === item.href // comparación exacta para activar Dashboard
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-dark)] hover:bg-[var(--color-light)]",
                  ].join(" ")}
                >
                  <item.Icon size={16} className="opacity-80" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-gray-300 pt-4 text-xs text-gray-600">
            <div>{email}</div>
          </div>
        </div>
      </aside>

      {/* CONTENT - solo una vez */}
      <main className="p-4 sm:ml-64">
        <div className="pt-16">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

