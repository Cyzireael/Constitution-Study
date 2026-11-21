import type {
  CourseContent,
  EditableKnowledgePoint,
  KnowledgeContentOverrides,
  KnowledgeContentSection,
  KnowledgePoint,
  KnowledgeContentType,
  VerificationStatus,
} from '../content/types'
import { subjectStorageKey } from '../core/storage'

const contentTypes: KnowledgeContentType[] = ['text', 'list', 'quote', 'comparison', 'case', 'theory', 'provision', 'diagram']
const reviewStatuses: VerificationStatus[] = ['待整理', '待核对', '已核对']

export const contentTypeLabels: Record<KnowledgeContentType, string> = {
  text: '普通文本',
  list: '列表',
  quote: '引文',
  comparison: '比较材料',
  case: '案例材料',
  theory: '理论观点',
  provision: '法律规定',
  diagram: '图示关系',
}

export function editableFields(point: KnowledgePoint): EditableKnowledgePoint {
  return {
    lectureId: point.lectureId,
    lectureTitle: point.lectureTitle,
    title: point.title,
    chapterId: point.chapterId,
    chapter: point.chapter,
    section: point.section,
    explanation: point.explanation,
    contentSections: point.contentSections?.map((section) => ({
      heading: section.heading,
      body: section.body ?? section.items?.map((item) => `- ${item}`).join('\n') ?? '',
      contentType: section.contentType ?? (section.items && section.items.length > 1 ? 'list' : 'text'),
    })),
    source: { file: point.source.file, pages: [...point.source.pages] },
  }
}

function isEditablePoint(value: unknown): value is EditableKnowledgePoint {
  if (!value || typeof value !== 'object') return false
  const point = value as EditableKnowledgePoint
  return typeof point.title === 'string'
    && typeof point.chapter === 'string'
    && (point.chapterId === undefined || typeof point.chapterId === 'string')
    && typeof point.section === 'string'
    && typeof point.explanation === 'string'
    && !!point.source
    && typeof point.source.file === 'string'
    && Array.isArray(point.source.pages)
    && point.source.pages.length > 0
    && point.source.pages.every((page) => Number.isInteger(page) && page > 0)
    && (point.contentSections === undefined || point.contentSections === null || (Array.isArray(point.contentSections) && point.contentSections.every(isContentSection)))
}

function isContentSection(value: unknown): value is KnowledgeContentSection {
  if (!value || typeof value !== 'object') return false
  const section = value as KnowledgeContentSection
  return typeof section.heading === 'string'
    && (typeof section.body === 'string' || (Array.isArray(section.items) && section.items.every((item) => typeof item === 'string')))
    && (section.contentType === undefined || contentTypes.includes(section.contentType))
}

export function loadKnowledgeContentOverrides(points: readonly KnowledgePoint[], subjectId = 'constitution'): KnowledgeContentOverrides {
  try {
    const raw = window.localStorage.getItem(subjectStorageKey(subjectId, 'knowledge-content'))
    if (!raw) return {}
    const stored: unknown = JSON.parse(raw)
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {}

    const knownPoints = new Map(points.map((point) => [point.id, point]))
    return Object.fromEntries(Object.entries(stored).flatMap(([id, value]) => {
      const original = knownPoints.get(id)
      if (!original || !isEditablePoint(value)) return []
      const merged = { ...editableFields(original), ...value }
      if (!Object.prototype.hasOwnProperty.call(value, 'chapterId')) delete merged.chapterId
      return [[id, merged]]
    })) as KnowledgeContentOverrides
  } catch {
    return {}
  }
}

export function saveKnowledgeContentOverrides(overrides: KnowledgeContentOverrides, subjectId = 'constitution'): boolean {
  try {
    window.localStorage.setItem(subjectStorageKey(subjectId, 'knowledge-content'), JSON.stringify(overrides))
    return true
  } catch {
    return false
  }
}

