import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function GET(req) {
  try {
    console.log('TEST PROXY CALLED')
    
    // Hardcodear el userId 5 para pruebas
    const userId = 5
    const backendUrl = `${API_HOST}/api/user/vehicle/${userId}`
    
    console.log('Calling:', backendUrl)
    
    const apiRes = await fetch(backendUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    console.log('Status:', apiRes.status)

    if (!apiRes.ok) {
      const errorText = await apiRes.text()
      return NextResponse.json({ error: errorText }, { status: apiRes.status })
    }

    const data = await apiRes.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
