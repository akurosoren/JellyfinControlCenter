import { useLanguage } from '../contexts/LanguageContext';
import { translations, TranslationKey } from '../translations';

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key: TranslationKey, replacements?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations['en'][key] || key;
    
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
        });
    }

    return translation;
  };

  return { t };
};
