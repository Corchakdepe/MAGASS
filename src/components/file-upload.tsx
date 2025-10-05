'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File as FileIcon, X } from 'lucide-react';

type FileUploadProps = {
    uploadedFiles: File[];
    setUploadedFiles: (files: File[]) => void;
};

export default function FileUpload({ uploadedFiles, setUploadedFiles }: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            setUploadedFiles([...uploadedFiles, ...newFiles]);
        }
    };

    const handleRemoveFile = (index: number) => {
        const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
        setUploadedFiles(updatedFiles);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline">File Upload</h3>
            <Card
                className="border-2 border-dashed bg-muted hover:border-primary/50 hover:bg-muted/80 transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">CSV, JSON, or XML files</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".csv,.json,.xml"
                        className="hidden"
                        onChange={handleFileChange}
                        name="files"
                    />
                </CardContent>
            </Card>
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Uploaded Files:</h4>
                    <ul className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                            <li key={index} className="flex items-center justify-between p-2 rounded-md bg-background border">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm truncate">{file.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFile(index)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
