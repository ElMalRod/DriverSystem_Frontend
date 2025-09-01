import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('[PROXY FORGOT PASSWORD] === USER FORGOT PASSWORD PROXY ===')

    const body = await request.json()

    console.log('[PROXY FORGOT PASSWORD] Request body:', body)

    const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"
    const backendUrl = `${API_HOST}/api/user/forgot-password`
    console.log('[PROXY FORGOT PASSWORD] Calling backend URL:', backendUrl)

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
    })

    console.log('[PROXY FORGOT PASSWORD] Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[PROXY FORGOT PASSWORD] Backend error:', errorText)
      return NextResponse.json(
        { error: 'Error from backend', details: errorText },
        { status: response.status }
      )
    }

    const responseData = await response.json()
    console.log('[PROXY FORGOT PASSWORD] Backend response data:', responseData)

    return NextResponse.json(responseData, { status: response.status })

  } catch (error) {
    console.error('[PROXY FORGOT PASSWORD] Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
