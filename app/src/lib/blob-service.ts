import { createBlobContainerClient, uploadBuffer as coreUploadBuffer } from '@klaboworld/core';

const accountName = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER ?? 'uploads';

let containerClient: ReturnType<typeof createBlobContainerClient> | null = null;

export function getBlobClient() {
  if (!accountName || !accountKey) {
    throw new Error('Azure storage credentials missing');
  }
  if (!containerClient) {
    containerClient = createBlobContainerClient({
      accountName,
      accountKey,
      container: containerName,
    });
  }
  return containerClient;
}

export async function uploadBuffer(filename: string, buffer: Buffer, mimeType: string) {
  const container = getBlobClient();
  return coreUploadBuffer(container, filename, buffer, mimeType);
}
