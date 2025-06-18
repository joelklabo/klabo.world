import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'
import { StorageProvider, StorageResult } from './types'

export class AzureStorageProvider implements StorageProvider {
  private containerClient: ContainerClient

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'blog-images'
    
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is required')
    }
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    this.containerClient = blobServiceClient.getContainerClient(containerName)
  }

  async upload(file: File | Buffer, filename: string): Promise<StorageResult> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(filename)
    
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
    
    const uploadOptions = type ? { blobHTTPHeaders: { blobContentType: type } } : {}
    
    await blockBlobClient.upload(buffer, size, uploadOptions)
    
    return {
      url: blockBlobClient.url,
      path: filename,
      size,
      type
    }
  }

  async delete(url: string): Promise<void> {
    const filename = url.split('/').pop()
    if (!filename) throw new Error('Invalid URL')
    
    const blockBlobClient = this.containerClient.getBlockBlobClient(filename)
    await blockBlobClient.deleteIfExists()
  }

  getUrl(path: string): string {
    return this.containerClient.getBlockBlobClient(path).url
  }
}