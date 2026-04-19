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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (knowledgeBase && !isNew) {
        setFormData({
          name: knowledgeBase.name,
          description: knowledgeBase.description || '',
          content: knowledgeBase.content || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          content: '',
        });
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
              className="min-h-[120px] max-h-[300px] overflow-y-auto"
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              {t('modal.hints.content')}
            </p>
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