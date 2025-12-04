"use client";

import React, { createContext, useContext, useState, useCallback, useSyncExternalStore } from 'react';
import { translations, Language, TranslationKey } from '@/lib/translations';

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey | string) => string;
};

type TranslationObject = Record<string, string | Record<string, string>>;

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Storage helper for language
const languageStore = {
    getSnapshot: (): Language => {
        if (typeof window === 'undefined') return 'kh';
        const saved = localStorage.getItem('cozia-language');
        return (saved === 'en' || saved === 'kh') ? saved : 'kh';
    },
    getServerSnapshot: (): Language => 'kh',
    subscribe: (callback: () => void) => {
        window.addEventListener('storage', callback);
        return () => window.removeEventListener('storage', callback);
    }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Use useSyncExternalStore to avoid the useEffect setState pattern
    const storedLanguage = useSyncExternalStore(
        languageStore.subscribe,
        languageStore.getSnapshot,
        languageStore.getServerSnapshot
    );

    const [language, setLanguageState] = useState<Language>(storedLanguage);

    // Wrapper to save to localStorage when language changes
    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('cozia-language', lang);
        }
    }, []);

    const t = useCallback((key: TranslationKey | string): string => {
        const currentTranslations = translations[language] as TranslationObject;

        // Handle nested keys like 'rejectionReasons.noUsWarehouse'
        if (key.includes('.')) {
            const parts = key.split('.');
            let current: TranslationObject | string = currentTranslations;
            for (const part of parts) {
                if (typeof current === 'string' || current[part] === undefined) return key;
                current = current[part] as TranslationObject | string;
            }
            return typeof current === 'string' ? current : key;
        }

        // Handle top-level keys
        const value = currentTranslations[key];
        return typeof value === 'string' ? value : key;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <button
            onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
            className="px-3 py-1 rounded-full bg-sage/20 text-charcoal border border-sage/50 text-sm font-medium hover:bg-sage/30 transition-colors"
        >
            {language === 'en' ? '🇺🇸 EN' : '🇰🇭 ខ្មែរ'}
        </button>
    );
}
