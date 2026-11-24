import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Layers3, Plus, Trash2, X } from 'lucide-react'
import type { KnowledgePoint, VerificationStatus } from '../content/types'
import type { LectureResource } from '../subjects/constitution/lectures'
import type { CourseChapterOption } from '../subjects/constitution/chapters'
import { MarkdownContent } from './MarkdownContent'
import { addModulePoint, isValidCourseUrl, loadKnowledgeModules, moveModulePoint, saveKnowledgeModules, type KnowledgeModule } from '../lib/knowledgeModules'

interface Props {
  subjectId: string
  points: readonly KnowledgePoint[]
  lectures: readonly LectureResource[]
  chapters: readonly CourseChapterOption[]
  statusFor: (point: KnowledgePoint) => VerificationStatus
  lectureFilter: string
  chapterFilter: string
  allChaptersFilterValue: string
  notesSource?: boolean
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `module-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function now() { return new Date().toISOString() }

export function KnowledgeModules({ subjectId, points, lectures, chapters, statusFor, lectureFilter, chapterFilter, allChaptersFilterValue, notesSource = false }: Props) {
  const [storedState, setStoredState] = useState(() => loadKnowledgeModules(subjectId))
  const [newLectureId, setNewLectureId] = useState(lectureFilter === '全部讲次' ? lectures[0]?.lectureId ?? '' : lectureFilter)
  const [newChapterId, setNewChapterId] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [queries, setQueries] = useState<Record<string, string>>({})
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setStoredState(loadKnowledgeModules(subjectId))
    setNewLectureId(lectureFilter === '全部讲次' ? lectures[0]?.lectureId ?? '' : lectureFilter)
    setExpandedId(null)
  }, [subjectId])

  useEffect(() => {
    if (lectureFilter !== '全部讲次') setNewLectureId(lectureFilter)
  }, [lectureFilter])

  const lectureOptions = useMemo(() => lectures.filter((lecture) => points.some((point) => point.lectureId === lecture.lectureId)), [lectures, points])
  const createChapterOptions = useMemo(() => chapters.filter((item) => item.lectureId === newLectureId), [chapters, newLectureId])
  const visibleModules = useMemo(() => storedState.modules.filter((item) =>
    (lectureFilter === '全部讲次' || item.lectureId === lectureFilter)
    && (chapterFilter === allChaptersFilterValue || item.parentChapterId === chapterFilter),
  ), [storedState.modules, lectureFilter, chapterFilter, allChaptersFilterValue])
  const pointById = useMemo(() => new Map(points.map((point) => [point.id, point])), [points])

  const persist = (next: KnowledgeModule[]) => {
    const result = saveKnowledgeModules(subjectId, next, storedState.snapshot)
    if (result.error) {
      setErrors((previous) => ({ ...previous, storage: result.error! }))
      return false
    }
    setErrors((previous) => { const { storage: _storage, ...rest } = previous; return rest })
    setStoredState({ modules: next, snapshot: result.snapshot!, readOnly: false, message: '' })
    return true
  }

  const updateModule = (id: string, update: (item: KnowledgeModule) => KnowledgeModule) => {
    const next = storedState.modules.map((item) => item.id === id ? { ...update(item), updatedAt: now() } : item)
    persist(next)
  }

  const createModule = () => {
    if (storedState.readOnly) return
    if (!newChapterId) { setErrors((previous) => ({ ...previous, create: '请先选择该讲的课程章节。' })); return }
    const chapter = chapters.find((item) => item.chapterId === newChapterId && item.lectureId === newLectureId)
    if (!chapter) { setErrors((previous) => ({ ...previous, create: '所选章节与讲次不匹配，请重新选择。' })); return }
    const timestamp = now()
    const item: KnowledgeModule = { id: makeId(), subjectId, lectureId: newLectureId, parentChapterId: chapter.chapterId, title: '新学习模块', knowledgePointIds: [], note: '', externalCourseUrl: '', createdAt: timestamp, updatedAt: timestamp }
    if (persist([...storedState.modules, item])) {
      setExpandedId(item.id)
      setErrors((previous) => { const { create: _create, ...rest } = previous; return rest })
    }
  }

  const removeModule = (module: KnowledgeModule) => {
    if (!window.confirm(`删除学习模块「${module.title}」？这只会删除模块及其关系，不会删除任何知识点。`)) return
    persist(storedState.modules.filter((item) => item.id !== module.id))
    if (expandedId === module.id) setExpandedId(null)
  }

  return <section className="learning-modules" aria-labelledby="learning-modules-title">
    <div className="learning-modules-heading"><div><span className="eyebrow">PERSONAL STUDY MODULES</span><h2 id="learning-modules-title"><Layers3 size={19} />学习模块</h2><p>学习模块是你创建的个人整理空间，归属明确的讲次与课程章节；与课件原有章节区分。</p></div><span className="module-count">{visibleModules.length} 个模块</span></div>
    <div className="module-create-panel">
      <label className="editor-field">{notesSource ? '笔记归属范围（未按讲次划分）' : '讲次'}<span className="chapter-select-wrap"><select value={newLectureId} onChange={(event) => { setNewLectureId(event.target.value); setNewChapterId('') }} disabled={storedState.readOnly}><option value="" disabled>{notesSource ? '选择笔记范围' : '选择讲次'}</option>{lectureOptions.map((item) => <option key={item.lectureId} value={item.lectureId}>{item.lectureTitle}</option>)}</select><ChevronDown size={14} /></span></label>
      <label className="editor-field">{notesSource ? '所属笔记分类' : '所属课程章节'}<span className="chapter-select-wrap"><select value={newChapterId} onChange={(event) => setNewChapterId(event.target.value)} disabled={storedState.readOnly || !createChapterOptions.length}><option value="">选择章节</option>{createChapterOptions.map((item) => <option key={item.chapterId} value={item.chapterId}>{item.title}</option>)}</select><ChevronDown size={14} /></span></label>
      <button type="button" className="button button-primary" onClick={createModule} disabled={storedState.readOnly}><Plus size={15} />新建学习模块</button>
    </div>
    {errors.create && <p className="module-error" role="alert">{errors.create}</p>}
    {storedState.message && <p className="module-notice" role="status">{storedState.message}</p>}
    {errors.storage && <p className="module-error" role="alert">{errors.storage}</p>}
    {visibleModules.length ? <div className="module-list">{visibleModules.map((module) => {
      const lecture = lectures.find((item) => item.lectureId === module.lectureId)
      const parent = chapters.find((item) => item.chapterId === module.parentChapterId && item.lectureId === module.lectureId)
      const modulePoints = module.knowledgePointIds.flatMap((id) => {
        const point = pointById.get(id)
        return point?.lectureId === module.lectureId && (point.chapterId ?? `unclassified:${point.lectureId}`) === module.parentChapterId ? [point] : []
      })
      const missingCount = module.knowledgePointIds.length - modulePoints.length
      const query = (queries[module.id] ?? '').trim().toLocaleLowerCase()
      const candidates = points.filter((point) => point.lectureId === module.lectureId && (point.chapterId ?? `unclassified:${point.lectureId}`) === module.parentChapterId && !module.knowledgePointIds.includes(point.id) && (!query || `${point.title} ${point.explanation} ${point.id}`.toLocaleLowerCase().includes(query)))
      const isOpen = expandedId === module.id
      return <article className="module-card" key={module.id}>
        <div className="module-card-heading"><button type="button" className="module-toggle" aria-expanded={isOpen} onClick={() => setExpandedId(isOpen ? null : module.id)}><ChevronDown size={17} className={isOpen ? 'module-chevron expanded' : 'module-chevron'} /><span className="module-heading-text"><strong>{module.title}</strong><small>{lecture?.lectureTitle ?? module.lectureId} · {parent?.title ?? '原课程章节已不存在'} · {modulePoints.length} 条知识点</small></span></button><button type="button" className="icon-button module-delete" aria-label={`删除学习模块 ${module.title}`} onClick={() => removeModule(module)} disabled={storedState.readOnly}><Trash2 size={15} /></button></div>
        {isOpen && <div className="module-card-body">
          <label className="editor-field">模块标题<input value={module.title} maxLength={120} disabled={storedState.readOnly} onChange={(event) => updateModule(module.id, (item) => ({ ...item, title: event.target.value }))} onBlur={(event) => { if (!event.currentTarget.value.trim()) updateModule(module.id, (item) => ({ ...item, title: '未命名学习模块' })) }} /></label>
          <label className="editor-field">从本讲、本章节添加知识点<input type="search" placeholder="按标题、内容或 ID 搜索" value={queries[module.id] ?? ''} disabled={storedState.readOnly} onChange={(event) => setQueries((previous) => ({ ...previous, [module.id]: event.target.value }))} /></label>
          <div className="module-candidate-list" aria-label="可添加的知识点">{candidates.slice(0, 8).map((point) => <button type="button" key={point.id} disabled={storedState.readOnly} onClick={() => updateModule(module.id, (item) => addModulePoint(item, point))}><Plus size={14} /><span>{point.title}</span><small>{point.id}</small></button>)}{!candidates.length && <p>{query ? '没有匹配的知识点。' : '该章节的知识点均已加入。'}</p>}{candidates.length > 8 && <p>还有 {candidates.length - 8} 条匹配结果，请继续搜索缩小范围。</p>}</div>
          <div className="module-entries-heading"><h3>模块内知识点</h3><span>可用上移、下移调整顺序</span></div>
          {missingCount > 0 && <p className="module-notice" role="status">有 {missingCount} 条知识点引用已不存在或不再属于此模块章节，已安全忽略。</p>}
          <div className="module-knowledge-list">{modulePoints.map((point, index) => <details className="module-knowledge-entry" key={point.id}><summary><BookOpen size={15} /><span>{index + 1}. {point.title}</span><small className="verification-status" data-status={statusFor(point)}>{statusFor(point)}</small></summary><div className="module-point-content"><MarkdownContent content={point.explanation} />{point.contentSections?.map((section, sectionIndex) => <section key={`${point.id}-${sectionIndex}`}><h4>{section.heading}</h4><MarkdownContent content={section.body ?? section.items?.map((item) => `- ${item}`).join('\n') ?? ''} /></section>)}<p className="module-point-source">来源：{point.source.file} · {point.source.location ?? (point.source.pages.length === 1 ? `第 ${point.source.pages[0]} 页` : `第 ${point.source.pages.join('、')} 页`)}</p></div><div className="module-point-actions"><button type="button" className="button button-secondary" disabled={storedState.readOnly || index === 0} aria-label={`上移 ${point.title}`} onClick={() => updateModule(module.id, (item) => moveModulePoint(item, point.id, -1))}><ChevronUp size={14} />上移</button><button type="button" className="button button-secondary" disabled={storedState.readOnly || index === modulePoints.length - 1} aria-label={`下移 ${point.title}`} onClick={() => updateModule(module.id, (item) => moveModulePoint(item, point.id, 1))}><ChevronDown size={14} />下移</button><button type="button" className="button button-secondary module-remove-point" disabled={storedState.readOnly} onClick={() => updateModule(module.id, (item) => ({ ...item, knowledgePointIds: item.knowledgePointIds.filter((id) => id !== point.id) }))}><X size={14} />从模块移除</button></div></details>)}</div>
          <label className="editor-field module-note-field">模块笔记<textarea rows={5} value={module.note} disabled={storedState.readOnly} placeholder="记录本模块的个人学习笔记…" onChange={(event) => updateModule(module.id, (item) => ({ ...item, note: event.target.value }))} /></label>
          <div className="module-url-area"><label className="editor-field">外部网课链接<input type="url" inputMode="url" value={urlDrafts[module.id] ?? module.externalCourseUrl} disabled={storedState.readOnly} aria-invalid={Boolean(errors[`url-${module.id}`])} placeholder="https://example.com/course" onChange={(event) => { const value = event.target.value; setUrlDrafts((previous) => ({ ...previous, [module.id]: value })); setErrors((previous) => { const { [`url-${module.id}`]: _url, ...rest } = previous; return rest }) }} onBlur={(event) => { const value = event.currentTarget.value; const valid = isValidCourseUrl(value); setErrors((previous) => ({ ...previous, [`url-${module.id}`]: valid ? '' : '请输入有效的 http:// 或 https:// 链接。' })); if (valid) updateModule(module.id, (item) => ({ ...item, externalCourseUrl: value })) }} /><small>只接受 http:// 或 https://，留空可以清除链接。</small></label>{module.externalCourseUrl && isValidCourseUrl(module.externalCourseUrl) && <a className="button button-secondary" href={module.externalCourseUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />打开网课</a>}</div>
          {errors[`url-${module.id}`] && <p className="module-error" role="alert">{errors[`url-${module.id}`]}</p>}
        </div>}
      </article>
    })}</div> : <div className="module-empty"><Layers3 size={21} /><p>{lectureFilter === '全部讲次' ? '还没有学习模块。选择一个讲次和章节即可创建。' : '当前筛选范围没有学习模块。你可以在上方选择讲次和章节来创建。'}</p></div>}
  </section>
}
