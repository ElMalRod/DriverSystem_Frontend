"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getHomeByRole, getSessionUser } from "@/utils/session"
import type { User } from "@/types/auth"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const sessionUser = getSessionUser()
    if (sessionUser?.rol) {
      setUser(sessionUser)
      // Redirigir a la página de inicio correspondiente según el rol
      router.replace(getHomeByRole(sessionUser.rol))
    } else {
      router.replace("/")
    }
  }, [router])

  // Mostrar un loading mientras se redirecciona
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  )
}
