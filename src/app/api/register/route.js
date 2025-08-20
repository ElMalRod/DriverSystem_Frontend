import { NextResponse } from 'next/server'

export async function POST(req) {
  const data = await req.json()
  console.log('[Registro]', data)


  return NextResponse.json({
    ...data,
    id: Math.floor(Math.random() * 1000),
    roles: ['CUSTOMER'] // todos los registrados entran como cliente
  })
}
