import type { KnowledgePoint } from '../content/types'
import { readSubjectRecord, saveSubjectRecord } from '../core/storage'

export interface KnowledgeModule {
  id: string
  subjectId: string
  lectureId: string
  parentChapterId: string
  title: string
  knowledgePointIds: string[]
  note: string
  externalCourseUrl: string
  createdAt: string
  updatedAt: string
}

interface ModuleRecord { version: 1; modules: KnowledgeModule[] }

export interface ModuleState {
  modules: KnowledgeModule[]
  snapshot: string | null
  readOnly: boolean
  message: string
}

export function isValidCourseUrl(value: string): boolean {
  if (value === '') return true
  if (!/^https?:\/\//i.test(value) || value !== value.trim()) return false
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

function isKnowledgeModule(value: unknown, subjectId: string): value is KnowledgeModule {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  const required = ['id', 'lectureId', 'parentChapterId', 'createdAt', 'updatedAt']
  return item.subjectId === subjectId
    && required.every((key) => typeof item[key] === 'string' && (item[key] as string).trim().length > 0)
    && typeof item.title === 'string'
    && typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt))
    && typeof item.updatedAt === 'string' && Number.isFinite(Date.parse(item.updatedAt))
    && typeof item.note === 'string'
    && typeof item.externalCourseUrl === 'string' && isValidCourseUrl(item.externalCourseUrl)
    && Array.isArray(item.knowledgePointIds)
    && item.knowledgePointIds.every((id) => typeof id === 'string' && id.trim().length > 0)
    && new Set(item.knowledgePointIds).size === item.knowledgePointIds.length
}

export function loadKnowledgeModules(subjectId: string): ModuleState {
  const stored = readSubjectRecord(subjectId, 'knowledge-modules')
  const base = { modules: [], snapshot: stored.raw, readOnly: false, message: '' } satisfies ModuleState
  if (stored.error) return { ...base, readOnly: true, message: `${stored.error}学习模块暂为只读，其他学习功能不受影响。` }
  if (stored.raw === null) return base
  const value = stored.value as Partial<ModuleRecord> | null
  if (!value || typeof value !== 'object' || value.version !== 1 || !Array.isArray(value.modules)) {
    return { ...base, readOnly: true, message: '学习模块格式或版本无法识别。已保留原始存储，未执行覆盖或迁移。' }
  }
  const ids = new Set<string>()
  const modules = value.modules.filter((item) => {
    if (!isKnowledgeModule(item, subjectId) || ids.has(item.id)) return false
    ids.add(item.id)
    return true
  })
  const damaged = modules.length !== value.modules.length
  return { modules, snapshot: stored.raw, readOnly: damaged, message: damaged ? '部分学习模块记录异常。可读取的模块仍可查看，全部原始数据已保留；为避免丢失记录，暂时禁止写入。' : '' }
}

export function saveKnowledgeModules(subjectId: string, modules: KnowledgeModule[], snapshot: string | null): { snapshot?: string; error?: string } {
  const current = loadKnowledgeModules(subjectId)
  if (current.readOnly) return { error: current.message }
  if (current.snapshot !== snapshot) return { error: '其他标签页已更新学习模块。请刷新本页后再操作，避免覆盖其他修改。' }
  if (!modules.every((item) => isKnowledgeModule(item, subjectId)) || new Set(modules.map((item) => item.id)).size !== modules.length) {
    return { error: '学习模块字段无效或 ID 重复，未写入本地存储。' }
  }
  const record: ModuleRecord = { version: 1, modules }
  if (!saveSubjectRecord(subjectId, 'knowledge-modules', record)) return { error: '学习模块未能保存，请检查浏览器存储权限或剩余空间，修改尚未写入。' }
  return { snapshot: JSON.stringify(record) }
}

export function addModulePoint(module: KnowledgeModule, point: KnowledgePoint): KnowledgeModule {
  if (point.lectureId !== module.lectureId) throw new Error('只能添加同一讲的知识点。')
  if ((point.chapterId ?? `unclassified:${point.lectureId}`) !== module.parentChapterId) throw new Error('只能添加此模块所属章节的知识点。')
  if (module.knowledgePointIds.includes(point.id)) return module
  return { ...module, knowledgePointIds: [...module.knowledgePointIds, point.id] }
}

export function moveModulePoint(module: KnowledgeModule, id: string, offset: -1 | 1): KnowledgeModule {
  const ids = [...module.knowledgePointIds]
  const index = ids.indexOf(id)
  const next = index + offset
  if (index < 0 || next < 0 || next >= ids.length) return module
  ;[ids[index], ids[next]] = [ids[next], ids[index]]
  return { ...module, knowledgePointIds: ids }
}
