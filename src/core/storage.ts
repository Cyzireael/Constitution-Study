export const storageKeys = {
  selectedSubject: 'law-study-platform.subject.current.v1',
  migrationBackup: 'law-study-platform.migration.backup.v1',
  migrationReport: 'law-study-platform.migration.report.v1',
  migrationComplete: 'law-study-platform.migration.v1.complete',
} as const

export type SubjectRecordType = 'knowledge-content' | 'knowledge-review' | 'exercises' | 'subjective' | 'wrong-questions' | 'favorites' | 'progress'

export function subjectStorageKey(subjectId: string, recordType: SubjectRecordType | string) {
  return `law-study-platform.subject.${subjectId}.${recordType}.v1`
}

export function readStorageObject(key: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? 'null')
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
  } catch {
    return null
  }
}

export function writeStorageObject(key: string, value: Record<string, unknown>) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadSubjectRecord<T>(subjectId: string, recordType: SubjectRecordType): T | null {
  try {
    const value = window.localStorage.getItem(subjectStorageKey(subjectId, recordType))
    return value === null ? null : JSON.parse(value) as T
  } catch {
    return null
  }
}

export function saveSubjectRecord(subjectId: string, recordType: SubjectRecordType, value: unknown) {
  try {
    window.localStorage.setItem(subjectStorageKey(subjectId, recordType), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
