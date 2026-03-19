// src/contexts/LanguageContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'sp' | 'pt';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en'); // Default to 'en' initially
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('appLanguage');
    if (stored && (stored === 'en' || stored === 'sp' || stored === 'pt')) {
      setLanguage(stored as Language);
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const module = await import(`@/locales/${language}/translation.json`);
        setTranslations(module.default);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        setTranslations({});
      }
    };

    void loadTranslations();
  }, [language]);

  // Save to localStorage when language changes (client-side only)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('appLanguage', language);
    }
  }, [language, mounted]);

  const t = (key: string): string => {
    return translations[key] || key;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
