'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, FileText, Settings, BarChart3, Users } from 'lucide-react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin/signin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session.user.name || session.user.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Quick Actions */}
          <Link href="/admin/posts/new" className="group">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-blue-400">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <PlusCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">New Post</h3>
                  <p className="text-gray-600 text-sm">Create a new blog post</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/posts" className="group">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-green-400">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Manage Posts</h3>
                  <p className="text-gray-600 text-sm">Edit existing posts</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/pages" className="group">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-yellow-400">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Settings className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pages</h3>
                  <p className="text-gray-600 text-sm">Manage site pages</p>
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-purple-200">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                <p className="text-gray-600 text-sm">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-gray-600">
            <p>No recent activity yet. Start by creating your first post!</p>
          </div>
        </div>
      </div>
    </div>
  )
}