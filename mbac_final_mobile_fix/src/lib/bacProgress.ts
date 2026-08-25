import type { BacSubject, BacTopic } from '../data/bacSubjects';
import { flattenQuestions } from '../data/bacSubjects';

const KEY = 'mathbac_mg_progress_v3';

export interface QuestionProgress {
 subjectId: string;
 questionId: string;
 topic: BacTopic;
 attempts: number;
 correct: boolean;
 earnedPoints: number;
 maxPoints: number;
 updatedAt: string;
}

export interface ExamResult {
 id: string;
 subjectId: string;
 score: number;
 maxScore: number;
 finishedAt: string;
}

export interface BacProgressStore {
 questions: Record<string, QuestionProgress>;
 exams: ExamResult[];
}

function emptyStore(): BacProgressStore {
 return { questions: {}, exams: [] };
}

export function getBacProgress(): BacProgressStore {
 try {
  const raw = localStorage.getItem(KEY);
  if (!raw) return emptyStore();
  const parsed = JSON.parse(raw) as BacProgressStore;
  return {
   questions: parsed.questions || {},
   exams: Array.isArray(parsed.exams) ? parsed.exams : []
  };
 } catch {
  return emptyStore();
 }
}

function save(store: BacProgressStore) {
 localStorage.setItem(KEY, JSON.stringify(store));
 window.dispatchEvent(new CustomEvent('mathbac-progress'));
}

export function recordQuestionAttempt(subjectId: string, questionId: string, topic: BacTopic, correct: boolean, points: number) {
 const store = getBacProgress();
 const key = `${subjectId}:${questionId}`;
 const prev = store.questions[key];
 store.questions[key] = {
  subjectId,
  questionId,
  topic,
  attempts: (prev?.attempts || 0) + 1,
  correct: Boolean(prev?.correct || correct),
  earnedPoints: prev?.correct ? prev.earnedPoints : (correct ? points : 0),
  maxPoints: points,
  updatedAt: new Date().toISOString()
 };
 save(store);
}

export function recordExam(subjectId: string, score: number, maxScore: number) {
 const store = getBacProgress();
 store.exams.unshift({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  subjectId,
  score,
  maxScore,
  finishedAt: new Date().toISOString()
 });
 store.exams = store.exams.slice(0, 20);
 save(store);
}

export function resetBacProgress() {
 localStorage.removeItem(KEY);
 window.dispatchEvent(new CustomEvent('mathbac-progress'));
}

export function subjectProgress(subject: BacSubject) {
 const store = getBacProgress();
 const questions = flattenQuestions(subject);
 const done = questions.filter(q => store.questions[`${subject.id}:${q.id}`]?.correct).length;
 return { done, total: questions.length, percent: questions.length ? Math.round((done / questions.length) * 100) : 0 };
}

export function topicProgress(subjects: BacSubject[]) {
 const store = getBacProgress();
 const totals = new Map<BacTopic, { done: number; total: number }>();
 for (const subject of subjects) {
  for (const q of flattenQuestions(subject)) {
   const current = totals.get(q.topic) || { done: 0, total: 0 };
   current.total += 1;
   if (store.questions[`${subject.id}:${q.id}`]?.correct) current.done += 1;
   totals.set(q.topic, current);
  }
 }
 return [...totals.entries()].map(([topic, value]) => ({ topic, ...value, percent: value.total ? Math.round(value.done / value.total * 100) : 0 }));
}
