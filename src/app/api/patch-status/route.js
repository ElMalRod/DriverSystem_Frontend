import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function PATCH(request) {
  try {
    console.log('SIMPLE PATCH STATUS PROXY')
    
    const body = await request.json()
    const { visitId, status } = body
    
    console.log('Visit ID:', visitId, 'Status:', status)
    
    const backendUrl = `${API_HOST}/api/vehicle/visit/${visitId}/status`
    console.log('Backend URL:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })

    console.log('Backend status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log('Backend data:', data)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
