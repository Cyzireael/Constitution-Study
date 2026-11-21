import type { KnowledgePoint, VerificationStatus } from '../content/types'
import { subjectStorageKey } from '../core/storage'

const statuses: VerificationStatus[] = ['待整理', '待核对', '已核对']

export type VerificationOverrides = Record<string, VerificationStatus>

export function loadVerificationOverrides(points: readonly KnowledgePoint[], subjectId = 'constitution'): VerificationOverrides {
  try {
    const raw = window.localStorage.getItem(subjectStorageKey(subjectId, 'knowledge-review'))
    if (!raw) return {}

    const saved: unknown = JSON.parse(raw)
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}

    const knownIds = new Set(points.map((point) => point.id))
    return Object.fromEntries(
      Object.entries(saved).filter(([id, status]) =>
        knownIds.has(id) && statuses.includes(status as VerificationStatus),
      ),
    ) as VerificationOverrides
  } catch {
    return {}
  }
}

export function saveVerificationOverrides(overrides: VerificationOverrides, subjectId = 'constitution'): boolean {
  try {
    window.localStorage.setItem(subjectStorageKey(subjectId, 'knowledge-review'), JSON.stringify(overrides))
    return true
  } catch {
    return false
  }
}
