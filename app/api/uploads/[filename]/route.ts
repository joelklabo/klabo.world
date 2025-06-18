import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  // Only serve files in local development
  if (process.env.STORAGE_TYPE !== 'local') {
    return new NextResponse('Not found', { status: 404 })
  }
  
  try {
    const filePath = join(process.cwd(), process.env.STORAGE_PATH || './uploads', params.filename)
    const file = await readFile(filePath)
    
    // Determine content type based on file extension
    const ext = params.filename.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    }
    
    const contentType = contentTypes[ext || ''] || 'application/octet-stream'
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    return new NextResponse('Not found', { status: 404 })
  }
}