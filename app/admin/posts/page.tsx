'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { PlusCircle, Edit, Trash2, Eye, Calendar, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published: boolean
  publishedAt: string | null
  createdAt: string
  author: {
    name: string | null
    email: string
  }
  _count: {
    images: number
  }
}

export default function PostsPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchPosts()
    }
  }, [session])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove the post from the local state
        setPosts(posts.filter(post => post.id !== postId))
      } else {
        const error = await response.json()
        alert(`Failed to delete post: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to delete post. Please try again.')
    }
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Manage Posts</h1>
          </div>
          
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Post
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h2>
            <p className="text-gray-600 mb-6">Get started by creating your first blog post.</p>
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium text-gray-900">Title</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-900">Status</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-900">Date</th>
                    <th className="text-right px-6 py-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{post.title}</h3>
                          {post.excerpt && (
                            <p className="text-sm text-gray-600 mt-1 truncate max-w-md">
                              {post.excerpt}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">/{post.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {post.publishedAt
                            ? format(new Date(post.publishedAt), 'MMM d, yyyy')
                            : format(new Date(post.createdAt), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {post.published && (
                            <Link
                              href={`/posts/${post.slug}`}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View post"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit post"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}