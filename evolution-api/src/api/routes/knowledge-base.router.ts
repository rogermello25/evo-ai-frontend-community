import { RouterBroker } from '@api/abstract/abstract.router';
import {
  CreateKnowledgeBaseDto,
  LinkKnowledgeBaseDto,
  SearchKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
} from '@api/dto/knowledge-base.dto';
import { knowledgeBaseController } from '@api/server.module';
import { RequestHandler, Router } from 'express';
import multer from 'multer';

import { HttpStatus } from './index.router';

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .txt, .pdf, and .docx are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export class KnowledgeBaseRouter extends RouterBroker {
  constructor(...guards: RequestHandler[]) {
    super();
    this.router
      // CRUD endpoints
      .get('/knowledge-base', ...guards, async (req, res) => {
        try {
          const response = await knowledgeBaseController.findAll();
          return res.status(HttpStatus.OK).json(response);
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      })
      .get('/knowledge-base/:id', ...guards, async (req, res) => {
        try {
          const response = await knowledgeBaseController.findById(req.params.id);
          if (!response) {
            return res.status(HttpStatus.NOT_FOUND).json({ error: 'Knowledge base not found' });
          }
          return res.status(HttpStatus.OK).json(response);
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      })
      .post('/knowledge-base', ...guards, async (req, res) => {
        try {
          const response = await knowledgeBaseController.create(req.body as CreateKnowledgeBaseDto);
          return res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      })
      .put('/knowledge-base/:id', ...guards, async (req, res) => {
        try {
          const response = await knowledgeBaseController.update(req.params.id, req.body as UpdateKnowledgeBaseDto);
          return res.status(HttpStatus.OK).json(response);
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      })
      .delete('/knowledge-base/:id', ...guards, async (req, res) => {
        try {
          await knowledgeBaseController.delete(req.params.id);
          return res.status(HttpStatus.OK).json({ message: 'Knowledge base deleted successfully' });
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      })
      // File upload endpoint
      .post('/knowledge-base/upload', ...guards, upload.single('file'), async (req, res) => {
        try {
          if (!req.file) {
            return res.status(HttpStatus.BAD_REQUEST).json({ error: 'No file uploaded' });
          }
          const response = await knowledgeBaseController.upload(req.file);
          return res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      })
      // Search endpoint
      .post('/knowledge-base/search', ...guards, async (req, res) => {
        try {
          const response = await knowledgeBaseController.search(req.body as SearchKnowledgeBaseDto);
          return res.status(HttpStatus.OK).json(response);
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      })
      // Agent-KnowledgeBase linking endpoints
      .get('/agent/:agentId/knowledge-bases', ...guards, async (req, res) => {
        try {
          const response = await knowledgeBaseController.getAgentKnowledgeBases(req.params.agentId);
          return res.status(HttpStatus.OK).json(response);
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      })
      .post('/agent/:agentId/knowledge-bases', ...guards, async (req, res) => {
        try {
          const response = await knowledgeBaseController.linkAgentKnowledgeBase(
            req.params.agentId,
            req.body as LinkKnowledgeBaseDto,
          );
          return res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      })
      .delete('/agent/:agentId/knowledge-bases/:knowledgeBaseId', ...guards, async (req, res) => {
        try {
          await knowledgeBaseController.unlinkAgentKnowledgeBase(
            req.params.agentId,
            req.params.knowledgeBaseId,
          );
          return res.status(HttpStatus.OK).json({ message: 'Knowledge base unlinked from agent successfully' });
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      })
      // Get agents linked to a knowledge base
      .get('/knowledge-base/:id/agents', ...guards, async (req, res) => {
        try {
          const response = await knowledgeBaseController.getKnowledgeBaseAgents(req.params.id);
          return res.status(HttpStatus.OK).json(response);
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        }
      });
  }

  public readonly router: Router = Router();
}