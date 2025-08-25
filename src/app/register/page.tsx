"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUser, CreateUserRequest } from "@/features/users/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess(false);

    const form = e.currentTarget as HTMLFormElement;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const fullName = (form.elements.namedItem("fullName") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
    const dpi = (form.elements.namedItem("dpi") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setLoading(false);
      return;
    }

    try {
      const newUserData: CreateUserRequest = {
        userName: username.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        docType: "DPI",
        docNumber: dpi.trim(),
        name: fullName.trim(),
        userType: "PERSON",
        role: 4, // cliente
        passwordHash: password
      };

      const response = await createUser(newUserData);
      console.log("Registration response:", response);
      setSuccess(true);
      
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err: any) {
      const errorMessage = err?.message || "Error al registrar usuario";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg min-w-[380px] text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Registro Exitoso!</h2>
            <p className="text-gray-600">
              Tu cuenta ha sido creada correctamente. Serás redirigido al login en unos segundos.
            </p>
          </div>
          <Link 
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Ir al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white p-8 rounded-xl shadow-lg min-w-[600px] max-w-[700px] w-full mx-4">
        <div className="flex justify-center mb-6">
          <img src="/images/logo.png" alt="Logo" className="max-w-[240px]" />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Crear Cuenta
        </h1>

        <form onSubmit={handleRegister} autoComplete="off">
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Nombre de usuario *</label>
              <input 
                name="username" 
                type="text" 
                required 
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors" 
                autoComplete="off"
                placeholder="Ej: juan.perez"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Nombre completo *</label>
              <input 
                name="fullName" 
                type="text" 
                required 
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors" 
                autoComplete="off"
                placeholder="Ej: Juan Carlos Pérez"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Correo electrónico *</label>
              <input 
                name="email" 
                type="email" 
                required 
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors" 
                autoComplete="off"
                placeholder="Ej: juan@ejemplo.com"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Teléfono *</label>
              <input 
                name="phone" 
                type="tel" 
                required 
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors" 
                autoComplete="off"
                placeholder="Ej: +502 1234-5678"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Número de DPI *</label>
              <input 
                name="dpi" 
                type="text" 
                required 
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors" 
                autoComplete="off"
                placeholder="Ej: 1234 56789 0101"
              />
            </div>

            <div className="mb-6">
              <label className="block mb-1 text-sm font-medium text-gray-700">Contraseña *</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors" 
                autoComplete="off"
                placeholder="Mínimo 8 caracteres"
                minLength={8}
              />
            </div>
          </div>

          {error && <div className="text-red-600 mb-4 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-60 transition-colors duration-200"
          >
            {loading ? "Registrando..." : "Crear Cuenta"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
