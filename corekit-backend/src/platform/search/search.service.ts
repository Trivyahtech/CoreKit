import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  async indexDocument(index: string, id: string, document: any): Promise<void> {
    this.logger.log(`[Search Stub] Indexing document ${id} into ${index}`);
  }

  async search(index: string, query: string): Promise<any[]> {
    this.logger.log(`[Search Stub] Searching for "${query}" in ${index}`);
    return [];
  }

  async deleteDocument(index: string, id: string): Promise<void> {
    this.logger.log(`[Search Stub] Deleting document ${id} from ${index}`);
  }
}
