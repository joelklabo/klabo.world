import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    post: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}))

// Mock the GitHub component
jest.mock('@/components/GitHub/GitHubRepos', () => {
  return function MockGitHubRepos() {
    return <div data-testid="github-repos">GitHub Repos</div>
  }
})

describe('HomePage', () => {
  it('renders the welcome message', async () => {
    const HomePage_ = await HomePage()
    render(HomePage_)
    
    expect(screen.getByText(/Welcome to/)).toBeInTheDocument()
  })

  it('renders the GitHub repos section', async () => {
    const HomePage_ = await HomePage()
    render(HomePage_)
    
    expect(screen.getByTestId('github-repos')).toBeInTheDocument()
  })
})