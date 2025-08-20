"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, verifySessionCode, resendMfaCode } from "@/features/auth/api";
import { homeByRole } from "@/utils/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirected, setRedirected] = useState(false);

  // MFA modal state
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);

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

        // ✅ GUARDAR USUARIO EN SESSION STORAGE
        const form = document.querySelector('form[autocomplete="off"]') as HTMLFormElement;
        const email = (form?.elements.namedItem("email") as HTMLInputElement)?.value || '';
        sessionStorage.setItem('user', JSON.stringify({
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
      // Puedes usar el email si lo necesitas para reenviar
      // await resendMfaCode(emailUsed);
    } catch (err: any) {
      setError(err?.message || "No se pudo reenviar el código");
    } finally {
      setResendBusy(false);
    }
  }

  if (redirected) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg min-w-[380px]">
        <div className="flex justify-center mb-6">
          <img src="/images/logo.png" alt="Logo" className="max-w-[240px]" />
        </div>

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

            <button
              type="button"
              onClick={handleResend}
              disabled={resendBusy}
              className="w-full mt-3 py-2 bg-gray-100 text-gray-800 rounded"
            >
              {resendBusy ? "Reenviando..." : "Reenviar código"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
