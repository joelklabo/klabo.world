import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const visible = searchParams.get('visible')
    
    const pages = await prisma.page.findMany({
      where: visible !== null ? { visible: visible === 'true' } : undefined,
      orderBy: [
        { order: 'asc' },
        { title: 'asc' }
      ]
    })

    return NextResponse.json(pages)
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { title, content, slug, isDynamic, customCode, visible, order } = body

    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: 'Title, content, and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingPage = await prisma.page.findUnique({
      where: { slug }
    })

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      )
    }

    const page = await prisma.page.create({
      data: {
        title,
        content,
        slug,
        isDynamic: Boolean(isDynamic),
        customCode,
        visible: Boolean(visible),
        order: order || 0,
      }
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    )
  }
}