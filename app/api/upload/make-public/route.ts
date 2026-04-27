import { NextRequest, NextResponse } from 'next/server'
import { makeFilePublic } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path } = body

    if (!path) {
      return NextResponse.json(
        { error: 'Path mancante' },
        { status: 400 }
      )
    }

    // Rendi pubblico il file
    await makeFilePublic(path)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore nel rendere pubblico il file:', error)
    return NextResponse.json(
      { error: 'Errore nel rendere pubblico il file' },
      { status: 500 }
    )
  }
}
