import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  async uploadFile(file: any, path: string): Promise<string> {
    this.logger.log(`[Storage Stub] Uploading file to ${path}`);
    return `https://storage.placeholder.url/${path}`;
  }

  async deleteFile(path: string): Promise<void> {
    this.logger.log(`[Storage Stub] Deleting file at ${path}`);
  }

  async getFileUrl(path: string): Promise<string> {
    return `https://storage.placeholder.url/${path}`;
  }
}
