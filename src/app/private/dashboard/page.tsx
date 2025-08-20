"use client"

import { useEffect, useState } from "react"
import { getSessionUser } from "@/utils/session"
import type { User } from "@/types/auth"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(getSessionUser())
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-dark)]">
        {user ? `Bienvenido ${user.rol ?? ""}${user.name ? ` — ${user.name}` : ""}` : "Dashboard"}
      </h1>
      <p className="text-sm text-gray-600 mt-2">
        Selecciona una opción del menú lateral para empezar.
      </p>
      {/* aquí puedes poner cards/resúmenes por rol */}
    </div>
  )
}
