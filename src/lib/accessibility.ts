import type { AccessibilityPreferences } from './studentProfile';

export function applyAccessibility(preferences:AccessibilityPreferences){
 document.documentElement.dataset.textScale=preferences.textScale;
 document.body.classList.toggle('high-contrast',preferences.highContrast);
 document.body.classList.toggle('reduce-motion',preferences.reduceMotion);
}

export function speakFrench(text:string):boolean{
 if(!('speechSynthesis' in window)||!text.trim())return false;
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(text.replace(/[$*_]/g,' '));
 utterance.lang='fr-FR';utterance.rate=.92;
 window.speechSynthesis.speak(utterance);return true;
}

export function stopSpeaking(){if('speechSynthesis' in window)window.speechSynthesis.cancel();}
