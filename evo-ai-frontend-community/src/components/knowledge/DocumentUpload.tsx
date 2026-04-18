import React, { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Progress,
} from '@evoapi/design-system';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface DocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knowledgeBaseName: string;
  loading: boolean;
  onUpload: (file: File, onProgress: (progress: number) => void) => Promise<void>;
}

const ALLOWED_FILE_TYPES = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.docx'];

export default function DocumentUpload({
  open,
  onOpenChange,
  knowledgeBaseName,
  loading,
  onUpload,
}: DocumentUploadProps) {
  const { t } = useLanguage('knowledge');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return t('upload.error.invalidType');
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return t('upload.error.fileTooLarge');
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const error = validateFile(file);
      if (error) {
        setErrorMessage(error);
        setUploadStatus('error');
      } else {
        setSelectedFile(file);
        setUploadStatus('idle');
        setErrorMessage('');
      }
    }
  }, [t]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const error = validateFile(file);
      if (error) {
        setErrorMessage(error);
        setUploadStatus('error');
      } else {
        setSelectedFile(file);
        setUploadStatus('idle');
        setErrorMessage('');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      await onUpload(selectedFile, (progress) => {
        setUploadProgress(progress);
      });
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(t('upload.error.uploadFailed'));
    }
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadStatus('idle');
      setErrorMessage('');
    }
    onOpenChange(openState);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('upload.title')}</DialogTitle>
          <DialogDescription>
            {t('upload.description', { name: knowledgeBaseName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploadStatus === 'success' ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-sm text-green-600 font-medium">{t('upload.success')}</p>
              </div>
            ) : (
              <>
                <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm text-muted-foreground mb-2">
                  {t('upload.dropzone.hint')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploadStatus === 'uploading'}
                >
                  {t('upload.browse')}
                </Button>
              </>
            )}
          </div>

          {/* File info */}
          {selectedFile && uploadStatus !== 'success' && (
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {getFileIcon(selectedFile.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {uploadStatus !== 'uploading' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Progress bar */}
          {uploadStatus === 'uploading' && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                {t('upload.progress', { progress: uploadProgress })}
              </p>
            </div>
          )}

          {/* Error message */}
          {(uploadStatus === 'error' || errorMessage) && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Allowed formats */}
          <div className="text-xs text-muted-foreground">
            <p>{t('upload.allowedFormats')}:</p>
            <p className="font-mono mt-1">{ALLOWED_EXTENSIONS.join(', ')}</p>
            <p className="mt-1">{t('upload.maxSize')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={loading || uploadStatus === 'uploading'}
          >
            {t('upload.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || loading || uploadStatus === 'uploading' || uploadStatus === 'success'}
          >
            {loading || uploadStatus === 'uploading' ? t('upload.uploading') : t('upload.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}