import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronDown, Download, ExternalLink, Eye, FileUp, Pencil, RotateCcw, Search, X } from 'lucide-react'
import type { EditableKnowledgePoint, KnowledgeContentSection, KnowledgePoint, VerificationStatus } from '../content/types'
import { KnowledgeEditor, type KnowledgeEditorDraft } from '../components/KnowledgeEditor'
import { MarkdownContent } from '../components/MarkdownContent'
import { PageHeading } from '../components/PageHeading'
import { buildLibraryExport, changedKnowledgeContentOverrides, contentTypeLabels, editableFields, loadKnowledgeContentOverrides, saveKnowledgeContentOverrides, validateLibraryImport } from '../lib/knowledgeLibrary'
import { loadVerificationOverrides, saveVerificationOverrides } from '../lib/knowledgeReview'
import { useSubject } from '../core/SubjectContext'
import { constitutionLectures, lectureById, lectureBySourceFile, type LectureResource } from '../subjects/constitution/lectures'
import { constitutionLegacyChapterByKnowledgePointId } from '../subjects/constitution/config'
import { constitutionChapters, constitutionChapterByKnowledgePointId, customChapterId, type CourseChapterOption } from '../subjects/constitution/chapters'

const verificationStatuses: VerificationStatus[] = ['待整理', '待核对', '已核对']
const allChaptersFilterValue = '全部章节'
type PendingConfirmation =
  | { kind: 'restore'; id: string }
  | { kind: 'import'; overrides: ReturnType<typeof loadKnowledgeContentOverrides> }

function formatPages(pages: number[]) {
  return pages.length === 1 ? `PPT 第 ${pages[0]} 页` : `PPT 第 ${pages.join('、')} 页`
}

function sectionBody(section: KnowledgeContentSection) {
  if (section.body !== undefined) {
    if (section.contentType === 'list' && !/^\s*(?:[-*+]\s|\d+\.\s)/m.test(section.body)) {
      return section.body.split('\n').filter(Boolean).map((line) => `- ${line}`).join('\n')
    }
    return section.body
  }
  return section.items?.map((item) => `- ${item}`).join('\n') ?? ''
}

function createDraft(point: KnowledgePoint): KnowledgeEditorDraft {
  const fields = editableFields(point)
  return {
    lectureId: fields.lectureId,
    lectureTitle: fields.lectureTitle,
    title: fields.title,
    chapterId: fields.chapterId,
    chapter: fields.chapter,
    section: fields.section,
    explanation: fields.explanation,
    sourceFile: fields.source.file,
    sourcePages: fields.source.pages.join(', '),
    contentMode: fields.contentSections ? 'structured' : 'simple',
    blocks: fields.contentSections?.map((block) => ({
      heading: block.heading,
      body: block.body ?? block.items?.join('\n') ?? '',
      contentType: block.contentType ?? 'text',
    })) ?? [],
  }
}

function toEditablePoint(draft: KnowledgeEditorDraft): { value?: EditableKnowledgePoint; error?: string } {
  const pages = draft.sourcePages.split(/[,，、\s]+/).filter(Boolean).map(Number)
  if (!draft.lectureId.trim() || !draft.lectureTitle.trim() || !draft.title.trim() || !draft.chapter.trim() || !draft.section.trim()) return { error: '讲次、标题、章节和小节均不能为空。' }
  if (!draft.sourceFile.trim() || pages.length === 0 || pages.some((page) => !Number.isInteger(page) || page < 1)) return { error: '请填写来源文件和有效的正整数 PPT 页码。' }
  if (draft.contentMode === 'simple' && !draft.explanation.trim()) return { error: '简单文本模式下，讲解内容不能为空。' }
  if (draft.contentMode === 'structured' && (draft.blocks.length === 0 || draft.blocks.some((block) => !block.heading.trim() || !block.body.trim()))) {
    return { error: '结构化模式至少需要一个区块，且每个区块都要填写标题和正文。' }
  }

  return {
    value: {
      title: draft.title.trim(),
      lectureId: draft.lectureId.trim(),
      lectureTitle: draft.lectureTitle.trim(),
      chapterId: draft.chapterId?.trim() || undefined,
      chapter: draft.chapter.trim(),
      section: draft.section.trim(),
      explanation: draft.explanation,
      contentSections: draft.contentMode === 'structured' ? draft.blocks.map((block) => ({ ...block, heading: block.heading.trim() })) : null,
      source: { file: draft.sourceFile.trim(), pages: [...new Set(pages)] },
    },
  }
}

