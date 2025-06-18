import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')
    
    const posts = await prisma.post.findMany({
      where: published !== null ? { published: published === 'true' } : undefined,
      include: {
        author: {
          select: { name: true, email: true }
        },
        tags: true,
        _count: {
          select: { images: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
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
    const { title, content, excerpt, published, slug } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({
      where: { slug }
    })

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        excerpt,
        slug,
        published: Boolean(published),
        publishedAt: published ? new Date() : null,
        authorId: user.id,
      },
      include: {
        author: {
          select: { name: true, email: true }
        },
        tags: true,
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}