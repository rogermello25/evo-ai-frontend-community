import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Input,
  ScrollArea,
} from '@evoapi/design-system';
import { Search, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { KnowledgeBase } from '@/types/knowledge/knowledge';
import { knowledgeService } from '@/services/knowledge/knowledgeService';
import { useLanguage } from '@/hooks/useLanguage';

interface KnowledgeBasesSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  linkedKnowledgeBaseIds: string[];
  onLink: (knowledgeBaseId: string) => void;
}

const KnowledgeBasesSelectionDialog = ({
  open,
  onOpenChange,
  linkedKnowledgeBaseIds,
  onLink,
}: KnowledgeBasesSelectionDialogProps) => {
  const { t } = useLanguage('aiAgents');
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Load all knowledge bases when dialog opens
  useEffect(() => {
    if (!open) return;

    const loadKnowledgeBases = async () => {
      try {
        setIsLoading(true);
        const data = await knowledgeService.listKnowledgeBases();
        setKnowledgeBases(data || []);
      } catch (error) {
        console.error('Error loading knowledge bases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadKnowledgeBases();
  }, [open]);

  // Filter out already linked knowledge bases and apply search
  const filteredKnowledgeBases = useMemo(() => {
    return knowledgeBases.filter(kb => {
      // Exclude already linked knowledge bases
      if (linkedKnowledgeBaseIds.includes(kb.id)) {
        return false;
      }

      // Apply search filter
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        kb.name.toLowerCase().includes(term) ||
        kb.description?.toLowerCase().includes(term)
      );
    });
  }, [knowledgeBases, linkedKnowledgeBaseIds, searchTerm]);

  const handleLink = async () => {
    if (!selectedId) return;

    try {
      setIsLinking(true);
      await onLink(selectedId);
      setSelectedId(null);
      setSearchTerm('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error linking knowledge base:', error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    setSearchTerm('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-500" />
            {t('edit.knowledgeBases.selectKnowledgeBase') || 'Select Knowledge Base'}
          </DialogTitle>
          <DialogDescription>
            {t('edit.knowledgeBases.selectKnowledgeBaseDescription') ||
              'Choose a knowledge base to link to this agent'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                t('edit.knowledgeBases.searchPlaceholder') || 'Search knowledge bases...'
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Knowledge bases list */}
          <ScrollArea className="h-[500px] border rounded-md p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-32">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('edit.knowledgeBases.loading') || 'Loading knowledge bases...'}
                </p>
              </div>
            ) : filteredKnowledgeBases.length > 0 ? (
              <div className="space-y-3">
                {filteredKnowledgeBases.map(kb => (
                  <div
                    key={kb.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedId === kb.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedId(kb.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-lg">{kb.name}</span>
                          {selectedId === kb.id && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>

                        {kb.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {kb.description}
                          </p>
                        )}

                        {kb.contentType && (
                          <Badge variant="outline" className="text-xs">
                            {kb.contentType}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center ml-4">
                        <input
                          type="radio"
                          checked={selectedId === kb.id}
                          onChange={() => setSelectedId(kb.id)}
                          className="h-4 w-4 text-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? t('edit.knowledgeBases.noResults') || 'No knowledge bases match your search'
                    : t('edit.knowledgeBases.noAvailableKnowledgeBases') ||
                      'No available knowledge bases to link'}
                </p>
                {searchTerm && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('edit.knowledgeBases.tryDifferentSearch') || 'Try a different search term'}
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="border-t p-4">
          <Button variant="outline" onClick={handleClose}>
            {t('actions.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleLink} disabled={!selectedId || isLinking}>
            {isLinking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('edit.knowledgeBases.linking') || 'Linking...'}
              </>
            ) : (
              t('edit.knowledgeBases.linkKnowledgeBase') || 'Link Knowledge Base'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KnowledgeBasesSelectionDialog;