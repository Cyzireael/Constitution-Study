import constitutionCourse from '../subjects/constitution/course.json'
import type { CourseContent, KnowledgePoint, VerificationStatus } from '../content/types'
import { storageKeys, subjectStorageKey } from './storage'

const SUBJECT_ID = 'constitution'
const LEGACY_KEYS = [
  { legacy: 'constitution-study.knowledge-content.v1', recordType: 'knowledge-content' },
  { legacy: 'constitution-study.knowledge-review.v1', recordType: 'knowledge-review' },
] as const

export interface StorageMigrationReport {
  status: 'complete' | 'failed' | 'already-complete'
  snapshotKey: string
  migratedKeys: string[]
  migratedRecords: Record<string, number>
  conflicts: Array<{ recordType: string; ids: string[] }>
  unmappedLegacyKeys: string[]
  error?: string
}

function parseMap(raw: string | null): Record<string, unknown> | null {
  if (raw === null) return {}
  try {
    const value: unknown = JSON.parse(raw)
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
  } catch {
    return null
  }
}

function validUserRecord(recordType: string, pointIds: Set<string>, value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  if (recordType === 'knowledge-review') {
    const allowed: VerificationStatus[] = ['待整理', '待核对', '已核对']
    return Object.entries(value).every(([id, status]) => pointIds.has(id) && allowed.includes(status as VerificationStatus))
  }
  return Object.entries(value).every(([id, item]) => {
    if (!pointIds.has(id) || !item || typeof item !== 'object' || Array.isArray(item)) return false
    const edit = item as Record<string, unknown>
    const source = edit.source as Record<string, unknown> | undefined
    return typeof edit.title === 'string'
      && typeof edit.chapter === 'string'
      && typeof edit.section === 'string'
      && typeof edit.explanation === 'string'
      && !!source
      && typeof source.file === 'string'
      && Array.isArray(source.pages)
      && source.pages.every((page) => Number.isInteger(page) && Number(page) > 0)
  })
}

function verifyCourseCopy() {
  const source = (constitutionCourse as unknown as CourseContent).knowledgePoints
  const ids = source.map((point: KnowledgePoint) => point.id)
  return source.length === 41
    && new Set(ids).size === 41
    && source.every((point: KnowledgePoint) => point.id.startsWith('L01-') && point.source.file === 'source-materials/lecture-01.pptx.pptx' && point.source.pages.length > 0)
}

export function migrateLegacyStorage(): StorageMigrationReport {
  const emptyReport: StorageMigrationReport = { status: 'failed', snapshotKey: storageKeys.migrationBackup, migratedKeys: [], migratedRecords: {}, conflicts: [], unmappedLegacyKeys: [] }
  let localStore: Storage
  try {
    localStore = window.localStorage
    if (!localStore) throw new Error('当前浏览器未提供 LocalStorage。旧数据未修改。')
  } catch (error) {
    emptyReport.error = error instanceof Error ? error.message : '当前浏览器无法访问 LocalStorage。'
    return emptyReport
  }

  const existingReportRaw = localStore.getItem(storageKeys.migrationReport)
  const completed = localStore.getItem(storageKeys.migrationComplete) === 'true'
  if (completed && existingReportRaw) {
    try { return { ...(JSON.parse(existingReportRaw) as StorageMigrationReport), status: 'already-complete' } } catch { /* rebuild report below */ }
  }

  const report: StorageMigrationReport = {
    status: 'failed',
    snapshotKey: storageKeys.migrationBackup,
    migratedKeys: [],
    migratedRecords: {},
    conflicts: [],
    unmappedLegacyKeys: [],
  }

  try {
    if (!verifyCourseCopy()) throw new Error('宪法学课程副本完整性检查失败，已停止迁移。')

    if (!localStore.getItem(storageKeys.migrationBackup)) {
      const snapshot: Record<string, string> = {}
      for (let index = 0; index < localStore.length; index += 1) {
        const key = localStore.key(index)
        if (key) snapshot[key] = localStore.getItem(key) ?? ''
      }
      localStore.setItem(storageKeys.migrationBackup, JSON.stringify({ createdAt: new Date().toISOString(), origin: window.location.origin, entries: snapshot }))
    }

    const pointIds = new Set((constitutionCourse as unknown as CourseContent).knowledgePoints.map((point) => point.id))
    for (const mapping of LEGACY_KEYS) {
      const legacyRaw = localStore.getItem(mapping.legacy)
      if (legacyRaw === null) continue
      const legacy = parseMap(legacyRaw)
      if (!legacy || !validUserRecord(mapping.recordType, pointIds, legacy)) {
        report.unmappedLegacyKeys.push(mapping.legacy)
        continue
      }

      const namespacedKey = subjectStorageKey(SUBJECT_ID, mapping.recordType)
      const currentRaw = localStore.getItem(namespacedKey)
      const current = parseMap(currentRaw)
      if (!current) throw new Error(`新命名空间数据格式无效：${namespacedKey}。原始数据和旧键均已保留。`)

      const merged = { ...legacy, ...current }
      const conflictIds = Object.keys(legacy).filter((id) => Object.hasOwn(current, id) && JSON.stringify(legacy[id]) !== JSON.stringify(current[id]))
      if (conflictIds.length) report.conflicts.push({ recordType: mapping.recordType, ids: conflictIds })
      if (!currentRaw || JSON.stringify(merged) !== JSON.stringify(current)) {
        localStore.setItem(namespacedKey, JSON.stringify(merged))
        report.migratedKeys.push(namespacedKey)
      }
      report.migratedRecords[mapping.recordType] = Object.keys(merged).length
    }

    report.unmappedLegacyKeys = [...new Set([
      ...report.unmappedLegacyKeys,
      ...Array.from({ length: localStore.length }, (_, index) => localStore.key(index)).filter((key): key is string => Boolean(key && key.startsWith('constitution-study.') && !LEGACY_KEYS.some((mapping) => mapping.legacy === key))),
    ])]
    if (!localStore.getItem(storageKeys.selectedSubject)) localStore.setItem(storageKeys.selectedSubject, SUBJECT_ID)
    report.status = 'complete'
    localStore.setItem(storageKeys.migrationReport, JSON.stringify(report))
    localStore.setItem(storageKeys.migrationComplete, 'true')
    return report
  } catch (error) {
    report.error = error instanceof Error ? error.message : '未知迁移错误'
    try { localStore.setItem(storageKeys.migrationReport, JSON.stringify(report)) } catch { /* keep old data untouched */ }
    return report
  }
}
