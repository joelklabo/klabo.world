import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const accountName = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER ?? 'uploads';

let client: BlobServiceClient | null = null;

export function getBlobClient() {
  if (!accountName || !accountKey) {
    throw new Error('Azure storage credentials missing');
  }
  if (!client) {
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    client = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
  }
  return client.getContainerClient(containerName);
}

export async function uploadBuffer(filename: string, buffer: Buffer, mimeType: string) {
  const container = getBlobClient();
  await container.createIfNotExists();
  const blockBlob = container.getBlockBlobClient(filename);
  await blockBlob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: mimeType } });
  return blockBlob.url;
}
