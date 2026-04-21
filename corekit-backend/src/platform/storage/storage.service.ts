import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface UploadInput {
  buffer: Buffer;
  originalName?: string;
  mimeType?: string;
}

export interface StoredObject {
  key: string;
  url: string;
  size: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: string;
  private readonly root: string;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService) {
    this.driver = this.config.get<string>('STORAGE_DRIVER', 'local');
    this.root = path.resolve(
      process.cwd(),
      this.config.get<string>('STORAGE_LOCAL_ROOT', './storage'),
    );
    this.publicBase = this.config
      .get<string>('STORAGE_PUBLIC_BASE_URL', 'http://localhost:6767/uploads')
      .replace(/\/$/, '');
    if (this.driver !== 'local') {
      this.logger.warn(
        `STORAGE_DRIVER=${this.driver} not implemented yet — falling back to local filesystem`,
      );
    }
  }

  async upload(tenantId: string, input: UploadInput, subdir = 'uploads'): Promise<StoredObject> {
    if (!input?.buffer || input.buffer.length === 0) {
      throw new BadRequestException('Empty file');
    }
    const safeSub = subdir.replace(/[^a-z0-9/_-]/gi, '');
    const ext = this.extFromName(input.originalName) ?? this.extFromMime(input.mimeType) ?? 'bin';
    const key = `${tenantId}/${safeSub}/${Date.now()}-${randomUUID()}.${ext}`;
    const abs = path.join(this.root, key);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, input.buffer);
    return { key, url: `${this.publicBase}/${key}`, size: input.buffer.length };
  }

  async delete(key: string): Promise<void> {
    const abs = this.resolveSafe(key);
    try {
      await fs.unlink(abs);
    } catch (err: any) {
      if (err?.code !== 'ENOENT') throw err;
    }
  }

  getUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }

  createReadStream(key: string) {
    return createReadStream(this.resolveSafe(key));
  }

  private resolveSafe(key: string): string {
    const abs = path.resolve(this.root, key);
    if (!abs.startsWith(this.root + path.sep) && abs !== this.root) {
      throw new BadRequestException('Invalid object key');
    }
    return abs;
  }

  private extFromName(name?: string): string | undefined {
    if (!name) return undefined;
    const ext = path.extname(name).replace(/^\./, '').toLowerCase();
    return ext || undefined;
  }

  private extFromMime(mime?: string): string | undefined {
    if (!mime) return undefined;
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
    };
    return map[mime];
  }
}
