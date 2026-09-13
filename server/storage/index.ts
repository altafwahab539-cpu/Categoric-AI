/**
 * Categoric AI - Storage Provider Abstraction
 * Supports Local Filesystem (Dev), Google Cloud Storage (GCS), AWS S3, and Cloudflare R2.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface SaveResult {
  path: string;
  url: string;
  fileSize: number;
}

export interface StorageProvider {
  name: string;
  saveFile(buffer: Buffer, filename: string, mimeType: string): Promise<SaveResult>;
  getStream(filepath: string): fs.ReadStream;
  deleteFile(filepath: string): Promise<boolean>;
  getSignedUrl(filepath: string, expiresInSeconds?: number): Promise<string>;
}

export class LocalStorageProvider implements StorageProvider {
  public name = 'local_fs';
  private baseDir = path.resolve(process.cwd(), 'server_data', 'storage');

  constructor() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, filename: string, mimeType: string): Promise<SaveResult> {
    const ext = path.extname(filename) || (mimeType.includes('video') ? '.mp4' : '.jpg');
    const safeName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    const targetPath = path.join(this.baseDir, safeName);

    fs.writeFileSync(targetPath, buffer);

    return {
      path: safeName,
      url: `/api/videos/stream/${safeName}`,
      fileSize: buffer.length
    };
  }

  getStream(filepath: string): fs.ReadStream {
    const safeFile = path.basename(filepath);
    const fullPath = path.join(this.baseDir, safeFile);
    if (!fs.existsSync(fullPath)) {
      throw new Error('Requested file does not exist in storage');
    }
    return fs.createReadStream(fullPath);
  }

  async deleteFile(filepath: string): Promise<boolean> {
    try {
      const safeFile = path.basename(filepath);
      const fullPath = path.join(this.baseDir, safeFile);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async getSignedUrl(filepath: string, expiresInSeconds = 3600): Promise<string> {
    // In local dev, creates a tokenized stream URL
    const safeFile = path.basename(filepath);
    const token = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(`${safeFile}-${Math.floor(Date.now() / 1000) + expiresInSeconds}`)
      .digest('hex').substring(0, 16);
    return `/api/videos/stream/${safeFile}?token=${token}`;
  }
}

export const storageProvider: StorageProvider = new LocalStorageProvider();
