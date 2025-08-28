import { NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function GET(req) {
  const res = await fetch(`${API_URL}/api/supplier-products/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }
  return NextResponse.json(data)
}

export async function POST(product) {
  const res = await fetch(`${API_URL}/api/supplier-products`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  })
  if (!res.ok) {
    throw new Error("Error al crear producto de proveedor")
  }
  return res.json()
}