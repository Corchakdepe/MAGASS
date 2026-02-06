'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FolderOpen, Upload } from 'lucide-react';
import FileUploadDialog from '@/components/sidebar/components/FileUploadDialog';
import { useLanguage } from '@/contexts/LanguageContext';

type FileUploadProps = {
  folderPath: string;
  setFolderPath: (path: string) => void;
  onFileUpload?: (files: File[]) => Promise<string | null>;
  uploadedFiles?: File[];
};

export default function FileUpload({
  folderPath,
  setFolderPath,
  onFileUpload,
  uploadedFiles = []
}: FileUploadProps) {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFolderPath(e.target.value);
  };

  const handleUpload = async (files: File[]) => {
    if (onFileUpload) {
      return await onFileUpload(files);
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="folderPath">{t('inputFolder')}</Label>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setIsDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            {t('upload')}
          </Button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>{t('uploadedFiles')}</Label>
          <div className="max-h-40 overflow-y-auto border rounded p-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <FileUploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUpload={handleUpload}
        uploadedFiles={uploadedFiles}
      />
    </div>
  );
}