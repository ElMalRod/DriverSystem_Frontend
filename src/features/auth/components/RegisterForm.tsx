'use client'
import { registerUser } from '@/features/auth/api'
import { useRouter } from 'next/navigation'

export function RegisterForm() {
  const router = useRouter()

  async function handleSubmit(e: any) {
    e.preventDefault()
    const data = {
      email: e.target.email.value,
      password: e.target.password.value,
      name: e.target.name.value
    }

    const user = await registerUser(data)
    sessionStorage.setItem('user', JSON.stringify(user))
    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="name" type="text" placeholder="Nombre completo" required className="w-full border p-2 rounded" />
      <input name="email" type="email" placeholder="Correo" required className="w-full border p-2 rounded" />
      <input name="password" type="password" placeholder="Contraseña" required className="w-full border p-2 rounded" />
      <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">Registrarse</button>
    </form>
  )
}
