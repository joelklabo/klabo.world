import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getStorage } from '@/lib/storage'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find the user in our database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const postId = formData.get('postId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

    // Upload to storage
    const storage = getStorage()
    const result = await storage.upload(file, filename)

    // Save to database
    const image = await prisma.image.create({
      data: {
        url: result.url,
        altText: file.name,
        width: null, // Could be extracted from image metadata
        height: null, // Could be extracted from image metadata
        size: result.size,
        postId: postId || null,
      }
    })

    return NextResponse.json({
      id: image.id,
      url: result.url,
      filename: filename,
      size: result.size,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}