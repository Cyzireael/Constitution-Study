import type { KnowledgePoint, VerificationStatus } from '../content/types'
import { readSubjectRecord, saveSubjectRecord, subjectStorageKey } from '../core/storage'

const RECORD_VERSION = 1
const statuses: VerificationStatus[] = ['待整理', '待核对', '已核对']

export interface KnowledgeAdditionState {
  points: KnowledgePoint[]
  snapshot: string | null
  readOnly: boolean
  message: string
}

interface AdditionRecord {
  version: 1
  points: KnowledgePoint[]
}

function isPoint(value: unknown, subjectId: string): value is KnowledgePoint {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const point = value as Record<string, unknown>
  const source = point.source as Record<string, unknown> | null
  return typeof point.id === 'string' && point.id.trim().length > 0
    && point.subjectId === subjectId
    && typeof point.lectureId === 'string' && typeof point.lectureTitle === 'string'
    && typeof point.title === 'string' && point.title.trim().length > 0
    && typeof point.chapterId === 'string' && typeof point.chapter === 'string' && typeof point.section === 'string'
    && typeof point.explanation === 'string'
    && !!source && typeof source.file === 'string'
    && Array.isArray(source.pages) && source.pages.every((page) => Number.isInteger(page) && Number(page) > 0)
    && (source.pages.length > 0 || (typeof source.location === 'string' && source.location.trim().length > 0))
    && statuses.includes(point.verificationStatus as VerificationStatus)
    && (point.contentSections === null || point.contentSections === undefined || Array.isArray(point.contentSections))
}

export function loadKnowledgeAdditions(subjectId: string): KnowledgeAdditionState {
  const stored = readSubjectRecord(subjectId, 'knowledge-additions')
  const base = { points: [], snapshot: stored.raw, readOnly: false, message: '' } satisfies KnowledgeAdditionState
  if (stored.error) return { ...base, readOnly: true, message: `${stored.error}新增知识点暂为只读。` }
  if (stored.raw === null) return base
  const record = stored.value as Partial<AdditionRecord> | null
  if (!record || typeof record !== 'object' || record.version !== RECORD_VERSION || !Array.isArray(record.points)) {
    return { ...base, readOnly: true, message: '新增知识点数据格式或版本无法识别。原始记录已保留，未执行覆盖。' }
  }
  const seen = new Set<string>()
  const points = record.points.filter((item) => {
    if (!isPoint(item, subjectId) || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
  const damaged = points.length !== record.points.length
  return { points, snapshot: stored.raw, readOnly: damaged, message: damaged ? '部分新增知识点格式异常。可读取记录仍可查看，但为防止丢失数据已暂停写入。' : '' }
}

export function saveKnowledgeAdditions(subjectId: string, points: KnowledgePoint[], snapshot: string | null): { snapshot?: string; error?: string } {
  const current = loadKnowledgeAdditions(subjectId)
  if (current.readOnly) return { error: current.message }
  if (current.snapshot !== snapshot) return { error: '新增知识点已在其他页面更新。请刷新后再试，避免覆盖数据。' }
  if (!points.every((point) => isPoint(point, subjectId)) || new Set(points.map((point) => point.id)).size !== points.length) {
    return { error: '新增知识点记录无效或 ID 重复，未写入本地存储。' }
  }
  if (current.snapshot !== null) {
    try {
      const targetKey = subjectStorageKey(subjectId, 'knowledge-additions')
      const backupKey = `${targetKey}.pre-import-backup.v1`
      if (window.localStorage.getItem(backupKey) === null) window.localStorage.setItem(backupKey, current.snapshot)
    } catch {
      return { error: '无法为现有新增知识点创建导入前快照；为避免覆盖数据，本次未写入。' }
    }
  }
  const record: AdditionRecord = { version: RECORD_VERSION, points }
  if (!saveSubjectRecord(subjectId, 'knowledge-additions', record)) return { error: '新增知识点未能保存，请检查浏览器存储空间和权限。' }
  return { snapshot: JSON.stringify(record) }
}
