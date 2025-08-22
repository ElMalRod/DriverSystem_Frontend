import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function GET(request) {
  console.log('🔍 DEBUG PROXY CALLED')
  
  try {
    const userId = 5 // Hardcoded para prueba
    const backendUrl = `${API_HOST}/api/user/vehicle/${userId}`
    console.log('🔄 Calling:', backendUrl)

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: { 'Content-Type': 'application/json' }
    })

    console.log('📊 Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log('✅ Data:', data)
    
    return NextResponse.json({
      message: 'Debug proxy working!',
      data: data,
      backendUrl: backendUrl
    })

  } catch (error) {
    console.error('🔥 Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
