import { useEffect, useId, useRef, useState } from 'react'
import { Highlighter, Underline, MessageCirclePlus, RemoveFormatting, Undo2, Redo2, ChevronDown } from 'lucide-react'
import { emptyAnnotations, formatRange, newComment, rebaseAnnotations, textAnchor } from '../lib/subjectiveAnnotations'
import type { SubjectiveFieldAnnotations, SubjectiveHighlightColor } from '../lib/exerciseRecords'

const colors: { value: SubjectiveHighlightColor; label: string }[] = [
  { value: 'yellow', label: '黄色' }, { value: 'blue', label: '蓝色' },
  { value: 'green', label: '绿色' }, { value: 'pink', label: '粉色' },
]

interface Props {
  label: string
  value: string
  annotations?: SubjectiveFieldAnnotations
  placeholder: string
  onChange: (text: string, annotations: SubjectiveFieldAnnotations) => void
}

// A native textarea owns input, IME, selection, paste and text undo. The inert mirror
// renders escaped React text plus range decoration; no user HTML is parsed.
export function AnnotatedAnswerEditor({ label, value, annotations, placeholder, onChange }: Props) {
  const id = useId()
  const area = useRef<HTMLTextAreaElement>(null)
  const mirror = useRef<HTMLDivElement>(null)
  const selection = useRef({ start: 0, end: 0 })
  const [color, setColor] = useState<SubjectiveHighlightColor>('yellow')
  const [message, setMessage] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentRange, setCommentRange] = useState<ReturnType<typeof textAnchor> | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const undo = useRef<SubjectiveFieldAnnotations[]>([])
  const redo = useRef<SubjectiveFieldAnnotations[]>([])
  const [, updateHistory] = useState(0)
  const data = annotations ?? emptyAnnotations()
  const rememberSelection = () => {
    if (area.current) selection.current = { start: area.current.selectionStart, end: area.current.selectionEnd }
  }
  const sync = () => {
    if (!mirror.current || !area.current) return
    mirror.current.style.width = `${area.current.clientWidth + 2}px`
    mirror.current.style.height = `${area.current.clientHeight + 2}px`
    mirror.current.scrollTop = area.current.scrollTop
    mirror.current.scrollLeft = area.current.scrollLeft
  }
  useEffect(() => {
    const observer = new ResizeObserver(sync)
    if (area.current) observer.observe(area.current)
    sync()
    return () => observer.disconnect()
  }, [])
  useEffect(sync, [value, annotations])

  const changeAnnotations = (next: SubjectiveFieldAnnotations) => {
    undo.current = [...undo.current.slice(-29), data]
    redo.current = []
    onChange(value, next)
  }
  const selected = () => {
    const { start, end } = selection.current
    if (end <= start || end > value.length) { setMessage('请先在正文中选中要标注的文字。'); return null }
    setMessage('')
    return { start, end }
  }
  const restoreSelection = (start: number, end: number) => {
    area.current?.focus({ preventScroll: true })
    area.current?.setSelectionRange(start, end)
    selection.current = { start, end }
  }
  const format = (action: 'highlight' | 'underline' | 'clear') => {
    const range = selected()
    if (!range) return
    changeAnnotations(formatRange(value, data, range.start, range.end, action, color))
    restoreSelection(range.start, range.end)
  }
  const locate = (start: number, end: number, stale?: boolean) => {
    if (stale) { setMessage('原文已变更，无法可靠定位。请选中新文字后使用“关联所选文字”。'); return }
    restoreSelection(start, end)
    const node = mirror.current?.querySelector<HTMLElement>(`[data-start="${start}"]`)
    if (node && area.current && mirror.current) {
      area.current.scrollTop = Math.max(0, node.getBoundingClientRect().top - mirror.current.getBoundingClientRect().top + mirror.current.scrollTop - area.current.clientHeight / 3)
      sync()
    }
    area.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }

  const activeMarks = data.marks.filter((item) => !item.stale)
  const activeComments = data.comments.filter((item) => !item.stale)
  const stops = [...new Set([0, value.length, ...activeMarks.flatMap((item) => [item.start, item.end]), ...activeComments.flatMap((item) => [item.start, item.end])])].filter((offset) => offset >= 0 && offset <= value.length).sort((a, b) => a - b)
  return <section className="annotated-answer-editor" aria-labelledby={`${id}-label`}>
    <label id={`${id}-label`} htmlFor={id} className="answer-editor-label">{label}</label>
    <div className="answer-annotation-toolbar" role="group" aria-label={`${label}标注工具`}>
      <button type="button" className="annotation-tool-button" aria-label="高亮所选文字" title="高亮" onPointerDown={(e) => e.preventDefault()} onClick={() => format('highlight')}><Highlighter size={17} aria-hidden="true" /></button>
      <label className="annotation-color-label" data-color={color} title="高亮颜色"><span className="annotation-color-swatch" aria-hidden="true" /><ChevronDown size={13} aria-hidden="true" /><select aria-label={`${label}高亮颜色`} value={color} onChange={(e) => {
        const nextColor = e.target.value as SubjectiveHighlightColor
        setColor(nextColor)
        const { start, end } = selection.current
        if (end > start && end <= value.length) changeAnnotations(formatRange(value, data, start, end, 'highlight', nextColor))
      }} title="选择高亮颜色">{colors.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <button type="button" className="annotation-tool-button" aria-label="切换下划线" title="下划线" onPointerDown={(e) => e.preventDefault()} onClick={() => format('underline')}><Underline size={17} aria-hidden="true" /></button>
      <button type="button" className="annotation-tool-button" aria-label="为所选文字添加批注" title="添加批注" onPointerDown={(e) => e.preventDefault()} onClick={() => {
        const range = selected()
        if (range) { setCommentRange(textAnchor(value, range.start, range.end)); setCommentText('') }
      }}><MessageCirclePlus size={17} aria-hidden="true" /></button>
      <button type="button" className="annotation-tool-button" aria-label="清除所选文字格式" title="清除格式" onPointerDown={(e) => e.preventDefault()} onClick={() => format('clear')}><RemoveFormatting size={17} aria-hidden="true" /></button>
      <span className="annotation-toolbar-divider" aria-hidden="true" />
      <button type="button" className="annotation-tool-button" aria-label="撤销标注" title="撤销标注" disabled={!undo.current.length} onPointerDown={(e) => e.preventDefault()} onClick={() => {
        const previous = undo.current.pop()
        if (previous) { redo.current.push(data); onChange(value, previous); updateHistory((n) => n + 1) }
      }}><Undo2 size={17} aria-hidden="true" /></button>
      <button type="button" className="annotation-tool-button" aria-label="重做标注" title="重做标注" disabled={!redo.current.length} onPointerDown={(e) => e.preventDefault()} onClick={() => {
        const next = redo.current.pop()
        if (next) { undo.current.push(data); onChange(value, next); updateHistory((n) => n + 1) }
      }}><Redo2 size={17} aria-hidden="true" /></button>
    </div>
    <p className="annotation-editor-hint" id={`${id}-hint`}>选中文字后使用工具栏；文字撤销沿用系统操作，清除格式保留批注。</p>
    <div className="annotation-text-surface">
      <div ref={mirror} className="annotation-text-mirror" aria-hidden="true">{stops.slice(0, -1).map((start, index) => {
        const end = stops[index + 1]
        const marks = activeMarks.filter((item) => item.start <= start && item.end >= end)
        const highlight = [...marks].reverse().find((item) => item.color)?.color
        const comment = activeComments.some((item) => item.start < end && item.end > start)
        return <span data-start={start} key={start} className={`${highlight ? `annotation-highlight-${highlight}` : ''}${marks.some((item) => item.underline) ? ' annotation-underline' : ''}${comment ? ' annotation-comment-anchor' : ''}`}>{value.slice(start, end)}</span>
      })}{'\n'}</div>
      <textarea ref={area} id={id} rows={8} value={value} placeholder={placeholder} aria-describedby={`${id}-hint ${id}-message`} spellCheck={false} onSelect={rememberSelection} onBlur={rememberSelection} onScroll={sync} onChange={(e) => {
        undo.current = []; redo.current = []
        onChange(e.target.value, rebaseAnnotations(value, e.target.value, data))
      }} />
    </div>
    <p id={`${id}-message`} className="annotation-feedback" role="status">{message}</p>
    {commentRange && <div className="annotation-comment-composer">
      <p>针对“{commentRange.quote}”添加批注</p>
      <label>批注内容<textarea autoFocus rows={3} value={commentText} onChange={(e) => setCommentText(e.target.value)} /></label>
      <div><button type="button" disabled={!commentText.trim()} onClick={() => {
        if (value.slice(commentRange.start, commentRange.end) !== commentRange.quote) { setMessage('所选原文已经变更，请重新选择文字添加批注。'); return }
        changeAnnotations({ ...data, comments: [...data.comments, newComment(value, commentRange.start, commentRange.end, commentText)] })
        setCommentRange(null); setCommentText('')
      }}>保存批注</button><button type="button" onClick={() => setCommentRange(null)}>取消</button></div>
    </div>}
    {data.comments.length > 0 && <section className="annotation-comment-list" aria-label={`${label}批注列表`}><h4>批注（{data.comments.length}）</h4>{data.comments.map((comment, index) => <article key={comment.id}>
      <button type="button" className="annotation-quote" onClick={() => locate(comment.start, comment.end, comment.stale)}>批注 {index + 1} · “{comment.quote}”{comment.stale ? '（关联待恢复）' : ' · 定位原文'}</button>
      {comment.stale && <p className="annotation-warning">原文已修改或删除，批注仍保留。请选择原文后重新关联。</p>}
      {editingComment === comment.id ? <label>修改批注<textarea aria-label={`修改批注 ${index + 1}`} rows={3} value={comment.text} onChange={(e) => onChange(value, { ...data, comments: data.comments.map((item) => item.id === comment.id ? { ...item, text: e.target.value } : item) })} /></label> : <p>{comment.text || '（空批注）'}</p>}
      <div className="annotation-comment-actions"><button type="button" onClick={() => setEditingComment(editingComment === comment.id ? null : comment.id)}>{editingComment === comment.id ? '完成编辑' : '编辑批注'}</button><button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => {
        const range = selected()
        if (range) changeAnnotations({ ...data, comments: data.comments.map((item) => item.id === comment.id ? { ...item, ...textAnchor(value, range.start, range.end), stale: false } : item) })
      }}>关联所选文字</button><button type="button" onClick={() => changeAnnotations({ ...data, comments: data.comments.filter((item) => item.id !== comment.id) })}>删除批注</button></div>
    </article>)}</section>}
    {data.marks.some((item) => item.stale) && <details className="annotation-warning"><summary>部分标注的原文已变更，关联待恢复</summary>{data.marks.filter((item) => item.stale).map((mark) => <p key={mark.id}>“{mark.quote}” <button type="button" onClick={() => changeAnnotations({ ...data, marks: data.marks.filter((item) => item.id !== mark.id) })}>删除失效标注</button></p>)}</details>}
  </section>
}
