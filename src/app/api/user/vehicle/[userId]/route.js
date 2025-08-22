import { NextResponse } from "next/server"

console.log('🚀 PROXY FILE LOADED: [userId]/route.js')

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function GET(request, { params }) {
  console.log('🎯 PROXY GET CALLED - USER VEHICLES')
  console.log('📨 Request URL:', request.url)
  console.log('📋 Params received:', params)
  
  try {
    const { userId } = params
    console.log('👤 User ID extracted:', userId)

    if (!userId) {
      console.error('❌ No userId provided')
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      )
    }

    const backendUrl = `${API_HOST}/api/user/vehicle/${userId}`
    console.log('🔄 Calling backend:', backendUrl)

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    console.log('📊 Backend response status:', response.status)
    console.log('📊 Backend response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('💥 Backend error:', errorText)
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Backend success data:', data)

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('🔥 Proxy exception:', error)
    return NextResponse.json(
      { error: 'Proxy server error', details: error.message },
      { status: 500 }
    )
  }
}

// Para debugging - agregar OPTIONS
export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
