import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { StorageProvider, StorageResult } from './types'

export class LocalStorageProvider implements StorageProvider {
  private basePath: string
  private baseUrl: string

  constructor() {
    this.basePath = process.env.STORAGE_PATH || './uploads'
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  }

  async upload(file: File | Buffer, filename: string): Promise<StorageResult> {
    const uploadDir = join(process.cwd(), this.basePath)
    
    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true })
    
    const filePath = join(uploadDir, filename)
    
    let buffer: Buffer
    let size: number
    let type: string | undefined
    
    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer())
      size = file.size
      type = file.type
    } else {
      buffer = file
      size = buffer.length
    }
    
    await writeFile(filePath, buffer)
    
    return {
      url: this.getUrl(filename),
      path: filename,
      size,
      type
    }
  }

  async delete(url: string): Promise<void> {
    const filename = url.split('/').pop()
    if (!filename) throw new Error('Invalid URL')
    
    const filePath = join(process.cwd(), this.basePath, filename)
    
    try {
      await unlink(filePath)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  getUrl(path: string): string {
    return `${this.baseUrl}/api/uploads/${path}`
  }
}