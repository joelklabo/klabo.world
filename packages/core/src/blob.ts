import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

export interface BlobConfig {
  accountName: string;
  accountKey: string;
  container: string;
}

export function createBlobContainerClient(config: BlobConfig) {
  const credential = new StorageSharedKeyCredential(config.accountName, config.accountKey);
  const client = new BlobServiceClient(`https://${config.accountName}.blob.core.windows.net`, credential);
  return client.getContainerClient(config.container);
}

export async function uploadBuffer(
  containerClient: ReturnType<typeof createBlobContainerClient>,
  filename: string,
  buffer: Buffer,
  mimeType: string,
  metadata?: Record<string, string>,
) {
  await containerClient.createIfNotExists();
  const blockBlob = containerClient.getBlockBlobClient(filename);
  await blockBlob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: mimeType }, metadata });
  return blockBlob.url;
}
