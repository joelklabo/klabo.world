'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TiptapEditor } from '@/components/Editor/TiptapEditor'
import { generateSlug } from '@/lib/utils/slug'
import { Save, Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPostPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [published, setPublished] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [publishDate, setPublishDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          excerpt: excerpt.trim() || undefined,
          published: published && !scheduled,
          scheduled,
          publishDate: scheduled ? publishDate : undefined,
          slug: generateSlug(title),
        }),
      })

      if (response.ok) {
        const post = await response.json()
        router.push(`/admin/posts/${post.id}`)
      } else {
        alert('Failed to save post')
      }
    } catch (error) {
      alert('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (scheduled) {
                  setScheduled(false)
                  setPublished(false)
                } else {
                  setPublished(!published)
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                published && !scheduled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {published && !scheduled ? 'Published' : 'Draft'}
            </button>
            
            <button
              onClick={() => {
                setScheduled(!scheduled)
                if (!scheduled) {
                  setPublished(false)
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                scheduled 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {scheduled ? 'Scheduled' : 'Schedule'}
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Post'}
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title..."
                className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder-gray-400"
              />
              {title && (
                <p className="text-sm text-gray-500 mt-2">
                  Slug: {generateSlug(title)}
                </p>
              )}
            </div>

            {/* Content Editor */}
            <div>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your post..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Excerpt */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Excerpt</h3>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description of your post..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Optional. If not provided, it will be auto-generated from content.
              </p>
            </div>

            {/* Publishing Options */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Publishing</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={published && !scheduled}
                    onChange={(e) => {
                      setPublished(e.target.checked)
                      if (e.target.checked) setScheduled(false)
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Publish immediately
                  </span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scheduled}
                    onChange={(e) => {
                      setScheduled(e.target.checked)
                      if (e.target.checked) setPublished(false)
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Schedule for later
                  </span>
                </label>
                
                {scheduled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publish Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  {published && !scheduled
                    ? 'This post will be visible to all visitors' 
                    : scheduled
                    ? 'This post will be published at the scheduled time'
                    : 'This post will be saved as a draft'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}