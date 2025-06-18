export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-white dark:bg-slate-900 border-t-4 border-blue-500 dark:border-blue-400">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-700 dark:text-gray-300 text-sm mb-4 md:mb-0 font-medium">
            © {currentYear} <span className="text-blue-600">{process.env.NEXT_PUBLIC_SITE_NAME || 'My Blog'}</span>. All rights reserved.
          </div>
          
          <div className="flex space-x-6 text-sm">
            <a 
              href="/rss" 
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 font-medium transition-colors"
            >
              RSS
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}