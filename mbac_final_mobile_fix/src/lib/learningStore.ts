import type { BacQuestion, BacSubject, BacTopic } from '../data/bacSubjects';
import { BAC_SUBJECTS, flattenQuestions } from '../data/bacSubjects';
import { getBacProgress } from './bacProgress.js';

const KEY = 'mathbac_mg_learning_v4';

export interface MistakeRecord {
 id: string;
 subjectId?: string;
 questionId?: string;
 topic?: BacTopic;
 code: string;
 title: string;
 message: string;
 createdAt: string;
}

export interface LearningStore {
 favorites: string[];
 retry: string[];
 mistakes: MistakeRecord[];
 studyDays: string[];
}

function empty(): LearningStore { return { favorites: [], retry: [], mistakes: [], studyDays: [] }; }

export function getLearningStore(): LearningStore {
 try {
  const raw = localStorage.getItem(KEY);
  if (!raw) return empty();
  const parsed = JSON.parse(raw) as Partial<LearningStore>;
  return {
   favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
   retry: Array.isArray(parsed.retry) ? parsed.retry : [],
   mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes.slice(0, 120) : [],
   studyDays: Array.isArray(parsed.studyDays) ? parsed.studyDays.slice(-90) : [],
  };
 } catch { return empty(); }
}

function save(store: LearningStore) {
 localStorage.setItem(KEY, JSON.stringify(store));
 window.dispatchEvent(new CustomEvent('mathbac-learning'));
}

function touchStudyDay(store: LearningStore) {
 const day = new Date().toISOString().slice(0, 10);
 if (!store.studyDays.includes(day)) store.studyDays.push(day);
 store.studyDays = store.studyDays.slice(-90);
}

export function questionKey(subjectId: string, questionId: string) { return `${subjectId}:${questionId}`; }

export function toggleFavorite(subjectId: string, questionId: string) {
 const store = getLearningStore();
 const key = questionKey(subjectId, questionId);
 store.favorites = store.favorites.includes(key) ? store.favorites.filter(v => v !== key) : [key, ...store.favorites];
 touchStudyDay(store); save(store);
}

export function toggleRetry(subjectId: string, questionId: string) {
 const store = getLearningStore();
 const key = questionKey(subjectId, questionId);
 store.retry = store.retry.includes(key) ? store.retry.filter(v => v !== key) : [key, ...store.retry];
 touchStudyDay(store); save(store);
}

export function clearRetry(subjectId: string, questionId: string) {
 const store = getLearningStore();
 const key = questionKey(subjectId, questionId);
 if (!store.retry.includes(key)) return;
 store.retry = store.retry.filter(v => v !== key);
 touchStudyDay(store); save(store);
}

export function recordLearningAttempt(subjectId: string, questionId: string, correct: boolean) {
 const store = getLearningStore();
 touchStudyDay(store);
 const key = questionKey(subjectId, questionId);
 if (!correct && !store.retry.includes(key)) store.retry.unshift(key);
 if (correct) store.retry = store.retry.filter(v => v !== key);
 save(store);
}

export function recordMistake(input: Omit<MistakeRecord, 'id' | 'createdAt'>) {
 const store = getLearningStore();
 touchStudyDay(store);
 store.mistakes.unshift({ ...input, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() });
 store.mistakes = store.mistakes.slice(0, 120);
 save(store);
}

export function studyStreak(days = getLearningStore().studyDays): number {
 const set = new Set(days);
 let count = 0;
 const d = new Date();
 for (;;) {
  const key = d.toISOString().slice(0, 10);
  if (!set.has(key)) break;
  count++;
  d.setDate(d.getDate() - 1);
 }
 return count;
}

export interface QuestionRef { subject: BacSubject; question: BacQuestion; key: string }

export function resolveQuestionRef(key: string): QuestionRef | null {
 const idx = key.indexOf(':');
 if (idx < 0) return null;
 const subjectId = key.slice(0, idx), questionId = key.slice(idx + 1);
 const subject = BAC_SUBJECTS.find(s => s.id === subjectId);
 const question = subject && flattenQuestions(subject).find(q => q.id === questionId);
 return subject && question ? { subject, question, key } : null;
}

export function recommendedQuestions(limit = 5): QuestionRef[] {
 const progress = getBacProgress();
 const learning = getLearningStore();
 const refs: QuestionRef[] = [];
 const seen = new Set<string>();

 for (const key of learning.retry) {
  const ref = resolveQuestionRef(key);
  if (ref && !seen.has(key)) { refs.push(ref); seen.add(key); }
 }

 const topicStats = new Map<BacTopic, { attempts: number; correct: number }>();
 for (const p of Object.values(progress.questions)) {
  const s = topicStats.get(p.topic) || { attempts: 0, correct: 0 };
  s.attempts += p.attempts;
  if (p.correct) s.correct += 1;
  topicStats.set(p.topic, s);
 }
 const weakTopics = [...topicStats.entries()].sort((a, b) => {
  const ar = a[1].attempts ? a[1].correct / a[1].attempts : 0;
  const br = b[1].attempts ? b[1].correct / b[1].attempts : 0;
  return ar - br;
 }).map(([t]) => t);

 const all = BAC_SUBJECTS.flatMap(subject => flattenQuestions(subject).map(question => ({ subject, question, key: questionKey(subject.id, question.id) })));
 all.sort((a, b) => {
  const ai = weakTopics.indexOf(a.question.topic); const bi = weakTopics.indexOf(b.question.topic);
  const ar = ai < 0 ? 999 : ai; const br = bi < 0 ? 999 : bi;
  if (ar !== br) return ar - br;
  const ap = progress.questions[a.key]; const bp = progress.questions[b.key];
  return Number(Boolean(ap?.correct)) - Number(Boolean(bp?.correct));
 });
 for (const ref of all) if (!seen.has(ref.key) && refs.length < limit) { refs.push(ref); seen.add(ref.key); }
 return refs.slice(0, limit);
}
