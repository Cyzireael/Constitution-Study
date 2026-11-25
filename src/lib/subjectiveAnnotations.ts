import type { SubjectiveComment, SubjectiveFieldAnnotations, SubjectiveHighlightColor, SubjectiveTextMark } from './exerciseRecords'

export const emptyAnnotations = (): SubjectiveFieldAnnotations => ({ marks: [], comments: [] })
type Anchor = Pick<SubjectiveTextMark, 'start' | 'end' | 'quote' | 'prefix' | 'suffix' | 'stale'>

export function textAnchor(text: string, start: number, end: number): Anchor {
  return { start, end, quote: text.slice(start, end), prefix: text.slice(Math.max(0, start - 24), start), suffix: text.slice(end, end + 24) }
}

function isAnchor(value: unknown): value is Anchor & { id: string } {
  if (!value || typeof value !== 'object') return false
  const a = value as SubjectiveTextMark
  return typeof a.id === 'string' && Number.isInteger(a.start) && Number.isInteger(a.end) && a.start >= 0 && a.end > a.start && typeof a.quote === 'string' && typeof a.prefix === 'string' && typeof a.suffix === 'string' && (a.stale === undefined || typeof a.stale === 'boolean')
}

export function validAnnotations(value: unknown): value is SubjectiveFieldAnnotations {
  if (!value || typeof value !== 'object') return false
  const data = value as SubjectiveFieldAnnotations
  return Array.isArray(data.marks) && Array.isArray(data.comments)
    && data.marks.every((a) => isAnchor(a) && (a.color === undefined || ['yellow', 'blue', 'green', 'pink'].includes(a.color)) && (a.underline === undefined || typeof a.underline === 'boolean'))
    && data.comments.every((a) => isAnchor(a) && typeof a.text === 'string')
}

// One native textarea input gives one replacement interval (also covers paste and undo).
// Intersections keep the remaining text; a completely replaced quote is retained as unresolved.
export function rebaseAnnotations(before: string, after: string, annotations: SubjectiveFieldAnnotations): SubjectiveFieldAnnotations {
  if (before === after) return annotations
  let left = 0
  while (left < before.length && left < after.length && before[left] === after[left]) left++
  let oldRight = before.length
  let newRight = after.length
  while (oldRight > left && newRight > left && before[oldRight - 1] === after[newRight - 1]) { oldRight--; newRight-- }
  const delta = newRight - oldRight
  const rebase = <T extends Anchor>(anchor: T): T => {
    if (anchor.stale) {
      // Only restore an exact, unique quotation with matching context, e.g. native undo.
      const at = after.indexOf(anchor.quote)
      if (at >= 0 && after.indexOf(anchor.quote, at + 1) === -1 && after.slice(Math.max(0, at - anchor.prefix.length), at) === anchor.prefix && after.slice(at + anchor.quote.length, at + anchor.quote.length + anchor.suffix.length) === anchor.suffix) return { ...anchor, ...textAnchor(after, at, at + anchor.quote.length), stale: false }
      return anchor
    }
    if (anchor.start >= left && anchor.end <= oldRight && oldRight > left) return { ...anchor, stale: true }
    const start = anchor.start >= oldRight ? anchor.start + delta : anchor.start > left ? left : anchor.start
    const end = anchor.end <= left ? anchor.end : anchor.end >= oldRight ? anchor.end + delta : newRight
    if (end <= start) return { ...anchor, stale: true }
    return { ...anchor, ...textAnchor(after, start, end) }
  }
  return { marks: annotations.marks.map(rebase), comments: annotations.comments.map(rebase) }
}

export function formatRange(text: string, annotations: SubjectiveFieldAnnotations, start: number, end: number, action: 'highlight' | 'underline' | 'clear', color: SubjectiveHighlightColor): SubjectiveFieldAnnotations {
  if (start === end) return annotations
  const overlaps = (mark: SubjectiveTextMark) => !mark.stale && mark.start < end && mark.end > start
  const underlined = Array.from({ length: end - start }, (_, offset) => annotations.marks.some((mark) => !mark.stale && mark.underline && mark.start <= start + offset && mark.end > start + offset)).every(Boolean)
  const marks: SubjectiveTextMark[] = []
  for (const mark of annotations.marks) {
    if (!overlaps(mark)) { marks.push(mark); continue }
    if (mark.start < start) marks.push({ ...mark, ...textAnchor(text, mark.start, start) })
    if (mark.end > end) marks.push({ ...mark, id: crypto.randomUUID(), ...textAnchor(text, end, mark.end) })
    const middle = { ...mark, id: crypto.randomUUID(), ...textAnchor(text, Math.max(mark.start, start), Math.min(mark.end, end)) }
    if (action === 'highlight') delete middle.color
    if (action === 'underline') delete middle.underline
    if (action === 'clear') { delete middle.color; delete middle.underline }
    if (middle.color || middle.underline) marks.push(middle)
  }
  if (action !== 'clear' && !(action === 'underline' && underlined)) marks.push({ id: crypto.randomUUID(), ...textAnchor(text, start, end), ...(action === 'highlight' ? { color } : { underline: true }) })
  return { ...annotations, marks }
}

export function newComment(text: string, start: number, end: number, comment: string): SubjectiveComment {
  return { id: crypto.randomUUID(), ...textAnchor(text, start, end), text: comment }
}
