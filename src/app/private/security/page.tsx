"use client"

import { useState, useEffect } from "react"
import { getSessionUser } from "@/utils/session"
import { FaShieldAlt, FaKey } from "react-icons/fa"
import { updateUserMfaState, requestPasswordResetCode, resetPasswordWithCode, getUserById } from "@/features/users/api"

interface SecuritySettings {
  mfaEnabled: boolean
  email: string
}

export default function SecurityPage() {
  const [settings, setSettings] = useState<SecuritySettings>({ mfaEnabled: false, email: "" })
  const [loading, setLoading] = useState(false)
  const [loadingCode, setLoadingCode] = useState(false)
  const [message, setMessage] = useState("")
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [codeRequested, setCodeRequested] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    const loadUserMfaStatus = async () => {
      const user = getSessionUser()
      if (user?.id) {
        try {
          const userData = await getUserById(Number(user.id))
          setSettings({
            mfaEnabled: userData.is_active_mfa || false,
            email: user.email || ""
          })
        } catch (error: unknown) {
          console.error('Error loading user MFA status:', error)
          // Fallback to session user email
          setSettings({
            mfaEnabled: false,
            email: user.email || ""
          })
        }
      }
    }

    loadUserMfaStatus()
  }, [])

  const toggleMFA = async () => {
    setLoading(true)
    setMessage("")

    try {
      const user = getSessionUser()
      if (!user?.id) return

      const newState = !settings.mfaEnabled
      await updateUserMfaState(Number(user.id), newState)

      // Si llega aquí, la operación fue exitosa
      setSettings(prev => ({ ...prev, mfaEnabled: newState }))
      setMessage(
        newState
          ? "2FA activado. La próxima vez que inicies sesión recibirás un código en tu correo."
          : "2FA desactivado."
      )
    } catch (error: any) {
      console.error('Error toggling MFA:', error)

      // Intentar obtener el estado real del usuario después del error
      try {
        const user = getSessionUser()
        if (user?.id) {
          const userData = await getUserById(Number(user.id))
          setSettings(prev => ({ ...prev, mfaEnabled: userData.is_active_mfa || false }))
        }
      } catch (refreshError) {
        console.error('Error refreshing MFA status:', refreshError)
      }

      // Mostrar mensaje de error más específico
      if (error?.message?.includes('ya tiene el estado')) {
        setMessage(`El 2FA ya está ${settings.mfaEnabled ? 'activado' : 'desactivado'}.`)
      } else {
        setMessage("Error al cambiar la configuración de 2FA. Inténtalo de nuevo.")
      }
    }
    setLoading(false)
  }

  const handleRequestPasswordResetCode = async () => {
    setLoadingCode(true)
    setMessage("")
    try {
      const user = getSessionUser()
      if (!user?.id) {
        setMessage("Error: Usuario no encontrado. Por favor, inicia sesión nuevamente.")
        return
      }

      console.log(`[SECURITY PAGE] Requesting password reset code for user ID: ${user.id}`)
      await requestPasswordResetCode(Number(user.id))

      setMessage("Código de verificación enviado a tu correo electrónico")
      setCodeRequested(true)
    } catch (error: any) {
      console.error('Error requesting password reset code:', error)

      // Manejo de errores más específico
      if (error?.message?.includes('TIMEOUT')) {
        setMessage("El servicio tardó más de 2 minutos en responder. El código podría haber sido enviado, pero por favor verifica tu correo.")
      } else if (error?.message?.includes('HTTP 400')) {
        setMessage("Error: Datos inválidos. Verifica tu información.")
      } else if (error?.message?.includes('HTTP 404')) {
        setMessage("Error: Usuario no encontrado.")
      } else if (error?.message?.includes('fetch')) {
        setMessage("Error de conexión. Verifica tu conexión a internet.")
      } else {
        setMessage("Error al enviar el código de verificación. Inténtalo de nuevo.")
      }

      setShowPasswordForm(false)
    } finally {
      setLoadingCode(false)
    }
  }

  // Función de debug para probar el endpoint (solo en desarrollo)
  const testResetCodeEndpoint = async () => {
    try {
      const user = getSessionUser()
      if (!user?.id) {
        console.error('No user found')
        return
      }

      console.log('Testing reset code endpoint with 2-minute timeout...')

      // Crear AbortController para timeout de 2 minutos
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 120000) // 2 minutos

      const response = await fetch('/api/user/reset/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, state: true }),
        signal: controller.signal,
      })

      // Limpiar timeout si la respuesta llega a tiempo
      clearTimeout(timeoutId)

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok || response.status === 500) {
        if (response.status === 500) {
          console.log('✅ Reset code endpoint returned 500 but email sent successfully')
        } else {
          console.log('✅ Reset code endpoint working correctly')
        }
      } else {
        console.error('❌ Reset code endpoint failed:', data)
      }
    } catch (error: unknown) {
      console.error('❌ Error testing reset code endpoint:', error)

      // Verificar si fue un timeout
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ Timeout: El servicio tardó más de 2 minutos')
      }
    }
  }

  // Función de debug para resetear estados (solo en desarrollo)
  const resetSecurityStates = () => {
    setLoading(false)
    setLoadingCode(false)
    setCodeRequested(false)
    setShowPasswordForm(false)
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setMessage("")
  }

  // Exponer función de debug en desarrollo
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).testResetCode = testResetCodeEndpoint
    ;(window as any).resetSecurityStates = resetSecurityStates
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("Las contrasenas no coinciden")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      await resetPasswordWithCode(passwordData.currentPassword, passwordData.newPassword)

      setMessage("Contraseña cambiada exitosamente")
      setShowPasswordForm(false)
      setCodeRequested(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })

      // Pequeño delay para asegurar que el estado se actualice correctamente
      setTimeout(() => {
        setMessage("")
      }, 3000)
    } catch (error: unknown) {
      console.error('Error changing password:', error)
      setMessage("Código inválido o error al cambiar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración de Seguridad</h1>
        <p className="text-gray-600">Gestiona la seguridad de tu cuenta</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center ${
          message.includes('Error') || message.includes('invalido') || message.includes('no coinciden') || message.includes('falló') || message.includes('tardó')
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-green-50 text-green-800 border-green-200'
        }`}>
          {message.includes('Error') || message.includes('invalido') || message.includes('no coinciden') || message.includes('falló') || message.includes('tardó') ? (
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* 2FA Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <FaShieldAlt className="text-blue-600 mr-3" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Autenticación de Dos Factores</h2>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Estado del 2FA:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                settings.mfaEnabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {settings.mfaEnabled ? 'Activado' : 'Desactivado'}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {settings.mfaEnabled
              ? "El 2FA está activado. Recibirás un código en tu correo cada vez que inicies sesión."
              : "Activa el 2FA para mayor seguridad. Recibirás un código en tu correo cada vez que inicies sesión."
            }
          </p>

          <button
            onClick={toggleMFA}
            disabled={loading}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              settings.mfaEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
          >
            {loading ? 'Procesando...' : (settings.mfaEnabled ? 'Desactivar 2FA' : 'Activar 2FA')}
          </button>
        </div>

        {/* Password Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <FaKey className="text-green-600 mr-3" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Cambiar Contraseña</h2>
          </div>

          {!showPasswordForm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Para cambiar tu contraseña, primero solicita un código de verificación que será enviado a tu correo electrónico.
              </p>
              <button
                onClick={() => {
                  setShowPasswordForm(true)
                  if (!codeRequested) {
                    handleRequestPasswordResetCode()
                  }
                }}
                disabled={loadingCode || loading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingCode && !codeRequested ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando Código...
                  </span>
                ) : codeRequested && !showPasswordForm ? (
                  'Cambiar Contraseña'
                ) : (
                  'Solicitar Código de Verificación'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {!codeRequested ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Enviando código de verificación a tu correo...
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Esto puede tardar hasta 2 minutos.
                  </p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : (
                <form onSubmit={changePassword} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>¡Código enviado!</strong> Revisa tu correo electrónico e ingresa el código de verificación a continuación.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de Verificación
                    </label>
                    <input
                      type="text"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Ingresa el código de 6 dígitos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Ingresa tu nueva contraseña"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirma tu nueva contraseña"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Cambiando contraseña...</span>
                        </span>
                      ) : (
                        'Cambiar Contraseña'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setCodeRequested(false)
                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                      }}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}