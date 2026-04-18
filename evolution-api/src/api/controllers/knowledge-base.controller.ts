import { CreateKnowledgeBaseDto, LinkKnowledgeBaseDto, SearchKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '@api/dto/knowledge-base.dto';
import { KnowledgeBaseService } from '@api/services/knowledge-base.service';
import { Logger } from '@config/logger.config';
import { KnowledgeBase, AgentKnowledgeBase } from '@prisma/client';

export class KnowledgeBaseController {
  private readonly logger = new Logger('KnowledgeBaseController');

  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  async create(data: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    return await this.knowledgeBaseService.create(data);
  }

  async findAll(): Promise<KnowledgeBase[]> {
    return await this.knowledgeBaseService.findAll();
  }

  async findById(id: string): Promise<KnowledgeBase | null> {
    return await this.knowledgeBaseService.findById(id);
  }

  async update(id: string, data: UpdateKnowledgeBaseDto): Promise<KnowledgeBase> {
    return await this.knowledgeBaseService.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return await this.knowledgeBaseService.delete(id);
  }

  async upload(file: any): Promise<{ knowledgeBase: KnowledgeBase; extractedContent: string }> {
    return await this.knowledgeBaseService.uploadFile(file);
  }

  async search(data: SearchKnowledgeBaseDto): Promise<KnowledgeBase[]> {
    return await this.knowledgeBaseService.search(data.query, data.limit);
  }

  // Agent-KnowledgeBase linking methods
  async getAgentKnowledgeBases(agentId: string): Promise<KnowledgeBase[]> {
    return await this.knowledgeBaseService.getAgentKnowledgeBases(agentId);
  }

  async linkAgentKnowledgeBase(agentId: string, data: LinkKnowledgeBaseDto): Promise<AgentKnowledgeBase> {
    return await this.knowledgeBaseService.linkAgentKnowledgeBase(agentId, data.knowledgeBaseId);
  }

  async unlinkAgentKnowledgeBase(agentId: string, knowledgeBaseId: string): Promise<void> {
    return await this.knowledgeBaseService.unlinkAgentKnowledgeBase(agentId, knowledgeBaseId);
  }

  async getKnowledgeBaseAgents(knowledgeBaseId: string): Promise<{ agentId: string }[]> {
    return await this.knowledgeBaseService.getKnowledgeBaseAgents(knowledgeBaseId);
  }
}