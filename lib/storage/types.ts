export interface StorageProvider {
  upload(file: File | Buffer, filename: string): Promise<StorageResult>
  delete(url: string): Promise<void>
  getUrl(path: string): string
}

export interface StorageResult {
  url: string
  path: string
  size: number
  type?: string
}

export type StorageType = 'local' | 'azure'