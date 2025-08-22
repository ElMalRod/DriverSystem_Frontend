import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function PATCH(request, { params }) {
  try {
    console.log('=== PATCH STATUS PROXY EXECUTED ===')
    console.log('Params:', params)
    
    const { id } = params
    const body = await request.json()
    
    console.log('Visit ID:', id)
    console.log('Status payload:', body)
    
    const backendUrl = `${API_HOST}/api/vehicle/visit/${id}/status`
    console.log('Backend URL:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    })

    console.log('Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Backend response data:', data)

    return NextResponse.json(data, { status: 200 })
    
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
