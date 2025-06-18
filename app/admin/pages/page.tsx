'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { PlusCircle, Edit, Trash2, Eye, Settings, ArrowLeft } from 'lucide-react'

interface Page {
  id: string
  title: string
  slug: string
  isDynamic: boolean
  visible: boolean
  order: number
  updatedAt: string
}

export default function PagesPage() {
  const { data: session } = useSession()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchPages()
    }
  }, [session])

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/pages')
      if (response.ok) {
        const data = await response.json()
        setPages(data)
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (pageId: string, pageTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove the page from the local state
        setPages(pages.filter(page => page.id !== pageId))
      } else {
        const error = await response.json()
        alert(`Failed to delete page: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to delete page. Please try again.')
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
            <h1 className="text-3xl font-bold text-gray-900">Manage Pages</h1>
          </div>
          
          <Link
            href="/admin/pages/new"
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Page
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 font-medium text-gray-900">Page</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-900">Type</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-900">Status</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-900">Order</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{page.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">/{page.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          page.isDynamic
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {page.isDynamic ? 'Dynamic' : 'Static'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          page.visible
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {page.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {page.order}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {page.visible && (
                          <Link
                            href={`/${page.slug}`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View page"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/pages/${page.id}/edit`}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit page"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(page.id, page.title)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete page"
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
      </div>
    </div>
  )
}