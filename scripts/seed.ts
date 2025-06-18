import { prisma } from '../lib/db'
import { generateSlug } from '../lib/utils/slug'

async function seed() {
  console.log('Seeding database...')
  
  try {
    // Create default admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
    })
    
    console.log('Created admin user:', adminUser.email)
    
    // Create sample tags
    const tags = await Promise.all([
      prisma.tag.upsert({
        where: { slug: 'javascript' },
        update: {},
        create: { name: 'JavaScript', slug: 'javascript' },
      }),
      prisma.tag.upsert({
        where: { slug: 'typescript' },
        update: {},
        create: { name: 'TypeScript', slug: 'typescript' },
      }),
      prisma.tag.upsert({
        where: { slug: 'react' },
        update: {},
        create: { name: 'React', slug: 'react' },
      }),
    ])
    
    console.log('Created tags:', tags.map(t => t.name).join(', '))
    
    // Create social links
    const socialLinks = await Promise.all([
      prisma.socialLink.upsert({
        where: { id: 'twitter' },
        update: {},
        create: {
          id: 'twitter',
          platform: 'Twitter',
          url: 'https://twitter.com/yourusername',
          icon: 'twitter',
          order: 1,
        },
      }),
      prisma.socialLink.upsert({
        where: { id: 'github' },
        update: {},
        create: {
          id: 'github',
          platform: 'GitHub',
          url: 'https://github.com/yourusername',
          icon: 'github',
          order: 2,
        },
      }),
      prisma.socialLink.upsert({
        where: { id: 'linkedin' },
        update: {},
        create: {
          id: 'linkedin',
          platform: 'LinkedIn',
          url: 'https://linkedin.com/in/yourusername',
          icon: 'linkedin',
          order: 3,
        },
      }),
    ])
    
    console.log('Created social links')
    
    // Create sample pages
    await prisma.page.upsert({
      where: { slug: 'about' },
      update: {},
      create: {
        slug: 'about',
        title: 'About',
        content: '# About Me\\n\\nThis is your about page. Edit this content in the admin panel.',
        order: 1,
      },
    })
    
    await prisma.page.upsert({
      where: { slug: 'privacy' },
      update: {},
      create: {
        slug: 'privacy',
        title: 'Privacy Policy',
        content: '# Privacy Policy\\n\\nYour privacy policy content goes here.',
        order: 2,
      },
    })
    
    console.log('Created default pages')
    
    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})