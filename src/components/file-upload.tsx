'use client';

import { ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type FileUploadProps = {
  folderPath: string;
  setFolderPath: (path: string) => void;
};

export default function FileUpload({ folderPath, setFolderPath }: FileUploadProps) {
  const handleFolderChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFolderPath(e.target.value);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="folderPath">Input folder</Label>
        <Input
          id="folderPath"
          value={folderPath}
          onChange={handleFolderChange}
          placeholder="./Datos/Marzo_Reales"
        />
      </div>

      {/* Si mÃ¡s adelante quieres subir ficheros reales, aÃ±ade aquÃ­ un input type="file" */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled
      >
        Browse (disabled demo)
      </Button>
    </div>
  );
}