import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label as UILabel,
  Textarea,
} from '@evoapi/design-system';
import { Upload, FileText } from 'lucide-react';
import { KnowledgeBase, CreateKnowledgeBaseRequest, UpdateKnowledgeBaseRequest } from '@/types/knowledge/knowledge';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface KnowledgeBaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knowledgeBase?: KnowledgeBase;
  isNew: boolean;
  loading: boolean;
  onSubmit: (data: CreateKnowledgeBaseRequest | UpdateKnowledgeBaseRequest) => void;
}

export default function KnowledgeBaseForm({
  open,
  onOpenChange,
  knowledgeBase,
  isNew,
  loading,
  onSubmit,
}: KnowledgeBaseFormProps) {
  const { t } = useLanguage('knowledge');
  const { can } = useUserPermissions();
  const [formData, setFormData] = useState<CreateKnowledgeBaseRequest>({
    name: '',
    description: '',
    content: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (knowledgeBase && !isNew) {
        setFormData({
          name: knowledgeBase.name,
          description: knowledgeBase.description || '',
          content: knowledgeBase.content || '',
          tags: knowledgeBase.tags || [],
        });
      } else {
        setFormData({
          name: '',
          description: '',
          content: '',
          tags: [],
        });
      }
      setTagInput('');
      setErrors({});
    }
  }, [open, knowledgeBase, isNew]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('modal.validation.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('modal.validation.nameMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar permissões antes de validar o formulário
    const requiredPermission = isNew ? 'create' : 'update';
    if (!can('knowledge', requiredPermission)) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof CreateKnowledgeBaseRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNew ? t('modal.title.create') : t('modal.title.edit')}
          </DialogTitle>
          <DialogDescription>
            {isNew ? t('modal.description.create') : t('modal.description.edit')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <UILabel htmlFor="name">
              {t('modal.labels.name')} <span className="text-destructive">*</span>
            </UILabel>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t('modal.placeholders.name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <UILabel htmlFor="description">{t('modal.labels.description')}</UILabel>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('modal.placeholders.description')}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Content (Manual entry) */}
          <div className="space-y-2">
            <UILabel htmlFor="content">{t('modal.labels.content')}</UILabel>
            <Textarea
              id="content"
              value={formData.content || ''}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder={t('modal.placeholders.content')}
              className="resize-none"
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              {t('modal.hints.content')}
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <UILabel htmlFor="tags">{t('modal.labels.tags')}</UILabel>
            <div className="flex items-center gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder={t('modal.placeholders.tags')}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                {t('modal.buttons.addTag')}
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('modal.buttons.cancel')}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !can('knowledge', isNew ? 'create' : 'update')}
          >
            {loading ? t('modal.buttons.saving') : isNew ? t('modal.buttons.create') : t('modal.buttons.update')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}