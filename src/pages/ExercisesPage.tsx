import { useMemo, useState } from 'react'
import { ChevronDown, PenLine } from 'lucide-react'
import { PageHeading } from '../components/PageHeading'
import { ExerciseRunner } from '../components/ExerciseRunner'
import { useSubject } from '../core/SubjectContext'
import type { ExerciseQuestion } from '../content/types'

const ALL_CHAPTERS = '全部章节'

export function ExercisesPage() {
  const { subject } = useSubject()
  const questions = (subject.courseData?.exercises ?? []) as ExerciseQuestion[]
  const chapters = useMemo(() => [...new Map(questions.map((question) => [question.chapterId, question.chapterTitle])).entries()], [questions])
  const [chapterId, setChapterId] = useState(ALL_CHAPTERS)
  const filtered = useMemo(() => questions.filter((question) => chapterId === ALL_CHAPTERS || question.chapterId === chapterId), [questions, chapterId])

  return <>
    <PageHeading english="CHAPTER EXERCISES" title="章节练习" description="按课程章节逐题练习；提交后查看答案与解析，答案在提交前不会显示。" />
    <section className="exercise-toolbar" aria-label="章节练习筛选">
      <label className="chapter-filter"><span>课程章节</span><span className="chapter-select-wrap"><select value={chapterId} onChange={(event) => setChapterId(event.target.value)} aria-label="选择练习章节"><option value={ALL_CHAPTERS}>{ALL_CHAPTERS}</option>{chapters.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></span></label>
      <span className="exercise-question-count">当前章节 <strong>{filtered.length}</strong> 题</span>
    </section>
    {filtered.length
      ? <ExerciseRunner key={chapterId} subjectId={subject.subjectId} questions={filtered} />
      : <div className="knowledge-empty"><PenLine size={23} /><h2>当前章节暂无练习题</h2><p>可切换章节查看其他练习。</p></div>}
  </>
}
