import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function PATCH(req) {
  try {
    console.log('🔍 DEBUG STATUS PATCH')
    
    const body = await req.json()
    const visitId = 1 // Hardcoded para prueba
    
    console.log('📨 Body:', body)
    
    const backendUrl = `${API_HOST}/api/vehicle/visit/${visitId}/status`
    console.log('🔄 Calling:', backendUrl)

    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    console.log('📊 Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log('✅ Data:', data)
    
    return NextResponse.json({
      message: 'Debug status proxy working!',
      data: data,
      backendUrl: backendUrl
    })

  } catch (error) {
    console.error('🔥 Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
