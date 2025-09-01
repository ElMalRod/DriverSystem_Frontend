import { NextResponse } from "next/server"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:8080"

export async function POST(request) {
  try {
    console.log('[PROXY RESET PASSWORD] === USER RESET PASSWORD PROXY ===')

    const body = await request.json()

    console.log('[PROXY RESET PASSWORD] Request body:', body)

    const backendUrl = `${API_HOST}/api/user/reset/password`
    console.log('[PROXY RESET PASSWORD] Calling backend URL:', backendUrl)

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
    })

    console.log('[PROXY RESET PASSWORD] Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[PROXY RESET PASSWORD] Backend error:', errorText)
      return NextResponse.json(
        { error: 'Error from backend', details: errorText },
        { status: response.status }
      )
    }

    const responseData = await response.json()
    console.log('[PROXY RESET PASSWORD] Backend response data:', responseData)

    return NextResponse.json(responseData, { status: response.status })

  } catch (error) {
    console.error('[PROXY RESET PASSWORD] Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}