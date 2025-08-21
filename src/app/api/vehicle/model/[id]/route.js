import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function GET(req, { params }) {
  const { id } = params
  const apiRes = await fetch(`${API_HOST}/api/vehicle/model/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })

  const data = await apiRes.json()
  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status })
  }
  return NextResponse.json(data)
}

export async function DELETE(req, { params }) {
  const { id } = params
  const apiRes = await fetch(`${API_HOST}/api/vehicle/model/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })

  const data = await apiRes.json()
  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status })
  }
  return NextResponse.json(data)
}
