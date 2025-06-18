'use client'

import Link from 'next/link'
import { Github, Twitter, Linkedin, Menu, X } from 'lucide-react'
import { useState } from 'react'

const socialLinks = [
  { 
    icon: Twitter, 
    href: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '#',
    label: 'Twitter'
  },
  { 
    icon: Github, 
    href: process.env.NEXT_PUBLIC_GITHUB_PROFILE || '#',
    label: 'GitHub'
  },
  { 
    icon: Linkedin, 
    href: process.env.NEXT_PUBLIC_LINKEDIN_PROFILE || '#',
    label: 'LinkedIn'
  },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-blue-500 dark:bg-slate-900 dark:border-blue-400">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span className="text-2xl">🌍</span>
              <span>{process.env.NEXT_PUBLIC_SITE_NAME || 'My Blog'}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors">
              Home
            </Link>
            <Link href="/posts" className="text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 font-medium transition-colors">
              Posts
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 font-medium transition-colors">
              About
            </Link>
            
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
              {socialLinks.map((link, index) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-600 transition-colors ${
                    index === 0 ? 'hover:text-blue-500' : 
                    index === 1 ? 'hover:text-gray-900 dark:hover:text-white' : 
                    'hover:text-blue-700'
                  }`}
                  aria-label={link.label}
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/posts" 
                className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Posts
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    aria-label={link.label}
                  >
                    <link.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}