import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@evoapi/design-system';
import { BookOpen, Search, Upload, Link2, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import EmptyState from '@/components/base/EmptyState';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import {
  listKnowledgeBases,
  getKnowledgeBase,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  uploadDocument,
  linkToAgent,
  unlinkFromAgent,
  getAgentKnowledgeBases,
  getKnowledgeBaseAgents,
} from '@/services/knowledge/knowledgeService';
import { KnowledgeBase, KnowledgeBaseState, CreateKnowledgeBaseRequest, UpdateKnowledgeBaseRequest, AgentKnowledgeBaseLink } from '@/types/knowledge/knowledge';
import KnowledgeBaseForm from '@/components/knowledge/KnowledgeBaseForm';
import DocumentUpload from '@/components/knowledge/DocumentUpload';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@evoapi/design-system';
import { Badge } from '@evoapi/design-system';

const INITIAL_STATE: KnowledgeBaseState = {
  knowledgeBases: [],
  selectedKnowledgeBaseIds: [],
  meta: {
    pagination: {
      page: 1,
      page_size: DEFAULT_PAGE_SIZE,
      total: 0,
      total_pages: 0,
      has_next_page: false,
      has_previous_page: false,
    },
  },
  loading: {
    list: false,
    create: false,
    update: false,
    delete: false,
    upload: false,
    search: false,
  },
  searchQuery: '',
  sortBy: 'name',
  sortOrder: 'asc',
};

export default function KnowledgeBaseList() {
  const { t } = useLanguage('knowledge');
  const { can, isReady: permissionsReady } = useUserPermissions();
  const [state, setState] = useState<KnowledgeBaseState>(INITIAL_STATE);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [knowledgeBaseToDelete, setKnowledgeBaseToDelete] = useState<KnowledgeBase | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingKnowledgeBase, setEditingKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [knowledgeBaseForUpload, setKnowledgeBaseForUpload] = useState<KnowledgeBase | null>(null);
  const [linkedAgents, setLinkedAgents] = useState<Record<string, AgentKnowledgeBaseLink[]>>({});
  const [agentsModalOpen, setAgentsModalOpen] = useState(false);
  const [knowledgeBaseForAgents, setKnowledgeBaseForAgents] = useState<KnowledgeBase | null>(null);
  const hasLoaded = useRef(false);

  // Load knowledge bases
  const loadKnowledgeBases = useCallback(async () => {
    if (!can('knowledge', 'read')) {
      toast.error(t('messages.permissionDenied.read'));
      return;
    }

    setState(prev => ({ ...prev, loading: { ...prev.loading, list: true } }));

    try {
      const data = await listKnowledgeBases();
      const total = data.length || 0;

      setState(prev => ({
        ...prev,
        knowledgeBases: data || [],
        meta: {
          pagination: {
            page: 1,
            page_size: DEFAULT_PAGE_SIZE,
            total: total,
            total_pages: Math.ceil(total / DEFAULT_PAGE_SIZE),
            has_next_page: false,
            has_previous_page: false,
          },
        },
        loading: { ...prev.loading, list: false },
      }));
    } catch (error) {
      console.error('Error loading knowledge bases:', error);
      toast.error(t('messages.loadError'));
      setState(prev => ({ ...prev, loading: { ...prev.loading, list: false } }));
    }
  }, [can, t]);

  // Initial load
  useEffect(() => {
    if (!permissionsReady) {
      return;
    }

    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadKnowledgeBases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsReady]);

  // Filter knowledge bases based on search
  const filteredKnowledgeBases = state.knowledgeBases.filter(
    kb =>
      kb.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      kb.description?.toLowerCase().includes(state.searchQuery.toLowerCase()),
  );

  // Handlers
  const handleSearchChange = (query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      meta: { ...prev.meta, pagination: { ...prev.meta.pagination, page: 1 } },
    }));
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      meta: { ...prev.meta, pagination: { ...prev.meta.pagination, page } },
    }));
  };

  const handlePerPageChange = (perPage: number) => {
    setState(prev => ({
      ...prev,
      meta: { ...prev.meta, pagination: { ...prev.meta.pagination, page_size: perPage, page: 1 } },
    }));
  };

  // Knowledge Base actions
  const handleCreateKnowledgeBase = () => {
    if (!can('knowledge', 'create')) {
      toast.error(t('messages.permissionDenied.create'));
      return;
    }
    setEditingKnowledgeBase(null);
    setFormModalOpen(true);
  };

  const handleEditKnowledgeBase = (knowledgeBase: KnowledgeBase) => {
    if (!can('knowledge', 'update')) {
      toast.error(t('messages.permissionDenied.update'));
      return;
    }
    setEditingKnowledgeBase(knowledgeBase);
    setFormModalOpen(true);
  };

  const handleDeleteKnowledgeBase = (knowledgeBase: KnowledgeBase) => {
    if (!can('knowledge', 'delete')) {
      toast.error(t('messages.permissionDenied.delete'));
      return;
    }
    setKnowledgeBaseToDelete(knowledgeBase);
    setDeleteDialogOpen(true);
  };

  const handleUploadDocument = (knowledgeBase: KnowledgeBase) => {
    setKnowledgeBaseForUpload(knowledgeBase);
    setUploadModalOpen(true);
  };

  const handleViewLinkedAgents = async (knowledgeBase: KnowledgeBase) => {
    setKnowledgeBaseForAgents(knowledgeBase);
    setAgentsModalOpen(true);

    // Load linked agents using the knowledge base ID
    try {
      const agents = await getKnowledgeBaseAgents(knowledgeBase.id);
      setLinkedAgents(prev => ({ ...prev, [knowledgeBase.id]: agents }));
    } catch (error) {
      console.error('Error loading linked agents:', error);
    }
  };

  // Confirm delete
  const confirmDeleteKnowledgeBase = async () => {
    if (!knowledgeBaseToDelete) return;

    setState(prev => ({ ...prev, loading: { ...prev.loading, delete: true } }));

    try {
      await deleteKnowledgeBase(knowledgeBaseToDelete.id);
      toast.success(t('messages.deleteSuccess'));

      // Refresh the list
      loadKnowledgeBases();

      setDeleteDialogOpen(false);
      setKnowledgeBaseToDelete(null);
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      toast.error(t('messages.deleteError'));
    } finally {
      setState(prev => ({ ...prev, loading: { ...prev.loading, delete: false } }));
    }
  };

  // Handle form submission
  const handleKnowledgeBaseFormSubmit = async (data: CreateKnowledgeBaseRequest | UpdateKnowledgeBaseRequest) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [editingKnowledgeBase ? 'update' : 'create']: true },
    }));

    try {
      if (editingKnowledgeBase) {
        // Update existing knowledge base
        await updateKnowledgeBase(editingKnowledgeBase.id, data as UpdateKnowledgeBaseRequest);
        toast.success(t('messages.updateSuccess'));
      } else {
        // Create new knowledge base
        await createKnowledgeBase(data as CreateKnowledgeBaseRequest);
        toast.success(t('messages.createSuccess'));
      }

      // Refresh the entire list
      loadKnowledgeBases();

      // Close modal and clear editing state
      setFormModalOpen(false);
      setEditingKnowledgeBase(null);
    } catch (error) {
      console.error('Error saving knowledge base:', error);
      toast.error(editingKnowledgeBase ? t('messages.updateError') : t('messages.createError'));
    } finally {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, create: false, update: false },
      }));
    }
  };

  // Handle document upload - creates a new KnowledgeBase from file
  const handleDocumentUpload = async (file: File, onProgress: (progress: number) => void) => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, upload: true } }));

    try {
      await uploadDocument(file, onProgress);
      toast.success(t('messages.uploadSuccess'));
      setUploadModalOpen(false);
      loadKnowledgeBases();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(t('messages.uploadError'));
    } finally {
      setState(prev => ({ ...prev, loading: { ...prev.loading, upload: false } }));
    }
  };

  // Handle modal close
  const handleFormModalClose = (open: boolean) => {
    if (!open) {
      setFormModalOpen(false);
      setEditingKnowledgeBase(null);
    }
  };

  const handleUploadModalClose = (open: boolean) => {
    if (!open) {
      setUploadModalOpen(false);
      setKnowledgeBaseForUpload(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={state.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {can('knowledge', 'create') && (
            <Button onClick={handleCreateKnowledgeBase}>
              <BookOpen className="mr-2 h-4 w-4" />
              {t('actions.create')}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {state.loading.list ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-muted-foreground">{t('loading')}</div>
          </div>
        ) : filteredKnowledgeBases.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t('empty.title')}
            description={state.searchQuery ? t('empty.noResults') : t('empty.description')}
            action={can('knowledge', 'create') ? {
              label: t('empty.action'),
              onClick: handleCreateKnowledgeBase,
            } : undefined}
            className="h-full"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKnowledgeBases.map((kb) => (
              <div
                key={kb.id}
                className="border rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{kb.name}</h3>
                    {kb.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {kb.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditKnowledgeBase(kb)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      {can('knowledge', 'update') && (
                        <DropdownMenuItem onClick={() => handleUploadDocument(kb)}>
                          <Upload className="mr-2 h-4 w-4" />
                          {t('actions.upload')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleViewLinkedAgents(kb)}>
                        <Link2 className="mr-2 h-4 w-4" />
                        {t('actions.viewAgents')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {can('knowledge', 'delete') && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteKnowledgeBase(kb)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('actions.delete')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Tags */}
                {kb.tags && kb.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {kb.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Footer info */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
                  <span>
                    {kb.contentType || 'manual'}
                  </span>
                  <span>
                    {new Date(kb.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog.delete.title')}</DialogTitle>
            <DialogDescription>
              {t('dialog.delete.description', { name: knowledgeBaseToDelete?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={state.loading.delete}
            >
              {t('dialog.delete.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteKnowledgeBase}
              disabled={state.loading.delete}
            >
              {state.loading.delete ? t('dialog.delete.deleting') : t('dialog.delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Linked Agents Dialog */}
      <Dialog open={agentsModalOpen} onOpenChange={setAgentsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog.agents.title')}</DialogTitle>
            <DialogDescription>
              {t('dialog.agents.description', { name: knowledgeBaseForAgents?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-auto">
            {linkedAgents[knowledgeBaseForAgents?.id || ''] && linkedAgents[knowledgeBaseForAgents?.id || ''].length > 0 ? (
              <ul className="space-y-2">
                {linkedAgents[knowledgeBaseForAgents?.id || ''].map((link) => (
                  <li key={link.agentId} className="flex items-center gap-2 p-2 border rounded">
                    <Link2 className="h-4 w-4" />
                    <span className="text-sm">{link.agentId}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('dialog.agents.noAgents')}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgentsModalOpen(false)}>
              {t('dialog.agents.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Knowledge Base Form Modal */}
      <KnowledgeBaseForm
        open={formModalOpen}
        onOpenChange={handleFormModalClose}
        knowledgeBase={editingKnowledgeBase || undefined}
        isNew={!editingKnowledgeBase}
        loading={state.loading.create || state.loading.update}
        onSubmit={handleKnowledgeBaseFormSubmit}
      />

      {/* Document Upload Modal */}
      <DocumentUpload
        open={uploadModalOpen}
        onOpenChange={handleUploadModalClose}
        knowledgeBaseName={knowledgeBaseForUpload?.name || ''}
        loading={state.loading.upload}
        onUpload={handleDocumentUpload}
      />
    </div>
  );
}