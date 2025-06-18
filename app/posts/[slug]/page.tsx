import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/db'

interface PostProps {
  params: {
    slug: string
  }
}

export default async function PostPage({ params }: PostProps) {
  const post = await prisma.post.findUnique({
    where: { 
      slug: params.slug,
      published: true
    },
    include: {
      author: {
        select: { name: true, email: true }
      },
      tags: true,
    }
  })

  if (!post) {
    notFound()
  }

  // Increment view count
  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } }
  })

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back to posts */}
      <div className="mb-8">
        <Link 
          href="/posts" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all posts
        </Link>
      </div>

      <article>
        {/* Post Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {post.publishedAt && format(new Date(post.publishedAt), 'MMMM d, yyyy')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {Math.ceil(post.content.length / 1000)} min read
            </div>
            <div className="flex items-center gap-2">
              👁️ {post.viewCount} views
            </div>
          </div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-gray-700 dark:to-gray-600 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Post Content */}
        <div 
          className="prose prose-lg max-w-none prose-blue dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Post Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              By {post.author.name || post.author.email}
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/posts"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                More posts →
              </Link>
            </div>
          </div>
        </footer>
      </article>
    </div>
  )
}

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true }
  })

  return posts.map((post) => ({
    slug: post.slug,
  }))
}