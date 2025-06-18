import Link from 'next/link'
import { Github, Calendar } from 'lucide-react'
import { GitHubRepos } from '@/components/GitHub/GitHubRepos'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'

export default async function HomePage() {
  const recentPosts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: {
        select: { name: true, email: true }
      },
      tags: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 3
  })
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="text-blue-600">Welcome</span>{' '}
          <span className="text-red-600">to</span>{' '}
          <span className="text-green-600">{process.env.NEXT_PUBLIC_SITE_NAME || 'My Blog'}</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'A personal blog about technology and life'}
        </p>
      </section>

      {/* Recent Posts Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">
            <span className="text-yellow-500">Recent</span>{' '}
            <span className="text-gray-900 dark:text-white">Posts</span>
          </h2>
          <Link 
            href="/posts" 
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentPosts.length === 0 ? (
            <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-md p-6 border-2 border-transparent hover:border-blue-400 transition-all">
              <h3 className="text-xl font-semibold mb-2">Coming Soon! 🚀</h3>
              <p className="text-gray-600 dark:text-gray-300">Posts will appear here once published.</p>
            </div>
          ) : (
            recentPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.slug}`} className="group">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-blue-400">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {post.publishedAt && format(new Date(post.publishedAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* GitHub Repos Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Github className="w-8 h-8 text-gray-800 dark:text-white" />
            <span className="text-red-500">Recent</span>{' '}
            <span className="text-gray-900 dark:text-white">GitHub Activity</span>
          </h2>
        </div>
        <GitHubRepos />
      </section>
    </div>
  )
}