export function changedKnowledgeContentOverrides(points: readonly KnowledgePoint[], candidates: KnowledgeContentOverrides): KnowledgeContentOverrides {
  const changed: KnowledgeContentOverrides = {}
  for (const point of points) {
    const candidate = candidates[point.id]
    if (!candidate) continue
    const original = editableFields(point)
    const normalizedCandidate = editableFields({ ...point, ...candidate })
    if (JSON.stringify(original) !== JSON.stringify(normalizedCandidate)) changed[point.id] = candidate
  }
  return changed
}

export function validateLibraryImport(value: unknown, original: CourseContent, subjectId = 'constitution'): { overrides?: KnowledgeContentOverrides; error?: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: '文件内容必须是 JSON 对象。' }
  const data = value as { format?: unknown; version?: unknown; subjectId?: unknown; knowledgePoints?: unknown; exercises?: unknown; subjectiveQuestions?: unknown }
  const matchesSubject = data.subjectId === subjectId || (subjectId === 'constitution' && data.subjectId === undefined)
  const supportedFormats = ['law-study-platform-knowledge-library', 'constitution-study-knowledge-library']
  if (!supportedFormats.includes(String(data.format)) || data.version !== 1 || !matchesSubject || !Array.isArray(data.knowledgePoints) || !Array.isArray(data.exercises) || !Array.isArray(data.subjectiveQuestions)) {
    return { error: '文件格式或版本不受支持。请使用本网站导出的知识库 JSON。' }
  }

  const originals = new Map(original.knowledgePoints.map((point) => [point.id, point]))
  const imported = data.knowledgePoints as Array<Record<string, unknown>>
  if (imported.length === 0 || imported.length > originals.size) return { error: '文件中的知识点数量无效。' }

  const overrides: KnowledgeContentOverrides = {}
  for (const item of imported) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !originals.has(item.id)) {
      return { error: '文件包含未知或无效的知识点 ID。' }
    }
    if (overrides[item.id]) return { error: `知识点 ID 重复：${item.id}` }
    const fields: EditableKnowledgePoint = {
      lectureId: typeof item.lectureId === 'string' ? item.lectureId : originals.get(item.id)!.lectureId,
      lectureTitle: typeof item.lectureTitle === 'string' ? item.lectureTitle : originals.get(item.id)!.lectureTitle,
      title: item.title as string,
      chapterId: typeof item.chapterId === 'string' ? item.chapterId : undefined,
      chapter: item.chapter as string,
      section: item.section as string,
      explanation: item.explanation as string,
      contentSections: item.contentSections === undefined ? null : item.contentSections as KnowledgeContentSection[] | null,
      source: item.source as EditableKnowledgePoint['source'],
    }
    if (!isEditablePoint(fields) || !fields.lectureId.trim() || !fields.lectureTitle.trim() || !fields.title.trim() || !fields.chapter.trim() || !fields.section.trim() || !fields.source.file.trim()) {
      return { error: `知识点 ${item.id} 的内容字段或来源信息无效。` }
    }
    if (!reviewStatuses.includes(item.verificationStatus as VerificationStatus)) {
      return { error: `知识点 ${item.id} 的核对状态无效。` }
    }
    overrides[item.id] = fields
  }

  return { overrides }
}

export function buildLibraryExport(course: CourseContent, overrides: KnowledgeContentOverrides, statuses: Record<string, VerificationStatus>, subjectId = 'constitution') {
  return {
    format: 'law-study-platform-knowledge-library',
    version: 1,
    subjectId,
    exportedAt: new Date().toISOString(),
    knowledgePoints: course.knowledgePoints.map((point) => ({
      ...point,
      ...editableFields(point),
      ...(overrides[point.id] ?? {}),
      verificationStatus: statuses[point.id] ?? point.verificationStatus,
    })),
    exercises: course.exercises,
    subjectiveQuestions: course.subjectiveQuestions,
  }
}
