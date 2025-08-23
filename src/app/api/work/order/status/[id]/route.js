import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function GET(req, { params }) {
  const { id } = params
  
  const apiRes = await fetch(`${API_HOST}/api/Work/order/status/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })

  if (!apiRes.ok) {
    return NextResponse.json({ error: "Failed to fetch work orders by status" }, { status: apiRes.status })
  }

  const data = await apiRes.json()
  return NextResponse.json(data)
}
