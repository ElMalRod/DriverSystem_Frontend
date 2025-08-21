import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function PUT(request, { params }) {
  try {
    console.log('[PROXY] === USER STATE TOGGLE PROXY ===')
    console.log('[PROXY] Params received:', params)
    
    const { id } = params
    const body = await request.json()
    
    console.log('[PROXY] User ID:', id)
    console.log('[PROXY] Request body:', body)
    
    // Construir la URL completa para el backend
    const backendUrl = `${API_HOST}/api/user/state/${id}`
    console.log('[PROXY] Calling backend URL:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
    })
    
    console.log('[PROXY] Backend response status:', response.status)
    console.log('[PROXY] Backend response headers:', [...response.headers.entries()])
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[PROXY] Backend error response:', errorText)
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('[PROXY] Backend success response:', data)
    
    return NextResponse.json(data, { status: response.status })
    
  } catch (error) {
    console.error('[PROXY] Exception occurred:', error)
    return NextResponse.json(
      { error: 'Proxy server error', details: error.message },
      { status: 500 }
    )
  }
}

// Agregar OPTIONS para CORS si es necesario
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

