'use client';

import React, {useState, useCallback} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import {useLanguage} from '@/contexts/LanguageContext';
import {Upload, X, FileText, CheckCircle} from 'lucide-react';

interface FileUploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => Promise<string | null>;
    uploadedFiles: File[];
}

export default function FileUploadDialog({
                                             isOpen,
                                             onClose,
                                             onUpload,
                                             uploadedFiles
                                         }: FileUploadDialogProps) {
    const {t} = useLanguage();
    const [files, setFiles] = useState<File[]>(uploadedFiles);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

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

        const droppedFiles = Array.from(e.dataTransfer.files);
        const csvFiles = droppedFiles.filter(file =>
            file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
        );

        setFiles(prev => [...prev, ...csvFiles]);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const csvFiles = selectedFiles.filter(file =>
            file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
        );

        setFiles(prev => [...prev, ...csvFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            alert('Please select CSV files to upload');
            return;
        }

        setIsUploading(true);
        const result = await onUpload(files);
        setIsUploading(false);

        if (result) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('uploadCSVFiles')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Drag and Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
                        <p className="text-sm text-gray-600 mb-2">
                            {t('dragDropCSVFiles')}
                        </p>
                        <p className="text-xs text-gray-500">
                            {t('orClickToBrowse')}
                        </p>
                        <input
                            id="file-input"
                            type="file"
                            multiple
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            <h4 className="text-sm font-medium">{t('selectedFiles')} ({files.length})</h4>
                            {files.map((file, index) => (
                                <div
                                    key={`${file.name}-${index}`}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                    <div className="flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0"/>
                                        <span className="text-sm break-words min-w-0 flex-1">{file.name}</span>
                                        <span className="text-xs text-gray-500 flex-shrink-0">
            ({(file.size / 1024).toFixed(1)} KB)
          </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Requirements */}
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>• {t('uploadRequirements')}</p>
                        <p>• {t('supportedFormatCSV')}</p>
                        <p>• {t('filesWillBeUploadedTo')} <code>./uploads/</code></p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={files.length === 0 || isUploading}
                    >
                        {isUploading ? t('uploading') : t('uploadFiles')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
