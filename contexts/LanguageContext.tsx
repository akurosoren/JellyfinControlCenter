import React, { createContext, ReactNode, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  // Fix: The type of the setter from useLocalStorage (and useState) is React.Dispatch<React.SetStateAction<T>>, which is not strictly assignable to (language: Language) => void.
  // This updates the type to match the hook's return type.
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useLocalStorage<Language>('jcc-language', 'fr');
  
  const value = { language, setLanguage };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
