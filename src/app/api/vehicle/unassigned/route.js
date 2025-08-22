import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function GET(req) {
  try {
    const apiRes = await fetch(`${API_HOST}/api/vehicle/unassigned`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include",
    })

    const data = await apiRes.json()
    
    if (!apiRes.ok) {
      console.error('[PROXY] Error from backend:', apiRes.status, data)
      return NextResponse.json(data, { status: apiRes.status })
    }
    
    console.log(`[PROXY] Successfully fetched ${data.length} unassigned vehicles`)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[PROXY] Error fetching unassigned vehicles:', error)
    return NextResponse.json(
      { error: "Error al obtener vehículos sin asignar", details: error.message },
      { status: 500 }
    )
  }
}
