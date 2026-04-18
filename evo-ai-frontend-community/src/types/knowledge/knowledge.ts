// Knowledge Base Types - Match Evolution API Schema

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  content: string;
  contentType: string;
  filePath?: string;
  fileName?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBaseResponse {
  data: KnowledgeBase[];
  meta?: {
    pagination?: {
      page: number;
      page_size?: number;
      total?: number;
      total_pages?: number;
      has_next_page?: boolean;
      has_previous_page?: boolean;
    };
    count?: number;
    current_page?: number;
    pages?: number;
  };
  success?: boolean;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  content: string;
  contentType?: string;
}

export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  content?: string;
  contentType?: string;
}

export interface SearchKnowledgeBaseDto {
  query: string;
  limit?: number;
}

export interface LinkKnowledgeBaseDto {
  knowledgeBaseId: string;
}

export interface DocumentUploadResponse {
  knowledgeBase: KnowledgeBase;
  extractedContent: string;
}

export interface AgentKnowledgeBaseLink {
  agentId: string;
  linkedAt?: string;
}

export interface KnowledgeBaseState {
  knowledgeBases: KnowledgeBase[];
  selectedKnowledgeBaseIds: string[];
  meta: {
    pagination: {
      page: number;
      page_size?: number;
      total?: number;
      total_pages?: number;
      has_next_page?: boolean;
      has_previous_page?: boolean;
    };
  };
  loading: {
    list: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    upload: boolean;
    search: boolean;
  };
  searchQuery: string;
  sortBy: 'name' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
