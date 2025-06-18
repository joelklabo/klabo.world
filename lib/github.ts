import { prisma } from './db'

export interface GitHubRepo {
  id: number
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
  updated_at: string
  fork: boolean
}

export async function getGitHubRepos(username: string, count: number = 6): Promise<GitHubRepo[]> {
  const cacheKey = `github-repos-${username}-${count}`
  
  try {
    // Check cache first
    const cached = await prisma.gitHubCache.findUnique({
      where: { key: cacheKey }
    })
    
    if (cached && cached.expiresAt > new Date()) {
      return JSON.parse(cached.data) as GitHubRepo[]
    }
    
    // Fetch from GitHub API
    const token = process.env.GITHUB_TOKEN
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    }
    
    if (token && token !== 'your_github_personal_access_token') {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=${count * 2}`,
      { headers }
    )
    
    if (!response.ok) {
      console.warn(`GitHub API error: ${response.status} - Using mock data`)
      return [] // Return empty array instead of throwing
    }
    
    const repos: GitHubRepo[] = await response.json()
    
    // Filter out forks and take the requested count
    const filteredRepos = repos
      .filter(repo => !repo.fork)
      .slice(0, count)
    
    // Update cache
    await prisma.gitHubCache.upsert({
      where: { key: cacheKey },
      update: {
        data: JSON.stringify(filteredRepos),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      },
      create: {
        key: cacheKey,
        data: JSON.stringify(filteredRepos),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      }
    })
    
    return filteredRepos
  } catch (error) {
    console.error('Error fetching GitHub repos:', error)
    
    // Return cached data even if expired
    const cached = await prisma.gitHubCache.findUnique({
      where: { key: cacheKey }
    })
    
    if (cached) {
      return JSON.parse(cached.data) as GitHubRepo[]
    }
    
    return []
  }
}