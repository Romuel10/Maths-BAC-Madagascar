import { createContext, useContext } from 'react';

/**
 * Seule la navigation générale est bilingue. Les contenus mathématiques et
 * pédagogiques restent volontairement en français afin de conserver leur
 * terminologie scolaire exacte.
 */
export type Lang = 'fr' | 'mg';

const NAVIGATION = {
 navHome: { fr: 'Accueil', mg: 'Fandraisana' },
 navReview: { fr: 'Réviser', mg: 'Famerenana' },
 navSolve: { fr: 'Résoudre', mg: 'Hamaha' },
 navBac: { fr: 'BAC', mg: 'BAC' },
 navTools: { fr: 'Outils', mg: 'Fitaovana' },
} as const;

export type NavigationKey = keyof typeof NAVIGATION;

export function t(key: NavigationKey, lang: Lang): string {
 return NAVIGATION[key][lang];
}

export function isLang(value: unknown): value is Lang {
 return value === 'fr' || value === 'mg';
}

export const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({
 lang: 'fr',
 setLang: () => undefined,
});

export function useLang() {
 return useContext(LangContext);
}
