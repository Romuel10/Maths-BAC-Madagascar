export interface UserStats {
 totalExercises: number;
 totalCorrect: number;
 currentStreak: number;
 bestStreak: number;
 byTopic: Record<string, { done: number; correct: number }>;
 lastActivity: string;
}

const STATS_KEY = 'mathsolver_stats';

export function getStats(): UserStats {
 try {
  const raw = localStorage.getItem(STATS_KEY);
  if (raw) return JSON.parse(raw);
 } catch { /* ignore */ }
 return { totalExercises: 0, totalCorrect: 0, currentStreak: 0, bestStreak: 0, byTopic: {}, lastActivity: '' };
}

export function saveStats(stats: UserStats): void {
 stats.lastActivity = new Date().toISOString();
 localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function recordAnswer(topic: string, isCorrect: boolean): UserStats {
 const stats = getStats();
 stats.totalExercises++;
 if (isCorrect) {
  stats.totalCorrect++;
  stats.currentStreak++;
  if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak;
 } else {
  stats.currentStreak = 0;
 }
 if (!stats.byTopic[topic]) stats.byTopic[topic] = { done: 0, correct: 0 };
 stats.byTopic[topic].done++;
 if (isCorrect) stats.byTopic[topic].correct++;
 saveStats(stats);
 return stats;
}

export function resetStats(): void {
 localStorage.removeItem(STATS_KEY);
}
