"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { Languages, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'sp', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
] as const;

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const currentLanguage = LANGUAGES.find(lang => lang.code === language);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-md border-surface-3 bg-surface-1 text-text-primary hover:bg-surface-0/70"
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs">{currentLanguage?.flag} {currentLanguage?.label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-48 p-2 rounded-lg border border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
      >
        <div className="space-y-1">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                  isSelected
                    ? "bg-accent-soft text-accent font-medium"
                    : "text-text-primary hover:bg-surface-0/70"
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1 text-left">
                  {lang.flag} {lang.label}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSelector;
