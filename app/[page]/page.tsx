import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

interface PageProps {
  params: {
    page: string
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const page = await prisma.page.findUnique({
    where: { 
      slug: params.page,
      visible: true
    }
  })

  if (!page) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {page.title}
        </h1>
      </header>

      <article className="prose prose-lg max-w-none">
        <div
          dangerouslySetInnerHTML={{ __html: page.content }}
          className="prose prose-lg max-w-none"
        />
      </article>

      {/* Dynamic code execution area */}
      {page.isDynamic && page.customCode && (
        <div className="mt-12 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Interactive Section
          </h3>
          <div className="text-gray-600 dark:text-gray-300">
            <p>Dynamic content would be rendered here based on the custom code.</p>
            <p className="text-sm mt-2">
              Custom code: <code className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-sm">
                {page.customCode.slice(0, 50)}...
              </code>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export async function generateStaticParams() {
  const pages = await prisma.page.findMany({
    where: { visible: true },
    select: { slug: true }
  })

  return pages.map((page) => ({
    page: page.slug,
  }))
}