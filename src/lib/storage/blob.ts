import { put, del } from '@vercel/blob';
import { logger } from '@/lib/logger';

/**
 * Upload a file/buffer to Vercel Blob storage.
 * @param filename The desired filename (will be prepended with a folder path if provided or unique hash)
 * @param body The buffer, string, or stream to upload
 * @param contentType The MIME type (e.g. 'application/pdf', 'image/png')
 * @returns The public URL of the uploaded blob
 */
export async function uploadBlob(
  filename: string,
  body: Buffer | string | ReadableStream | Blob,
  contentType: string,
): Promise<string> {
  try {
    const { url } = await put(filename, body, {
      access: 'public',
      contentType,
    });
    logger.info('Blob uploaded successfully', { url, filename });
    return url;
  } catch (error) {
    logger.error('Failed to upload blob', error, { filename });
    throw new Error(
      `Failed to upload file to cloud storage: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Delete a file from Vercel Blob storage.
 * @param url The public URL of the blob to delete
 */
export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
    logger.info('Blob deleted successfully', { url });
  } catch (error) {
    logger.error('Failed to delete blob', error, { url });
    throw new Error(
      `Failed to delete file from cloud storage: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
