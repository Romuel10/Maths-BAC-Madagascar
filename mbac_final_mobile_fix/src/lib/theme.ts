import { createContext, useContext } from 'react';

export type Theme = 'dark' | 'light';

export const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
 theme: 'dark',
 toggle: () => {}
});

export function useTheme() {
 return useContext(ThemeContext);
}

export function applyTheme(theme: Theme) {
 document.body.classList.toggle('light', theme === 'light');
 document.body.classList.toggle('dark', theme === 'dark');
 document.documentElement.dataset.theme = theme;
 document.documentElement.style.colorScheme = theme;
}
