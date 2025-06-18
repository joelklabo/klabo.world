import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/db'

export default async function PostsPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: {
        select: { name: true, email: true }
      },
      tags: true,
    },
    orderBy: { publishedAt: 'desc' }
  })

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-blue-600">All</span>{' '}
          <span className="text-gray-900 dark:text-white">Posts</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Explore all the articles and thoughts shared here.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            No posts yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Check back soon for new content!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-400"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link href={`/posts/${post.slug}`}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2">
                      {post.title}
                    </h2>
                  </Link>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.publishedAt && format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.ceil(post.content.length / 1000)} min read
                    </div>
                  </div>
                </div>
              </div>

              {post.excerpt && (
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-gray-700 dark:to-gray-600 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <Link
                href={`/posts/${post.slug}`}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Read more
                <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}