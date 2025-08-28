import { NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function GET(req, { params }) {
  const { suplierId } = params;
  const res = await fetch(`${API_URL}/api/supplier-products/supplier/${suplierId}`, {
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