'use client'

import { useEffect, useState } from 'react'
import { Star, GitFork, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface GitHubRepo {
  id: number
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
  updated_at: string
  fork: boolean
}

const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  Swift: '#FA7343',
  // Add more as needed
}

export function GitHubRepos() {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/github/repos')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        setRepos(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching repos:', err)
        setError('Failed to load repositories')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gradient-to-br from-blue-50 to-purple-50 dark:bg-gray-800 rounded-xl p-6 animate-pulse border-2 border-blue-200">
            <div className="h-4 bg-blue-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-green-300 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-3 bg-yellow-300 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || repos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        {error || 'No repositories found'}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {repos.map((repo) => (
        <a
          key={repo.id}
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-green-400"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {repo.name}
            </h3>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 ml-2" />
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {repo.description || 'No description available'}
          </p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                {repo.stargazers_count}
              </span>
              {repo.language && (
                <span className="flex items-center gap-1">
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: languageColors[repo.language] || '#ccc' }}
                  />
                  {repo.language}
                </span>
              )}
            </div>
            <span className="text-gray-500 dark:text-gray-500 text-xs">
              {format(new Date(repo.updated_at), 'MMM d')}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}