export class CreateKnowledgeBaseDto {
  name: string;
  description?: string;
  content: string;
  contentType?: string;
  filePath?: string;
  fileName?: string;
}

export class UpdateKnowledgeBaseDto {
  name?: string;
  description?: string;
  content?: string;
  contentType?: string;
  filePath?: string;
  fileName?: string;
}

export class SearchKnowledgeBaseDto {
  query: string;
  limit?: number;
}

export class LinkKnowledgeBaseDto {
  knowledgeBaseId: string;
}