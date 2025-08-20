'use client'
import { loginUser, verifySessionCode } from '@/features/auth/api'
import { homeByRole } from '@/utils/auth'
import error from 'next/error'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [showMfa, setShowMfa] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [pendingRole, setPendingRole] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    try {
      const res = await loginUser({ email, password })
      if (res.usaMfa) {
        setShowMfa(true)
        setPendingRole(res.role)
      } else if (res.role) {
        setShowMfa(false)
        setMfaCode('')
        router.replace(homeByRole(res.role))
      } else {
        setError(res.messsage || 'Error al iniciar sesión')
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas')
    }
  }

  async function handleVerifyMfa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    try {
      const res = await verifySessionCode(mfaCode)
      if (res.codeHttp === 202 && res.role) {
        setShowMfa(false)
        setMfaCode('')
        router.replace(homeByRole(res.role))
      } else {
        setError(res.messsage || 'Código inválido')
      }
    } catch (err: any) {
      setError(err.message || 'Código inválido')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <input name="email" type="email" placeholder="Correo" required className="w-full border p-2 rounded" autoComplete="off" />
        <input name="password" type="password" placeholder="Contraseña" required className="w-full border p-2 rounded" autoComplete="off" />
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Entrar</button>
      </form>
      {showMfa && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleVerifyMfa} className="bg-white p-6 rounded shadow space-y-4 min-w-[300px]" autoComplete="off">
            <h2 className="text-lg font-bold mb-2">Verificación de código</h2>
            <input
              type="text"
              placeholder="Código recibido por correo"
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value)}
              required
              className="w-full border p-2 rounded"
              autoComplete="off"
            />
            {error && <div className="text-red-600">{error}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Verificar</button>
          </form>
        </div>
      )}
    </>
  )
}

