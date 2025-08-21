import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function PUT(req) {
  const body = await req.json()
  const apiRes = await fetch(`${API_HOST}/api/userRole/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  })

  const data = await apiRes.json()
  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status })
  }
  return NextResponse.json(data)
}
