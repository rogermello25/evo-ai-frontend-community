import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button, Badge, Card, CardContent, CardHeader } from '@evoapi/design-system';
import { BookOpen, Plus, X, Loader2 } from 'lucide-react';
import { KnowledgeBase } from '@/types/knowledge/knowledge';
import { knowledgeService } from '@/services/knowledge/knowledgeService';
import KnowledgeBasesSelectionDialog from './KnowledgeBasesSelectionDialog';

interface KnowledgeBasesSectionProps {
  agentId: string;
}

const KnowledgeBasesSection = ({
  agentId,
}: KnowledgeBasesSectionProps) => {
  const { t } = useLanguage('aiAgents');
  const [linkedKnowledgeBases, setLinkedKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);

  // Load linked knowledge bases
  const loadLinkedKnowledgeBases = useCallback(async () => {
    if (!agentId) return;

    try {
      setIsLoading(true);
      // Get all knowledge bases and filter by agent_id
      const response = await knowledgeService.listKnowledgeBases(1, 100);
      const allKnowledgeBases = response.data || [];

      // Filter knowledge bases that are linked to this agent
      const linked = allKnowledgeBases.filter(
        (kb: KnowledgeBase) => kb.agent_ids?.includes(agentId)
      );

      setLinkedKnowledgeBases(linked);
    } catch (error) {
      console.error('Error loading linked knowledge bases:', error);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void loadLinkedKnowledgeBases();
  }, [loadLinkedKnowledgeBases]);

  // Handle linking a knowledge base
  const handleLinkKnowledgeBase = useCallback(async (knowledgeBaseId: string) => {
    try {
      await knowledgeService.linkToAgent(knowledgeBaseId, agentId);
      await loadLinkedKnowledgeBases();
      setShowSelectionDialog(false);
    } catch (error) {
      console.error('Error linking knowledge base:', error);
    }
  }, [agentId, loadLinkedKnowledgeBases]);

  // Handle unlinking a knowledge base
  const handleUnlinkKnowledgeBase = useCallback(async (knowledgeBaseId: string) => {
    try {
      setIsRemoving(knowledgeBaseId);
      await knowledgeService.unlinkFromAgent(knowledgeBaseId, agentId);
      await loadLinkedKnowledgeBases();
    } catch (error) {
      console.error('Error unlinking knowledge base:', error);
    } finally {
      setIsRemoving(null);
    }
  }, [agentId, loadLinkedKnowledgeBases]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b">
        <div className="p-2 rounded-lg bg-green-500/10">
          <BookOpen className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {t('edit.knowledgeBases.title') || 'Knowledge Bases'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('edit.knowledgeBases.subtitle') || 'Link knowledge bases to this agent for enhanced context'}
          </p>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">
                {t('edit.knowledgeBases.linkedKnowledgeBases') || 'Linked Knowledge Bases'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {linkedKnowledgeBases.length > 0
                  ? `${linkedKnowledgeBases.length} ${
                      linkedKnowledgeBases.length === 1 ? 'knowledge base' : 'knowledge bases'
                    } linked`
                  : t('edit.knowledgeBases.noLinkedKnowledgeBases') || 'No knowledge bases linked'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSelectionDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('edit.knowledgeBases.addKnowledgeBase') || 'Add Knowledge Base'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3 items-center py-12 h-32 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" />
              <div className="text-sm">
                {t('edit.knowledgeBases.loading') || 'Loading knowledge bases...'}
              </div>
            </div>
          ) : linkedKnowledgeBases.length > 0 ? (
            <div className="space-y-3">
              {linkedKnowledgeBases.map(kb => (
                <div
                  key={kb.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <BookOpen className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{kb.name}</span>
                        {kb.document_count !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {kb.document_count}{' '}
                            {kb.document_count === 1 ? 'document' : 'documents'}
                          </Badge>
                        )}
                      </div>
                      {kb.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {kb.description}
                        </p>
                      )}
                      {kb.tags && kb.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {kb.tags.slice(0, 5).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {kb.tags.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{kb.tags.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlinkKnowledgeBase(kb.id)}
                    disabled={isRemoving === kb.id}
                    className="text-destructive hover:text-destructive/80 ml-4"
                  >
                    {isRemoving === kb.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {t('edit.knowledgeBases.noKnowledgeBases') || 'No knowledge bases linked'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('edit.knowledgeBases.addKnowledgeBaseDescription') ||
                  'Add knowledge bases to give your agent access to specific information'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSelectionDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('edit.knowledgeBases.addKnowledgeBase') || 'Add Knowledge Base'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Dialog */}
      <KnowledgeBasesSelectionDialog
        open={showSelectionDialog}
        onOpenChange={setShowSelectionDialog}
        agentId={agentId}
        linkedKnowledgeBaseIds={linkedKnowledgeBases.map(kb => kb.id)}
        onLink={handleLinkKnowledgeBase}
      />
    </div>
  );
};

export default KnowledgeBasesSection;