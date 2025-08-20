export const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080";

type LoginPayload = { email: string; password: string };

export async function loginUser({ email, password }: { email: string; password: string }) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include", // importante para cookies de sesión
  })
  if (!res.ok) {
    throw new Error("Credenciales inválidas")
  }
  return await res.json()
}

export async function verifySessionCode(code: string) {
  const res = await fetch(`/api/session_code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.messsage || "Código inválido");
  return data; // data contiene { codeHttp, messsage, role, usaMfa }
}

export async function resendMfaCode(email: string) {
  const res = await fetch(`${API_HOST}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password: "___dummy___" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.messsage || "No se pudo reenviar el código");
  return data;
}