function KnowledgeEntry({
  point,
  lecture,
  subjectId,
  chapters,
  verificationStatus,
  onVerificationStatusChange,
  overrideExists,
  editing,
  draft,
  draftError,
  saving,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
  onRestore,
  onOpenPreview,
}: {
  point: KnowledgePoint
  lecture: (typeof constitutionLectures)[number] | undefined
  subjectId: string
  chapters: readonly CourseChapterOption[]
  verificationStatus: VerificationStatus
  onVerificationStatusChange: (id: string, status: VerificationStatus) => void
  overrideExists: boolean
  editing: boolean
  draft: KnowledgeEditorDraft | null
  draftError: string
  saving: boolean
  lectures: typeof constitutionLectures
  onStartEdit: () => void
  onDraftChange: (draft: KnowledgeEditorDraft) => void
  onSave: () => void
  onCancel: () => void
  onRestore: () => void
  onOpenPreview: (lecture: LectureResource) => void
}) {
  const contentSections = point.contentSections
  return (
    <details className="knowledge-entry" data-knowledge-id={point.id}>
      <summary className="knowledge-entry-summary">
        <span className="knowledge-entry-icon"><BookOpen size={17} strokeWidth={1.6} /></span>
        <span className="knowledge-entry-title"><strong>{point.title}</strong><small>{point.lectureTitle} · {point.id}</small></span>
        <span className="verification-status" data-status={verificationStatus}>{verificationStatus}</span>
        <span className="visually-hidden">来源 {formatPages(point.source.pages)}</span>
        <ChevronDown className="knowledge-entry-chevron" size={17} aria-hidden="true" />
      </summary>
      <div className="knowledge-entry-body">
        <div className="verification-editor">
          <label htmlFor={`verification-${point.id}`}>人工核对状态</label>
          <span className="chapter-select-wrap">
            <select id={`verification-${subjectId}-${point.id}`} aria-label={`修改「${point.title}」的核对状态`} value={verificationStatus} onChange={(event) => onVerificationStatusChange(point.id, event.target.value as VerificationStatus)}>
              {verificationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </span>
          <span className="verification-editor-note">仅保存个人核对记录</span>
        </div>

        {editing && draft ? (
          <>
            <KnowledgeEditor draft={draft} chapters={chapters} lectures={constitutionLectures} error={draftError} saving={saving} onChange={onDraftChange} onSave={onSave} onCancel={onCancel} />
            {overrideExists && <button type="button" className="restore-original-button" onClick={onRestore}><RotateCcw size={14} />恢复此条原始内容</button>}
          </>
        ) : (
          <>
            <div className="knowledge-entry-actions">
              <button type="button" className="button button-secondary edit-knowledge-button" onClick={onStartEdit}><Pencil size={14} />编辑知识点</button>
              {overrideExists && <button type="button" className="restore-original-button" onClick={onRestore}><RotateCcw size={14} />恢复原始内容</button>}
            </div>
            <div className="knowledge-content">
              <section className="knowledge-content-section compact"><h3>讲解</h3><MarkdownContent content={point.explanation} /></section>
              {contentSections?.map((section, index) => (
                <section className="knowledge-content-section" key={`${section.heading}-${index}`}>
                  <div className="knowledge-section-title-row"><h3>{section.heading}</h3>{section.contentType && <span className="content-type-label">{contentTypeLabels[section.contentType]}</span>}</div>
                  <MarkdownContent content={sectionBody(section)} />
                </section>
              ))}
            </div>
            <div className="knowledge-source-row">
              <span className="knowledge-source-label">资料来源</span>
              <span>{point.source.file}</span>
              <span className="source-page">{formatPages(point.source.pages)}</span>
              {lecture && <>
                <button type="button" className="button button-secondary open-course-button" onClick={() => onOpenPreview(lecture)} aria-label={`预览${lecture.lectureTitle} PDF，来源页码 ${point.source.pages.join('、')}`}><Eye size={14} />在线预览</button>
                <a className="button button-secondary open-course-button" href={lecture.publicUrl} download={lecture.publicUrl.split('/').pop()} aria-label={`下载${lecture.lectureTitle}原始 PPT，来源页码 ${point.source.pages.join('、')}`}><Download size={14} />下载原始 PPT</a>
              </>}
            </div>
          </>
        )}
      </div>
    </details>
  )
}

export function KnowledgePage() {
  const { subject, registerSubjectChangeGuard } = useSubject()
  const course = subject.courseData!
  const lectures = useMemo(() => constitutionLectures.filter((lecture) => course.knowledgePoints.some((point) => point.lectureId === lecture.lectureId)), [course])
  const [chapter, setChapter] = useState(allChaptersFilterValue)
  const [lectureFilter, setLectureFilter] = useState('全部讲次')
  const [verificationFilter, setVerificationFilter] = useState('全部状态')
  const [query, setQuery] = useState('')
  const [contentOverrides, setContentOverrides] = useState(() => loadKnowledgeContentOverrides(course.knowledgePoints, subject.subjectId))
  const [verificationOverrides, setVerificationOverrides] = useState(() => loadVerificationOverrides(course.knowledgePoints, subject.subjectId))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<KnowledgeEditorDraft | null>(null)
  const [draftBaseline, setDraftBaseline] = useState('')
  const [draftError, setDraftError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [saving, setSaving] = useState(false)
  const [migrationNotice, setMigrationNotice] = useState('')
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null)
  const [previewLecture, setPreviewLecture] = useState<LectureResource | null>(null)
  const [previewAvailable, setPreviewAvailable] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastLocationRef = useRef(`${window.location.pathname}${window.location.search}${window.location.hash}`)
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const dirty = Boolean(draft && JSON.stringify(draft) !== draftBaseline)
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  useEffect(() => registerSubjectChangeGuard(() => {
    if (!dirtyRef.current) return true
    if (!window.confirm('有未保存的修改。切换学科将放弃这些修改，是否继续？')) return false
    cancelEditor(false)
    return true
  }), [registerSubjectChangeGuard])

  useEffect(() => {
    setChapter(allChaptersFilterValue)
    setLectureFilter('全部讲次')
    setVerificationFilter('全部状态')
    setQuery('')
    setContentOverrides(loadKnowledgeContentOverrides(course.knowledgePoints, subject.subjectId))
    setVerificationOverrides(loadVerificationOverrides(course.knowledgePoints, subject.subjectId))
    cancelEditor(false)
  }, [subject.subjectId])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('law-study-platform.migration.report.v1')
      if (!raw) return
      const report = JSON.parse(raw) as { status?: string; conflicts?: Array<{ recordType: string; ids: string[] }>; unmappedLegacyKeys?: string[]; error?: string }
      if (report.status === 'failed') setMigrationNotice(report.error ?? '旧学习数据迁移未完成，原有数据已保留。')
      else if (report.conflicts?.length || report.unmappedLegacyKeys?.length) setMigrationNotice('检测到旧数据存在同名记录或未映射键，已保留原始快照和旧键；冲突记录以学科命名空间中的版本展示。')
      else if (report.status === 'complete') setMigrationNotice('旧版宪法学编辑与核对记录已迁移；旧存储键和迁移快照均保留。')
    } catch {
      setMigrationNotice('迁移报告无法读取；旧存储键未删除。')
    }
  }, [])

  const effectivePoints = useMemo(() => course.knowledgePoints.map((point) => {
    const override = contentOverrides[point.id]
    if (!override) return point

    const assignedChapter = constitutionChapterByKnowledgePointId[point.id]
    const legacyChapter = constitutionLegacyChapterByKnowledgePointId[point.id]
    const copiedLegacyChapter = override.chapter === legacyChapter
    const customChapter = !override.chapterId && !copiedLegacyChapter && override.chapter !== point.chapter
    const chapterId = override.chapterId
      ?? (customChapter ? customChapterId(point.lectureId, override.chapter) : point.chapterId)
    const explicitChapter = override.chapterId
      ? constitutionChapters.find((item) => item.chapterId === override.chapterId)
      : undefined
    const chapterTitle = explicitChapter?.title
      ?? (customChapter || override.chapterId?.startsWith('custom:') ? override.chapter : assignedChapter?.title ?? point.chapter)

    return { ...point, ...override, chapterId, chapter: chapterTitle }
  }), [contentOverrides, course.knowledgePoints])

  const chapterOptions = useMemo(() => {
    const options = new Map<string, CourseChapterOption>()
    for (const point of effectivePoints) {
      const chapterId = point.chapterId ?? `unclassified:${point.lectureId}`
      if (options.has(chapterId)) continue
      const assignedChapter = constitutionChapters.find((item) => item.chapterId === chapterId)
      const lecture = lectureById(point.lectureId)
      options.set(chapterId, {
        chapterId,
        lectureId: point.lectureId,
        lectureTitle: lecture?.lectureTitle ?? point.lectureTitle,
        title: assignedChapter?.title ?? point.chapter ?? '未归类（待核对）',
        custom: chapterId.startsWith('custom:'),
      })
    }
    return [...options.values()]
  }, [effectivePoints])

  const visibleChapterOptions = useMemo(
    () => chapterOptions.filter((option) => lectureFilter === '全部讲次' || option.lectureId === lectureFilter),
    [chapterOptions, lectureFilter],
  )
  const duplicateChapterTitles = useMemo(() => {
    const counts = new Map<string, number>()
    for (const option of chapterOptions) counts.set(option.title, (counts.get(option.title) ?? 0) + 1)
    return counts
  }, [chapterOptions])
  const chapterOptionLabel = (option: CourseChapterOption) => {
    const title = option.custom ? `个人编辑 · ${option.title}` : option.title
    return lectureFilter === '全部讲次' && (duplicateChapterTitles.get(option.title) ?? 0) > 1
      ? `${option.lectureTitle} · ${title}`
      : title
  }
  const selectedLecture = lectureFilter === '全部讲次' ? undefined : lectureById(lectureFilter)
  const getVerificationStatus = (point: KnowledgePoint) => verificationOverrides[point.id] ?? point.verificationStatus
  const progress = useMemo(() => course.knowledgePoints.reduce((counts, point) => {
    counts[getVerificationStatus(point)] += 1
    return counts
  }, { 待整理: 0, 待核对: 0, 已核对: 0 }), [verificationOverrides])

  const openLecturePreview = async (lecture: LectureResource) => {
    setPreviewLecture(lecture)
    setPreviewAvailable(false)
    try {
      const response = await fetch(lecture.pdfUrl, { headers: { Range: 'bytes=0-4' }, credentials: 'same-origin' })
      if (!response.ok || !response.body || !response.headers.get('content-type')?.includes('application/pdf')) {
        await response.body?.cancel()
        return
      }
      const reader = response.body.getReader()
      const { value } = await reader.read()
      await reader.cancel()
      setPreviewAvailable(Boolean(value && new TextDecoder().decode(value.slice(0, 5)) === '%PDF-'))
    } catch {
      setPreviewAvailable(false)
    }
  }

  const cancelEditor = (ask = true) => {
    if (ask && dirty && !window.confirm('有未保存的修改。确定放弃这些修改吗？')) return false
    setEditingId(null)
    setDraft(null)
    setDraftBaseline('')
    setDraftError('')
    return true
  }

  useEffect(() => {
    lastLocationRef.current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  })

  useEffect(() => {
    if (!dirty) return
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const guardNavigation = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!target) return
      const anchor = target as HTMLAnchorElement
      if (anchor.origin !== window.location.origin || anchor.href === window.location.href) return
      if (!window.confirm('有未保存的修改。离开将放弃这些修改，是否继续？')) {
        event.preventDefault()
        event.stopImmediatePropagation()
      } else {
        cancelEditor(false)
      }
    }
    const guardHistory = (event: PopStateEvent) => {
      if (!window.confirm('有未保存的修改。离开将放弃这些修改，是否继续？')) {
        event.stopImmediatePropagation()
        window.history.pushState(null, '', lastLocationRef.current)
      } else {
        cancelEditor(false)
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    window.addEventListener('popstate', guardHistory, true)
    document.addEventListener('click', guardNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      window.removeEventListener('popstate', guardHistory, true)
      document.removeEventListener('click', guardNavigation, true)
    }
  }, [dirty])

  const startEdit = (point: KnowledgePoint) => {
    if (dirty && !cancelEditor(true)) return
    const nextDraft = createDraft(point)
    setEditingId(point.id)
    setDraft(nextDraft)
    setDraftBaseline(JSON.stringify(nextDraft))
    setDraftError('')
    setStorageError('')
  }

  const saveEdit = () => {
    if (!editingId || !draft) return
    const result = toEditablePoint(draft)
    if (!result.value) {
      setDraftError(result.error ?? '请检查填写内容。')
      return
    }
    const nextOverrides = { ...contentOverrides, [editingId]: result.value }
    setSaving(true)
    setContentOverrides(nextOverrides)
    const saved = saveKnowledgeContentOverrides(nextOverrides, subject.subjectId)
    setStorageError(saved ? '' : '内容已更新到当前页面，但浏览器未能写入 LocalStorage。请检查浏览器存储设置后再重试。')
    setSaving(false)
    if (!saved) return
    setEditingId(null)
    setDraft(null)
    setDraftBaseline('')
    setDraftError('')
  }

  const restoreOriginal = (id: string) => {
    const nextOverrides = { ...contentOverrides }
    delete nextOverrides[id]
    setContentOverrides(nextOverrides)
    const saved = saveKnowledgeContentOverrides(nextOverrides, subject.subjectId)
    setStorageError(saved ? '' : '页面已恢复原始内容，但浏览器未能更新 LocalStorage。')
    if (editingId === id) {
      setEditingId(null)
      setDraft(null)
      setDraftBaseline('')
      setDraftError('')
    }
  }

  const confirmPendingAction = () => {
    if (!pendingConfirmation) return
    if (pendingConfirmation.kind === 'restore') {
      restoreOriginal(pendingConfirmation.id)
    } else {
      setContentOverrides(pendingConfirmation.overrides)
      const saved = saveKnowledgeContentOverrides(pendingConfirmation.overrides, subject.subjectId)
      setStorageError(saved ? '' : '导入内容已显示，但浏览器未能写入 LocalStorage。')
      if (saved) cancelEditor(false)
    }
    setPendingConfirmation(null)
  }

  const updateVerificationStatus = (id: string, status: VerificationStatus) => {
    const nextOverrides = { ...verificationOverrides, [id]: status }
    setVerificationOverrides(nextOverrides)
    setStorageError(saveVerificationOverrides(nextOverrides, subject.subjectId) ? '' : '核对状态已更新到当前页面，但浏览器未能写入 LocalStorage。')
  }

  const exportLibrary = () => {
    const normalizedCourse = { ...course, knowledgePoints: effectivePoints }
    const output = JSON.stringify(buildLibraryExport(normalizedCourse, {}, verificationOverrides, subject.subjectId), null, 2)
    const url = URL.createObjectURL(new Blob([output], { type: 'application/json;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${subject.subjectId}-study-library-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importLibrary = async (file?: File) => {
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const validation = validateLibraryImport(parsed, course, subject.subjectId)
      if (!validation.overrides) {
        setStorageError(validation.error ?? '无法读取该知识库文件。')
        return
      }
      setPendingConfirmation({ kind: 'import', overrides: changedKnowledgeContentOverrides(course.knowledgePoints, validation.overrides) })
    } catch {
      setStorageError('无法读取该文件。请确认文件是有效的知识库 JSON。')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredPoints = useMemo(() => effectivePoints.filter((point) => {
    const inLecture = lectureFilter === '全部讲次' || point.lectureId === lectureFilter
    const inChapter = chapter === allChaptersFilterValue || point.chapterId === chapter
    const inStatus = verificationFilter === '全部状态' || getVerificationStatus(point) === verificationFilter
    const searchableText = [point.title, point.chapter, point.section, point.explanation, point.id, point.source.file, ...(point.contentSections ?? []).flatMap((block) => [block.heading, block.body, ...(block.items ?? [])])].join(' ').toLocaleLowerCase()
    return inLecture && inChapter && inStatus && (!normalizedQuery || searchableText.includes(normalizedQuery))
  }), [effectivePoints, lectureFilter, chapter, verificationFilter, normalizedQuery, verificationOverrides])

  const sections = useMemo(() => {
    const grouped = new Map<string, KnowledgePoint[]>()
    for (const point of filteredPoints) grouped.set(point.section, [...(grouped.get(point.section) ?? []), point])
    return [...grouped.entries()]
  }, [filteredPoints])

  return (
    <>
      <PageHeading english="KNOWLEDGE LIBRARY" title="知识点库" description="沿着课程原有章节浏览知识，每条内容均附有 PPT 来源与核对状态。" />
      <section className="verification-progress" aria-label="知识点核对进度">
        <div className="verification-progress-heading"><h2>核对进度</h2><span>{course.knowledgePoints.length} 条知识点</span></div>
        <div className="verification-progress-stats">{verificationStatuses.map((status) => <div className="verification-progress-stat" data-status={status} key={status}><strong>{progress[status]}</strong><span>{status}</span></div>)}</div>
      </section>
      <section className="knowledge-toolbar" aria-label="知识点筛选和备份">
        <label className="chapter-filter"><span>课程讲次</span><span className="chapter-select-wrap"><select value={lectureFilter} onChange={(event) => { setLectureFilter(event.target.value); setChapter(allChaptersFilterValue) }} aria-label="按课程讲次筛选"><option value="全部讲次">全部讲次</option>{lectures.map((lecture) => <option key={lecture.lectureId} value={lecture.lectureId}>{lecture.lectureTitle}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></span></label>
        <label className="chapter-filter"><span>课程章节</span><span className="chapter-select-wrap"><select value={chapter} onChange={(event) => setChapter(event.target.value)} aria-label="按课程章节筛选"><option value={allChaptersFilterValue}>{allChaptersFilterValue}</option>{visibleChapterOptions.map((option) => <option key={option.chapterId} value={option.chapterId}>{chapterOptionLabel(option)}</option>)}{visibleChapterOptions.length === 0 && <option disabled value="__no-chapters__">该讲无独立章节划分</option>}</select><ChevronDown size={15} aria-hidden="true" /></span></label>
        <label className="chapter-filter"><span>核对状态</span><span className="chapter-select-wrap"><select value={verificationFilter} onChange={(event) => setVerificationFilter(event.target.value)} aria-label="按核对状态筛选"><option>全部状态</option>{verificationStatuses.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></span></label>
        <label className="knowledge-search"><Search size={17} /><span className="visually-hidden">搜索知识点</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索知识点、内容或来源" type="search" /></label>
        <span className="knowledge-result-count">显示 <strong>{filteredPoints.length}</strong> / {course.knowledgePoints.length} 条</span>
        <div className="library-actions">
          <button type="button" className="button button-secondary" onClick={exportLibrary}><Download size={15} />导出 JSON</button>
          <button type="button" className="button button-secondary" onClick={() => fileInputRef.current?.click()}><FileUp size={15} />导入 JSON</button>
          <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json,.json" aria-label="选择知识库 JSON 文件" onChange={(event) => void importLibrary(event.currentTarget.files?.[0])} />
        </div>
      </section>
      <section className="lecture-resource-strip" aria-label="本讲课程资料">
        <div><strong>{selectedLecture?.lectureTitle ?? '宪法学课程资料'}</strong><span>{selectedLecture ? `${selectedLecture.pageCount} 页 · ${selectedLecture.sourceFile}` : `${lectures.length} 讲 · 可从知识点详情打开对应课件`}</span></div>
        {selectedLecture && <div className="lecture-resource-actions">
          <button type="button" className="button button-secondary open-course-button" onClick={() => void openLecturePreview(selectedLecture)}><Eye size={14} />在线预览</button>
          <a className="button button-secondary open-course-button" href={selectedLecture.publicUrl} download={selectedLecture.publicUrl.split('/').pop()}><Download size={14} />下载本讲原始 PPT</a>
        </div>}
      </section>
      <div className="knowledge-guidance"><BookOpen size={16} /><span>课程原始 JSON 保持不变；你的内容修改和人工核对状态分别保存在当前浏览器。</span></div>
      {migrationNotice && <p className="migration-notice" role="status">{migrationNotice}</p>}
      {storageError && <p className="storage-warning" role="status">{storageError}</p>}
      {filteredPoints.length > 0 ? (
        <div className="knowledge-sections">
          {sections.map(([section, points]) => (
            <section className="knowledge-section" key={section}>
              <div className="knowledge-section-heading"><h2>{section}</h2><span>{points.length} 条</span></div>
              <div className="knowledge-list">{points.map((point) => <KnowledgeEntry
                key={point.id}
                point={point}
                lecture={lectureBySourceFile(point.source.file)}
                subjectId={subject.subjectId}
                chapters={chapterOptions}
                lectures={lectures}
                verificationStatus={getVerificationStatus(course.knowledgePoints.find((original) => original.id === point.id)!)}
                onVerificationStatusChange={updateVerificationStatus}
                overrideExists={Boolean(contentOverrides[point.id])}
                editing={editingId === point.id}
                draft={editingId === point.id ? draft : null}
                draftError={editingId === point.id ? draftError : ''}
                saving={saving && editingId === point.id}
                onStartEdit={() => startEdit(point)}
                onDraftChange={(next) => { setDraft(next); setDraftError('') }}
                onSave={saveEdit}
                onCancel={() => cancelEditor(true)}
                onRestore={() => setPendingConfirmation({ kind: 'restore', id: point.id })}
                onOpenPreview={(lecture) => void openLecturePreview(lecture)}
              />)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="knowledge-empty"><Search size={23} /><h2>没有匹配的知识点</h2><p>试试更短的关键词，或切换章节和核对状态。</p></div>
      )}
      <p className="knowledge-footer-note">来源文件：{effectivePoints[0]?.source.file} · 共 {effectivePoints.length} 条知识点</p>
      {pendingConfirmation && <div className="confirmation-backdrop">
        <section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-description">
          <span className="eyebrow">PLEASE CONFIRM</span>
          <h2 id="confirmation-title">{pendingConfirmation.kind === 'restore' ? '恢复原始知识点内容？' : '导入并替换当前用户内容？'}</h2>
          <p id="confirmation-description">{pendingConfirmation.kind === 'restore'
            ? '此操作只恢复这条知识点的原始标题、讲解、章节和来源，不会改变其人工核对状态。'
            : `将导入 ${Object.keys(pendingConfirmation.overrides).length} 条知识点的用户内容；文件未包含的记录保持不变${dirty ? '，并放弃当前未保存的编辑' : ''}。人工核对状态保持不变。`}</p>
          <div className="confirmation-actions"><button type="button" className="button button-secondary" onClick={() => setPendingConfirmation(null)}>取消</button><button type="button" className="button button-primary" onClick={confirmPendingAction}>{pendingConfirmation.kind === 'restore' ? '确认恢复' : '确认导入'}</button></div>
        </section>
      </div>}
      {previewLecture && <div className="preview-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewLecture(null) }}>
        <section className="course-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="course-preview-title">
          <header className="course-preview-header">
            <div><h2 id="course-preview-title">{previewLecture.lectureTitle} · PDF 预览</h2><p>{previewLecture.pageCount} 页，页码与原始 PPT 对应</p></div>
            <div className="course-preview-header-actions">
              {previewAvailable && <a className="button button-secondary open-course-button" href={previewLecture.pdfUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} />在新标签打开 PDF</a>}
              <button type="button" className="icon-button" aria-label="关闭预览" onClick={() => setPreviewLecture(null)}><X size={16} /></button>
            </div>
          </header>
          {previewAvailable ? <><iframe className="course-preview-frame" title={`${previewLecture.lectureTitle} PDF 预览`} src={previewLecture.pdfUrl} /><p className="course-preview-note">如果内嵌预览未能显示，可使用右上角链接单独打开 PDF，或回到知识点来源区下载原始 PPT。</p></> : <div className="course-preview-unavailable" role="status">
            <h3>PDF 预览暂不可用</h3>
            <p>当前课程资料目录中没有可访问的 PDF 预览文件，或浏览器无法读取该文件。原始 PPT 保持不变。</p>
            <div className="course-preview-actions">
              <a className="button button-secondary open-course-button" href={previewLecture.publicUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} />尝试打开 PPT</a>
              <a className="button button-primary open-course-button" href={previewLecture.publicUrl} download={previewLecture.publicUrl.split('/').pop()}><Download size={14} />下载原始 PPT</a>
            </div>
          </div>}
        </section>
      </div>}
    </>
  )
}
