/**
 * ═══════════════════════════════════════════════════════════════
 * Maths BAC Madagascar — © 2026 RATOVOSON Navelanizara Romuel
 * Ce logiciel est protégé par le droit d'auteur.
 * Toute reproduction, modification ou distribution
 * sans autorisation écrite est strictement interdite.
 * ═══════════════════════════════════════════════════════════════
 */

export const CREATOR = 'RATOVOSON Navelanizara Romuel';
export const APP_VERSION = '4.5.1';
export const APP_BUILD = Date.now().toString(36);
export const COPYRIGHT = `© 2026 ${CREATOR}. Tous droits réservés.`;
export const COPYRIGHT_SHORT = `© 2026 ${CREATOR}`;

// Generate unique installation fingerprint
export function getDeviceFingerprint(): string {
 const stored = localStorage.getItem('mathsolver_fp');
 if (stored) return stored;

 const parts = [
  navigator.userAgent,
  navigator.language,
  screen.width + 'x' + screen.height,
  new Date().getTimezoneOffset().toString(),
  Math.random().toString(36).substring(2, 10),
 ];

 let hash = 0;
 const str = parts.join('|');
 for (let i = 0; i < str.length; i++) {
  const char = str.charCodeAt(i);
  hash = ((hash << 5) - hash) + char;
  hash = hash & hash;
 }
 const fp = 'MS-' + Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
 localStorage.setItem('mathsolver_fp', fp);
 return fp;
}

// Invisible watermark injected in exports
export function getWatermark(): string {
 const fp = getDeviceFingerprint();
 const date = new Date().toISOString().split('T')[0];
 return `[Maths BAC Madagascar © 2026 ${CREATOR} | ID:${fp} | ${date}]`;
}

// Anti-inspection protection (production only)
export function enableProtection(): void {
 // @ts-ignore
 if (import.meta.env?.DEV) return;

 document.addEventListener('contextmenu', (e) => { e.preventDefault(); });

 const threshold = 160;
 const check = () => {
  const w = window.outerWidth - window.innerWidth > threshold;
  const h = window.outerHeight - window.innerHeight > threshold;
  if (w || h) {
   console.log(`%c Maths BAC Madagascar — Créé par ${CREATOR}`, 'color: #818cf8; font-size: 16px; font-weight: bold;');
   console.log('%cCode protégé par le droit d\'auteur. Toute copie non autorisée est interdite.', 'color: #94a3b8; font-size: 12px;');
  }
 };
 setInterval(check, 2000);

 console.log(
  `%c Maths BAC Madagascar — par ${CREATOR}`,
  'color: #818cf8; font-size: 20px; font-weight: bold; padding: 10px;'
 );
 console.log(
  `%c${COPYRIGHT}`,
  'color: #ef4444; font-size: 12px;'
 );
}
