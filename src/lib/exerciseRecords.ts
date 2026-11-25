import { loadSubjectRecord, readSubjectRecord, saveSubjectRecord } from '../core/storage'
import type { ExerciseQuestion } from '../content/types'
import { validAnnotations } from './subjectiveAnnotations'

export function isExerciseAnswerCorrect(question: ExerciseQuestion, selected: readonly string[]): boolean {
  return selected.length === question.answer.length && selected.every((answer) => question.answer.includes(answer))
}

export interface ExerciseAttemptRecord {
  attempts: number
  correct: number
  lastCorrect: boolean | null
  lastAnsweredAt: string | null
}

interface ExerciseProgressData { version: 1; attempts: Record<string, ExerciseAttemptRecord> }
interface WrongQuestionData { version: 1; ids: string[] }

const emptyProgress = (): ExerciseProgressData => ({ version: 1, attempts: {} })

export function loadExerciseProgress(subjectId: string): ExerciseProgressData {
  const value = loadSubjectRecord<Partial<ExerciseProgressData>>(subjectId, 'exercise-progress')
  if (!value || value.version !== 1 || !value.attempts || typeof value.attempts !== 'object' || Array.isArray(value.attempts)) return emptyProgress()
  const attempts: Record<string, ExerciseAttemptRecord> = {}
  for (const [id, item] of Object.entries(value.attempts)) {
    if (!item || !Number.isInteger(item.attempts) || item.attempts < 0 || !Number.isInteger(item.correct) || item.correct < 0 || item.correct > item.attempts) continue
    if (item.lastCorrect !== null && typeof item.lastCorrect !== 'boolean') continue
    if (item.lastAnsweredAt !== null && typeof item.lastAnsweredAt !== 'string') continue
    attempts[id] = item
  }
  return { version: 1, attempts }
}

export function recordExerciseAttempt(subjectId: string, questionId: string, correct: boolean): boolean {
  const stored = readSubjectRecord(subjectId, 'exercise-progress')
  if (stored.error || (stored.raw !== null && (!stored.value || typeof stored.value !== 'object' || (stored.value as Partial<ExerciseProgressData>).version !== 1 || !('attempts' in stored.value)))) return false
  const current = loadExerciseProgress(subjectId)
  const old = current.attempts[questionId] ?? { attempts: 0, correct: 0, lastCorrect: null, lastAnsweredAt: null }
  current.attempts[questionId] = {
    attempts: old.attempts + 1,
    correct: old.correct + (correct ? 1 : 0),
    lastCorrect: correct,
    lastAnsweredAt: new Date().toISOString(),
  }
  return saveSubjectRecord(subjectId, 'exercise-progress', current)
}

export function loadWrongQuestionIds(subjectId: string): string[] {
  const value = loadSubjectRecord<Partial<WrongQuestionData>>(subjectId, 'wrong-questions')
  if (!value || value.version !== 1 || !Array.isArray(value.ids)) return []
  return [...new Set(value.ids.filter((id): id is string => typeof id === 'string' && id.length > 0))]
}

export function setWrongQuestion(subjectId: string, questionId: string, included: boolean): boolean {
  const stored = readSubjectRecord(subjectId, 'wrong-questions')
  if (stored.error || (stored.raw !== null && (!stored.value || typeof stored.value !== 'object' || (stored.value as Partial<WrongQuestionData>).version !== 1 || !Array.isArray((stored.value as Partial<WrongQuestionData>).ids)))) return false
  const ids = new Set(loadWrongQuestionIds(subjectId))
  if (included) ids.add(questionId)
  else ids.delete(questionId)
  return saveSubjectRecord(subjectId, 'wrong-questions', { version: 1, ids: [...ids] } satisfies WrongQuestionData)
}

export interface SubjectiveAnswerDraft {
  originalAnswer: string
  aiSuggestions: string
  revisedAnswer: string
  annotations?: Partial<Record<SubjectiveAnswerField, SubjectiveFieldAnnotations>>
}

export type SubjectiveAnswerField = 'originalAnswer' | 'aiSuggestions' | 'revisedAnswer'
export type SubjectiveHighlightColor = 'yellow' | 'blue' | 'green' | 'pink'
export interface SubjectiveTextMark { id: string; start: number; end: number; quote: string; prefix: string; suffix: string; color?: SubjectiveHighlightColor; underline?: boolean; stale?: boolean }
export interface SubjectiveComment { id: string; start: number; end: number; quote: string; prefix: string; suffix: string; text: string; stale?: boolean }
export interface SubjectiveFieldAnnotations { marks: SubjectiveTextMark[]; comments: SubjectiveComment[] }

// Additive annotation schema: keep v1 text fields intact for existing answers.
interface SubjectiveAnswerData { version: 1; annotationVersion?: 1; answers: Record<string, SubjectiveAnswerDraft> }

function validSubjectiveData(value: unknown): value is SubjectiveAnswerData {
  if (!value || typeof value !== 'object') return false
  const data = value as SubjectiveAnswerData
  if (data.version !== 1 || (data.annotationVersion !== undefined && data.annotationVersion !== 1) || !data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers)) return false
  return Object.values(data.answers).every((answer) => answer && typeof answer.originalAnswer === 'string' && typeof answer.aiSuggestions === 'string' && typeof answer.revisedAnswer === 'string' && (answer.annotations === undefined || (answer.annotations && typeof answer.annotations === 'object' && !Array.isArray(answer.annotations) && Object.entries(answer.annotations).every(([key, field]) => ['originalAnswer', 'aiSuggestions', 'revisedAnswer'].includes(key) && validAnnotations(field)))))
}

export function subjectiveStorageError(subjectId: string): string | null {
  const stored = readSubjectRecord(subjectId, 'subjective')
  return stored.error ?? (stored.raw !== null && !validSubjectiveData(stored.value) ? '主观题存储格式无法安全读取，原记录已保留，暂不覆盖。请先备份浏览器数据。' : null)
}

export function loadSubjectiveAnswers(subjectId: string): Record<string, SubjectiveAnswerDraft> {
  const value = loadSubjectRecord<Partial<SubjectiveAnswerData>>(subjectId, 'subjective')
  if (!validSubjectiveData(value)) return {}
  return Object.fromEntries(Object.entries(value.answers).flatMap(([id, item]) => {
    if (!item || typeof item !== 'object') return []
    const answer = item as Partial<SubjectiveAnswerDraft>
    if (typeof answer.originalAnswer !== 'string' || typeof answer.aiSuggestions !== 'string' || typeof answer.revisedAnswer !== 'string') return []
    const annotations = answer.annotations && typeof answer.annotations === 'object' && !Array.isArray(answer.annotations) ? answer.annotations : {}
    return [[id, { originalAnswer: answer.originalAnswer, aiSuggestions: answer.aiSuggestions, revisedAnswer: answer.revisedAnswer, annotations }]]
  }))
}

export function saveSubjectiveAnswers(subjectId: string, answers: Record<string, SubjectiveAnswerDraft>): boolean {
  if (subjectiveStorageError(subjectId) || !validSubjectiveData({ version: 1, answers })) return false
  return saveSubjectRecord(subjectId, 'subjective', { version: 1, annotationVersion: 1, answers } satisfies SubjectiveAnswerData)
}
