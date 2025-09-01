"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, verifySessionCode, resendMfaCode, forgotPassword, resetPasswordWithCode } from "@/features/auth/api";
import { homeByRole } from "@/utils/auth";
import Link from 'next/link'


export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirected, setRedirected] = useState(false);

  // MFA 
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);

  // Forgot Password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'password'>('email');
  const [resetLoading, setResetLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const r = await loginUser({ email, password });
      console.log("Login response:", r);
      if (r?.usaMfa) {
        setShowMfa(true);
        setPendingRole(r.role);
      } else if (r?.role) {
        const targetRoute = homeByRole(r.role);
        console.log("Redirecting to:", targetRoute);

        sessionStorage.setItem('user', JSON.stringify({
          id: r.userId,
          email,
          rol: r.role,
          name: r.name || email.split('@')[0]
        }));

        setShowMfa(false);
        setMfaCode("");
        setRedirected(true);
        router.push(targetRoute);
        return;
      } else {
        setError(r?.messsage || "Error al iniciar sesión");
      }
    } catch (err: any) {
      setError(err?.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyMfa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await verifySessionCode(mfaCode);
      if (r?.codeHttp === 202 && r?.role) {
        const form = document.querySelector('form[autocomplete="off"]') as HTMLFormElement;
        const email = (form?.elements.namedItem("email") as HTMLInputElement)?.value || '';
        sessionStorage.setItem('user', JSON.stringify({
          id: r.userId,
          email,
          rol: r.role,
          name: r.name || email.split('@')[0]
        }));

        setShowMfa(false);
        setMfaCode("");
        router.push(homeByRole(r.role));
        return;
      } else {
        setError(r?.messsage || "Código inválido");
      }
    } catch (err: any) {
      setError(err?.message || "No se pudo validar el código");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendBusy(true);
    setError("");
    try {
      // usar el email si lo necesitas para reenviar
      // await resendMfaCode(emailUsed);
    } catch (err: any) {
      setError(err?.message || "No se pudo reenviar el código");
    } finally {
      setResendBusy(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setResetLoading(true);

    try {
      await forgotPassword(forgotEmail);
      setResetStep('code');
      setError("");
      setSuccessMessage("Código de verificación enviado correctamente a tu correo electrónico");
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      setError(err?.message || "Error al enviar el código de recuperación");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setResetLoading(true);
    try {
      await resetPasswordWithCode(resetCode, newPassword);
      setError("");
      setShowForgotPassword(false);
      setResetStep('email');
      setForgotEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      // Mostrar mensaje de éxito
      setSuccessMessage("¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.");
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      setError(err?.message || "Error al restablecer la contraseña");
    } finally {
      setResetLoading(false);
    }
  }

  function resetForgotPassword() {
    setShowForgotPassword(false);
    setResetStep('email');
    setForgotEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccessMessage("");
  }

  if (redirected) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg min-w-[380px]">
        <div className="flex justify-center mb-6">
          <img src="/images/logo.png" alt="Logo" className="max-w-[240px]" />
        </div>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off">
          <div className="mb-4">
            <label className="block mb-1">Correo electrónico</label>
            <input name="email" type="email" required className="w-full p-2 rounded border" autoComplete="off" />
          </div>
          <div className="mb-6">
            <label className="block mb-1">Contraseña</label>
            <input name="password" type="password" required className="w-full p-2 rounded border" autoComplete="off" />
          </div>
          {error && !showMfa && <div className="text-red-600 mb-4">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded font-semibold disabled:opacity-60"
          >
            {loading ? "Procesando..." : "Entrar"}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

           <Link 
              href="/register" 
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200 block text-center"
            >
              Registrarse
            </Link>
        </form>
      </div>

      {showMfa && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <form onSubmit={handleVerifyMfa} className="bg-white p-6 rounded-xl shadow w-[360px]" autoComplete="off">
            <h2 className="text-lg font-semibold mb-2">Verificación en dos pasos</h2>
            <p className="text-sm text-gray-600 mb-4">
              Hemos enviado un código a tu correo o teléfono. Ingresa el código para continuar.
            </p>

            <input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
              placeholder="Código de verificación"
              className="w-full border rounded p-2 mb-3 tracking-widest text-center"
              autoComplete="off"
            />

            {error && <div className="text-red-600 mb-3">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded font-semibold disabled:opacity-60"
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>

          </form>
        </div>
      )}

      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow w-[400px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recuperar Contraseña</h2>
              <button
                onClick={resetForgotPassword}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            {resetStep === 'email' && (
              <form onSubmit={handleForgotPassword} autoComplete="off">
                <p className="text-sm text-gray-600 mb-4">
                  Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
                </p>

                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Correo electrónico</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full border rounded p-2"
                    autoComplete="off"
                  />
                </div>

                {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2 bg-blue-600 text-white rounded font-semibold disabled:opacity-60"
                >
                  {resetLoading ? "Enviando..." : "Enviar Código"}
                </button>
              </form>
            )}

            {resetStep === 'code' && (
              <form onSubmit={handleResetPassword} autoComplete="off">
                <p className="text-sm text-gray-600 mb-4">
                  Hemos enviado un código a tu correo electrónico. Ingresa el código y tu nueva contraseña.
                </p>

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-50 text-green-800 border border-green-200 rounded-lg flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Código de Verificación</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                    placeholder="Ingresa el código"
                    className="w-full border rounded p-2 text-center tracking-widest"
                    autoComplete="off"
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Nueva contraseña"
                    className="w-full border rounded p-2"
                    autoComplete="off"
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Confirmar Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirma la nueva contraseña"
                    className="w-full border rounded p-2"
                    autoComplete="off"
                  />
                </div>

                {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2 bg-green-600 text-white rounded font-semibold disabled:opacity-60"
                >
                  {resetLoading ? "Restableciendo..." : "Restablecer Contraseña"}
                </button>

                <button
                  type="button"
                  onClick={() => setResetStep('email')}
                  className="w-full mt-3 py-2 bg-gray-100 text-gray-800 rounded"
                >
                  Volver
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
