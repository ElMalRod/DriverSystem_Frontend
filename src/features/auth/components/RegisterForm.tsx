'use client'
import { registerUser } from '@/features/auth/api'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { homeByRole } from '@/utils/auth'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      phone: formData.get('phone') as string
    }

    try {
      const response = await registerUser(data)
      
      if (response) {
        sessionStorage.setItem('user', JSON.stringify({
          id: response.userId || response.id,
          email: data.email,
          rol: response.role || response.rol,
          name: `${data.first_name} ${data.last_name}`
        }))
        
        const targetRoute = response.role ? homeByRole(response.role) : '/private/dashboard'
        router.push(targetRoute)
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input 
        name="first_name" 
        type="text" 
        placeholder="Nombre" 
        required 
        className="w-full border p-2 rounded" 
        disabled={loading}
      />
      <input 
        name="last_name" 
        type="text" 
        placeholder="Apellido" 
        required 
        className="w-full border p-2 rounded" 
        disabled={loading}
      />
      <input 
        name="phone" 
        type="tel" 
        placeholder="Teléfono" 
        required 
        className="w-full border p-2 rounded" 
        disabled={loading}
      />
      <input 
        name="email" 
        type="email" 
        placeholder="Correo" 
        required 
        className="w-full border p-2 rounded" 
        disabled={loading}
      />
      <input 
        name="password" 
        type="password" 
        placeholder="Contraseña" 
        required 
        className="w-full border p-2 rounded" 
        disabled={loading}
        minLength={6}
      />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button 
        type="submit" 
        className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50" 
        disabled={loading}
      >
        {loading ? 'Registrando...' : 'Registrarse'}
      </button>
    </form>
  )
}
