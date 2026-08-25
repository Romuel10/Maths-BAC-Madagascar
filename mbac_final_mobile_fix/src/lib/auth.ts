/**
 * Système d'authentification — Lycée Madagascar
 * Seconde, Première, Terminale
 * © 2025 RATOVOSON Navelanizara Romuel
 */

export type Role = 'admin' | 'teacher' | 'student';
export type ClassLevel = 'seconde' | 'premiere' | 'terminale';

export interface UserProfile {
 id: string;
 name: string;
 role: Role;
 classLevel?: ClassLevel; // for students
 pin?: string; // for teachers
 createdAt: string;
}

const AUTH_KEY = 'mathsolver_auth';

export function getUser(): UserProfile | null {
 try { const r = localStorage.getItem(AUTH_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function setUser(user: UserProfile) { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }
export function logout() { localStorage.removeItem(AUTH_KEY); }
export function generateId(): string { return 'U' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export function canLockExam(role: Role): boolean { return role === 'admin' || role === 'teacher'; }

export const ROLE_LABELS: Record<Role, { fr: string; en: string; mg: string; icon: string; color: string }> = {
 admin:  { fr: 'Administrateur', en: 'Administrator', mg: 'Mpitantana',  icon: 'ADM', color: 'amber' },
 teacher: { fr: 'Professeur',   en: 'Teacher',    mg: 'Mpampianatra', icon: 'PRO', color: 'indigo' },
 student: { fr: 'Élève',     en: 'Student',    mg: 'Mpianatra',  icon: 'ELV', color: 'emerald' },
};

export const CLASS_LABELS: Record<ClassLevel, { fr: string; en: string; mg: string; short: string }> = {
 seconde:  { fr: 'Seconde (2nde)', en: '10th Grade', mg: 'Kilasy faharoa', short: '2nde' },
 premiere: { fr: 'Première (1ère)', en: '11th Grade', mg: 'Kilasy voalohany', short: '1ère' },
 terminale: { fr: 'Terminale (Tle)', en: '12th Grade', mg: 'Kilasy farany', short: 'Tle' },
};
