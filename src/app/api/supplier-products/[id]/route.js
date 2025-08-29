import { NextResponse } from "next/server"

const API_URL ="http://localhost:8080"

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

export async function POST(req) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/api/supplier-products/supplier/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }
  return NextResponse.json(data)
}

export async function PUT(req, { params }) {
  const { suplierId, productId } = params;
  const body = await req.json();
  const res = await fetch(`${API_URL}/api/supplier-products/${suplierId}/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  })
  console.info('body: ', body)

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }
  return NextResponse.json(data)
}