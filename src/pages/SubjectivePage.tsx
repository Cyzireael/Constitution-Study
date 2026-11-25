import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, NotebookPen } from 'lucide-react'
import { PageHeading } from '../components/PageHeading'
import { MarkdownContent } from '../components/MarkdownContent'
import { AnnotatedAnswerEditor } from '../components/AnnotatedAnswerEditor'
import { useSubject } from '../core/SubjectContext'
import { loadSubjectiveAnswers, saveSubjectiveAnswers, subjectiveStorageError, type SubjectiveAnswerDraft, type SubjectiveAnswerField, type SubjectiveFieldAnnotations } from '../lib/exerciseRecords'
import type { SubjectConfig } from '../core/subjects'
import type { SubjectiveQuestion } from '../content/types'

export function SubjectivePage() {
  const { subject } = useSubject()
  return <SubjectiveWorkspace key={subject.subjectId} subject={subject} />
}

function SubjectiveWorkspace({ subject }: { subject: SubjectConfig }) {
  const { registerSubjectChangeGuard } = useSubject()
  const questions = (subject.courseData?.subjectiveQuestions ?? []) as SubjectiveQuestion[]
  const [answers, setAnswers] = useState<Record<string, SubjectiveAnswerDraft>>(() => loadSubjectiveAnswers(subject.subjectId))
  const [saveState, setSaveState] = useState<Record<string, 'saving' | 'saved' | 'error'>>({})
  const answersRef = useRef(answers)
  const dirty = useRef(new Set<string>())
  const storageError = subjectiveStorageError(subject.subjectId)
  const [filter, setFilter] = useState('全部题型')
  const visible = useMemo(() => questions.filter((item) => filter === '全部题型' || item.type === filter), [questions, filter])

  useEffect(() => {
    if (!dirty.current.size) return
    const timer = window.setTimeout(() => persist(), 450)
    return () => window.clearTimeout(timer)
  }, [answers, subject.subjectId])

  const persist = (report = true) => {
    if (!dirty.current.size) return true
    const ids = [...dirty.current]
    const saved = saveSubjectiveAnswers(subject.subjectId, answersRef.current)
    if (saved) dirty.current.clear()
    if (report) setSaveState((current) => ({ ...current, ...Object.fromEntries(ids.map((id) => [id, saved ? 'saved' : 'error'])) }))
    return saved
  }

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') persist() }
    const onPageHide = () => { persist() }
    const onBeforeUnload = (event: BeforeUnloadEvent) => { if (!persist(false)) { event.preventDefault(); event.returnValue = '' } }
    const unregister = registerSubjectChangeGuard(() => persist())
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      persist(false)
      unregister()
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [subject.subjectId, registerSubjectChangeGuard])

  const updateAnswer = (id: string, field: SubjectiveAnswerField, value: string, annotations: SubjectiveFieldAnnotations) => {
    const existing = answersRef.current[id] ?? { originalAnswer: '', aiSuggestions: '', revisedAnswer: '' }
    const next = { ...answersRef.current, [id]: { ...existing, [field]: value, annotations: { ...existing.annotations, [field]: annotations } } }
    answersRef.current = next
    dirty.current.add(id)
    setSaveState((current) => ({ ...current, [id]: 'saving' }))
    setAnswers(next)
  }

  if (!questions.length) return <>
    <PageHeading english="SUBJECTIVE QUESTION TRAINING" title="主观题训练" description="保存和整理你的多版本作答。" />
    <section className="subject-empty-panel"><span className="subject-empty-icon"><NotebookPen size={28} /></span><h2>尚未添加主观题</h2><p>{subject.name}当前没有主观题。题目添加后，可在这里分别保存原始答案、修改建议和修订稿。</p></section>
  </>

  return <>
    <PageHeading english="SUBJECTIVE QUESTION TRAINING" title="主观题训练" description="题目与个人作答分开保存。三个文本区相互独立，输入后自动保存到当前浏览器。" />
    {storageError && <p className="annotation-warning" role="alert">{storageError}</p>}
    <section className="subjective-toolbar"><label className="chapter-filter"><span>题目类型</span><span className="chapter-select-wrap"><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>全部题型</option>{[...new Set(questions.map((item) => item.type))].map((type) => <option key={type}>{type}</option>)}</select><ChevronDown size={15} /></span></label><span>{visible.length} 道题</span></section>
    <div className="subjective-question-list">{visible.map((question) => {
      const draft = answers[question.id] ?? { originalAnswer: '', aiSuggestions: '', revisedAnswer: '' }
      const state = saveState[question.id]
      return <article className="subjective-question-card" key={question.id}>
        <header className="subjective-question-heading"><div><span className="subjective-question-number">{question.id}</span><span className="subjective-type-tag">{question.type}</span></div><span className={`subjective-save-status${state === 'error' ? ' error' : ''}`} role="status">{state === 'saving' ? '保存中…' : state === 'error' ? '保存失败，请检查浏览器存储' : state === 'saved' ? '已保存' : '尚未编辑'}</span></header>
        <div className="subjective-question-meta"><strong>{question.chapterTitle}</strong><span>知识点：{question.knowledgePointIds.join('、')}</span></div>
        <div className="subjective-question-content">
          {question.material && <section className="subjective-material"><h3>材料</h3><MarkdownContent content={question.material} /></section>}
          <div className="subjective-prompt"><MarkdownContent content={question.prompt} /></div>
        </div>
        <div className="subjective-answer-fields">
          <AnnotatedAnswerEditor label="A. 我的原始答案" value={draft.originalAnswer} annotations={draft.annotations?.originalAnswer} placeholder="记录第一次独立完成的答案…" onChange={(value, annotations) => updateAnswer(question.id, 'originalAnswer', value, annotations)} />
          <AnnotatedAnswerEditor label="B. AI 修改建议" value={draft.aiSuggestions} annotations={draft.annotations?.aiSuggestions} placeholder="粘贴其他 AI 工具提供的修改建议…" onChange={(value, annotations) => updateAnswer(question.id, 'aiSuggestions', value, annotations)} />
          <AnnotatedAnswerEditor label="C. 修改后的答案" value={draft.revisedAnswer} annotations={draft.annotations?.revisedAnswer} placeholder="记录根据修改建议完善后的答案…" onChange={(value, annotations) => updateAnswer(question.id, 'revisedAnswer', value, annotations)} />
        </div>
      </article>
    })}</div>
  </>
}
