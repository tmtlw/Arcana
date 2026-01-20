
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

// A nyelvi fájlok importálása. A custom loader kezeli az útvonalakat.
// Mivel nincs fordítási idejű típusellenőrzés a dinamikus importokra ebben a rendszerben,
// "any"-ként kezeljük az importokat, de tudjuk a struktúrát.
import { DATA as HU_DATA } from '../langs/hu/index';
import { DATA as EN_DATA } from '../langs/en/index';
import { DATA as DE_DATA } from '../langs/de/index';

// Típusok
export type Language = 'hu' | 'en' | 'de';

// Segédtípus a mélyebb eléréshez
type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  data: typeof HU_DATA; // A teljes adatstruktúra elérése
}

const translations = {
  hu: HU_DATA,
  en: EN_DATA,
  de: DE_DATA
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode, userLanguage?: Language }> = ({ children, userLanguage }) => {
  const [language, setLanguageState] = useState<Language>('hu');

  // Kezdeti nyelv beállítása
  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && ['hu', 'en', 'de'].includes(savedLang)) {
      setLanguageState(savedLang);
    } else if (userLanguage && ['hu', 'en', 'de'].includes(userLanguage)) {
      setLanguageState(userLanguage);
    }
  }, [userLanguage]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  // Rekurzív kulcs keresés (pl. 'common.save')
  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, obj) || path;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    // A UI szövegek a 'ui' kulcs alatt vannak
    const currentDict = (translations[language] || translations['hu']).ui;
    let text = getNestedValue(currentDict, key);

    // Fallback a magyarra, ha nincs meg a kulcs
    if ((text === key || text === null) && language !== 'hu') {
       text = getNestedValue(translations['hu'].ui, key);
    }

    if (typeof text !== 'string') return key;

    // Paraméterek behelyettesítése {paramName} formátumban
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });
    }

    return text;
  };

  const value = {
    language,
    setLanguage,
    t,
    data: translations[language] || translations['hu']
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
