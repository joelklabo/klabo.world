import { StorageProvider, StorageType } from './types'
import { LocalStorageProvider } from './local'
import { AzureStorageProvider } from './azure'

let storageInstance: StorageProvider | null = null

export function getStorage(): StorageProvider {
  if (!storageInstance) {
    const storageType = (process.env.STORAGE_TYPE || 'local') as StorageType
    
    switch (storageType) {
      case 'azure':
        storageInstance = new AzureStorageProvider()
        break
      case 'local':
      default:
        storageInstance = new LocalStorageProvider()
        break
    }
  }
  
  return storageInstance
}

export * from './types'