import api from '@/services/core/api';
import {
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  KnowledgeSearchResponse,
  DocumentUploadResponse,
  KnowledgeBaseResponse,
} from '@/types/knowledge/knowledge';

class KnowledgeService {
  /**
   * List all knowledge bases
   */
  async listKnowledgeBases(): Promise<KnowledgeBase[]> {
    const response = await api.get('/knowledge-base');
    return response.data;
  }

  /**
   * Get a single knowledge base by ID
   */
  async getKnowledgeBase(knowledgeId: string): Promise<KnowledgeBase> {
    const response = await api.get(`/knowledge-base/${knowledgeId}`);
    return response.data;
  }

  /**
   * Create a new knowledge base
   */
  async createKnowledgeBase(data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    const response = await api.post('/knowledge-base', data);
    return response.data;
  }

  /**
   * Update an existing knowledge base
   */
  async updateKnowledgeBase(knowledgeId: string, data: UpdateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    const response = await api.put(`/knowledge-base/${knowledgeId}`, data);
    return response.data;
  }

  /**
   * Delete a knowledge base
   */
  async deleteKnowledgeBase(knowledgeId: string): Promise<void> {
    await api.delete(`/knowledge-base/${knowledgeId}`);
  }

  /**
   * Upload a document (creates a new knowledge base from file)
   */
  async uploadDocument(file: File, onProgress?: (progress: number) => void): Promise<KnowledgeBase> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/knowledge-base/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data.knowledgeBase;
  }

  /**
   * Search knowledge bases
   */
  async searchKnowledge(query: string, limit: number = 10): Promise<KnowledgeBase[]> {
    const response = await api.post('/knowledge-base/search', { query, limit });
    return response.data;
  }

  /**
   * Get knowledge bases linked to an agent
   */
  async getAgentKnowledgeBases(agentId: string): Promise<KnowledgeBase[]> {
    const response = await api.get(`/agent/${agentId}/knowledge-bases`);
    return response.data;
  }

  /**
   * Link a knowledge base to an agent
   */
  async linkToAgent(agentId: string, knowledgeBaseId: string): Promise<void> {
    await api.post(`/agent/${agentId}/knowledge-bases`, { knowledgeBaseId });
  }

  /**
   * Unlink a knowledge base from an agent
   */
  async unlinkFromAgent(agentId: string, knowledgeBaseId: string): Promise<void> {
    await api.delete(`/agent/${agentId}/knowledge-bases/${knowledgeBaseId}`);
  }

  /**
   * Get agents linked to a knowledge base
   */
  async getKnowledgeBaseAgents(knowledgeBaseId: string): Promise<{ agentId: string }[]> {
    const response = await api.get(`/knowledge-base/${knowledgeBaseId}/agents`);
    return response.data;
  }
}

export const knowledgeService = new KnowledgeService();

// Export individual functions for backward compatibility
export const listKnowledgeBases = () =>
  knowledgeService.listKnowledgeBases();

export const getKnowledgeBase = (knowledgeId: string) =>
  knowledgeService.getKnowledgeBase(knowledgeId);

export const createKnowledgeBase = (data: CreateKnowledgeBaseRequest) =>
  knowledgeService.createKnowledgeBase(data);

export const updateKnowledgeBase = (knowledgeId: string, data: UpdateKnowledgeBaseRequest) =>
  knowledgeService.updateKnowledgeBase(knowledgeId, data);

export const deleteKnowledgeBase = (knowledgeId: string) =>
  knowledgeService.deleteKnowledgeBase(knowledgeId);

export const uploadDocument = (file: File, onProgress?: (progress: number) => void) =>
  knowledgeService.uploadDocument(file, onProgress);

export const searchKnowledge = (query: string, limit?: number) =>
  knowledgeService.searchKnowledge(query, limit);

export const linkToAgent = (agentId: string, knowledgeBaseId: string) =>
  knowledgeService.linkToAgent(agentId, knowledgeBaseId);

export const unlinkFromAgent = (agentId: string, knowledgeBaseId: string) =>
  knowledgeService.unlinkFromAgent(agentId, knowledgeBaseId);

export const getAgentKnowledgeBases = (agentId: string) =>
  knowledgeService.getAgentKnowledgeBases(agentId);

export const getKnowledgeBaseAgents = (knowledgeBaseId: string) =>
  knowledgeService.getKnowledgeBaseAgents(knowledgeBaseId);