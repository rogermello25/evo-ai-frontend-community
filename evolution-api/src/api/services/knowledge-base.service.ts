import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '@api/dto/knowledge-base.dto';
import { Logger } from '@config/logger.config';
import { KnowledgeBase, AgentKnowledgeBase } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class KnowledgeBaseService {
  private readonly logger = new Logger('KnowledgeBaseService');
  private readonly UPLOAD_DIR = './uploads/knowledge-base';

  constructor(private readonly prismaRepository: any) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  async create(data: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    try {
      const knowledgeBase = await this.prismaRepository.knowledgeBase.create({
        data: {
          name: data.name,
          description: data.description,
          content: data.content,
          contentType: data.contentType || 'manual',
          filePath: data.filePath,
          fileName: data.fileName,
        },
      });
      return knowledgeBase;
    } catch (error) {
      this.logger.error(`Failed to create knowledge base: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<KnowledgeBase[]> {
    try {
      return await this.prismaRepository.knowledgeBase.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find knowledge bases: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<KnowledgeBase | null> {
    try {
      return await this.prismaRepository.knowledgeBase.findUnique({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to find knowledge base: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateKnowledgeBaseDto): Promise<KnowledgeBase> {
    try {
      const knowledgeBase = await this.prismaRepository.knowledgeBase.update({
        where: { id },
        data,
      });
      return knowledgeBase;
    } catch (error) {
      this.logger.error(`Failed to update knowledge base: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Get the knowledge base to check for file path
      const knowledgeBase = await this.prismaRepository.knowledgeBase.findUnique({
        where: { id },
      });

      if (knowledgeBase?.filePath && fs.existsSync(knowledgeBase.filePath)) {
        fs.unlinkSync(knowledgeBase.filePath);
      }

      await this.prismaRepository.knowledgeBase.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete knowledge base: ${error.message}`);
      throw error;
    }
  }

  async uploadFile(
    file: any,
  ): Promise<{ knowledgeBase: KnowledgeBase; extractedContent: string }> {
    try {
      const { originalname, buffer, mimetype } = file;
      const fileId = uuidv4();
      const filePath = path.join(this.UPLOAD_DIR, `${fileId}-${originalname}`);

      // Save the file
      fs.writeFileSync(filePath, buffer);

      // Extract content based on file type
      const extractedContent = await this.extractContent(filePath, mimetype, originalname);

      // Create knowledge base entry
      const contentType = this.getContentType(mimetype);
      const knowledgeBase = await this.prismaRepository.knowledgeBase.create({
        data: {
          name: originalname.replace(/\.[^/.]+$/, ''),
          description: `Uploaded file: ${originalname}`,
          content: extractedContent,
          contentType,
          filePath,
          fileName: originalname,
        },
      });

      return { knowledgeBase, extractedContent };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  private async extractContent(
    filePath: string,
    mimetype: string,
    originalname: string,
  ): Promise<string> {
    const ext = path.extname(originalname).toLowerCase();

    try {
      if (ext === '.txt') {
        return fs.readFileSync(filePath, 'utf-8');
      }

      if (ext === '.pdf') {
        // For PDF files, use a simple text extraction approach
        // In production, you might want to use a library like pdf-parse
        const PDFParser = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await PDFParser(dataBuffer);
        return pdfData.text;
      }

      if (ext === '.docx') {
        // For DOCX files, use mammoth library
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      }

      // Default: try to read as text
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to extract content from ${originalname}: ${error.message}`);
      throw error;
    }
  }

  private getContentType(mimetype: string): string {
    if (mimetype === 'application/pdf') return 'pdf';
    if (mimetype.includes('word')) return 'docx';
    if (mimetype === 'text/plain') return 'txt';
    return 'manual';
  }

  async search(query: string, limit: number = 10): Promise<KnowledgeBase[]> {
    try {
      // Simple text search using content contains
      // In production, you might want to use full-text search or vector search
      const knowledgeBases = await this.prismaRepository.knowledgeBase.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return knowledgeBases;
    } catch (error) {
      this.logger.error(`Failed to search knowledge bases: ${error.message}`);
      throw error;
    }
  }

  // Agent-KnowledgeBase linking methods
  async getAgentKnowledgeBases(agentId: string): Promise<KnowledgeBase[]> {
    try {
      const agentKnowledgeBases = await this.prismaRepository.agentKnowledgeBase.findMany({
        where: { agentId },
        include: { knowledgeBase: true },
      });

      return agentKnowledgeBases.map((akb) => akb.knowledgeBase);
    } catch (error) {
      this.logger.error(`Failed to get agent knowledge bases: ${error.message}`);
      throw error;
    }
  }

  async linkAgentKnowledgeBase(agentId: string, knowledgeBaseId: string): Promise<AgentKnowledgeBase> {
    try {
      // Check if already linked
      const existing = await this.prismaRepository.agentKnowledgeBase.findUnique({
        where: {
          agentId_knowledgeBaseId: {
            agentId,
            knowledgeBaseId,
          },
        },
      });

      if (existing) {
        return existing;
      }

      return await this.prismaRepository.agentKnowledgeBase.create({
        data: {
          agentId,
          knowledgeBaseId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to link knowledge base to agent: ${error.message}`);
      throw error;
    }
  }

  async unlinkAgentKnowledgeBase(agentId: string, knowledgeBaseId: string): Promise<void> {
    try {
      await this.prismaRepository.agentKnowledgeBase.delete({
        where: {
          agentId_knowledgeBaseId: {
            agentId,
            knowledgeBaseId,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to unlink knowledge base from agent: ${error.message}`);
      throw error;
    }
  }

  async getKnowledgeBaseAgents(knowledgeBaseId: string): Promise<{ agentId: string }[]> {
    try {
      const agentKnowledgeBases = await this.prismaRepository.agentKnowledgeBase.findMany({
        where: { knowledgeBaseId },
        select: { agentId: true },
      });

      return agentKnowledgeBases.map((akb) => ({ agentId: akb.agentId }));
    } catch (error) {
      this.logger.error(`Failed to get knowledge base agents: ${error.message}`);
      throw error;
    }
  }
}