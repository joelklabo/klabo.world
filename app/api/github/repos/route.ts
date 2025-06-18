import { NextResponse } from 'next/server'
import { getGitHubRepos } from '@/lib/github'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username') || process.env.GITHUB_USERNAME
    const count = parseInt(searchParams.get('count') || '6')
    
    if (!username || username === 'your_github_username') {
      // Return empty array if not configured
      return NextResponse.json([])
    }
    
    const repos = await getGitHubRepos(username, count)
    
    return NextResponse.json(repos)
  } catch (error) {
    console.error('Error in GitHub API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}