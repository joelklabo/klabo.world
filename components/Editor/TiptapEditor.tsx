'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function TiptapEditor({ content, onChange, placeholder = "Start writing..." }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-700 underline',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  })

  const addImage = () => {
    // Create file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          editor?.chain().focus().setImage({ src: data.url, alt: file.name }).run()
        } else {
          const error = await response.json()
          alert(`Upload failed: ${error.error}`)
        }
      } catch (error) {
        alert('Upload failed. Please try again.')
      }
    }
    
    input.click()
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-3 flex flex-wrap gap-2 z-10">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded border hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-blue-200 text-blue-700 border-blue-300' : 'bg-white border-gray-200 text-gray-700'}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded border hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-blue-200 text-blue-700 border-blue-300' : 'bg-white border-gray-200 text-gray-700'}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded border hover:bg-gray-200 transition-colors ${editor.isActive('strike') ? 'bg-blue-200 text-blue-700 border-blue-300' : 'bg-white border-gray-200 text-gray-700'}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded border hover:bg-gray-200 transition-colors ${editor.isActive('code') ? 'bg-blue-200 text-blue-700 border-blue-300' : 'bg-white border-gray-200 text-gray-700'}`}
          title="Code"
        >
          <Code className="w-4 h-4" />
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded border hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-blue-200 text-blue-700 border-blue-300' : 'bg-white border-gray-200 text-gray-700'}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded border hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-blue-200 text-blue-700 border-blue-300' : 'bg-white border-gray-200 text-gray-700'}`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded border hover:bg-gray-200 transition-colors ${editor.isActive('blockquote') ? 'bg-blue-200 text-blue-700 border-blue-300' : 'bg-white border-gray-200 text-gray-700'}`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          onClick={addLink}
          className="p-2 rounded border hover:bg-gray-200 transition-colors bg-white border-gray-200 text-gray-700"
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        
        <button
          onClick={addImage}
          className="p-2 rounded border hover:bg-gray-200 transition-colors bg-white border-gray-200 text-gray-700"
          title="Add Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded border hover:bg-gray-200 transition-colors bg-white border-gray-200 text-gray-700 disabled:opacity-50"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded border hover:bg-gray-200 transition-colors bg-white border-gray-200 text-gray-700 disabled:opacity-50"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
      
      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="bg-white min-h-[300px]"
      />
    </div>
  )
}