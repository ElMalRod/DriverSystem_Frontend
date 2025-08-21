import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function PUT(request, { params }) {
  try {
    console.log('[PROXY MFA] === USER MFA TOGGLE PROXY ===')
    
    const { id } = params
    const body = await request.json()
    
    console.log('[PROXY MFA] User ID:', id)
    console.log('[PROXY MFA] Request body:', body)
    
    const backendUrl = `${API_HOST}/api/user/state/mfa/${id}`
    console.log('[PROXY MFA] Calling backend URL:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
    })
    
    console.log('[PROXY MFA] Backend response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[PROXY MFA] Backend error:', errorText)
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('[PROXY MFA] Backend success:', data)
    
    return NextResponse.json(data, { status: response.status })
    
  } catch (error) {
    console.error('[PROXY MFA] Exception:', error)
    return NextResponse.json(
      { error: 'Proxy server error', details: error.message },
      { status: 500 }
    )
  }
}
