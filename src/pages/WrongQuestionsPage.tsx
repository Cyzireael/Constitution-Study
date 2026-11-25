import { useMemo, useState } from 'react'
import { CircleAlert, Trash2 } from 'lucide-react'
import { PageHeading } from '../components/PageHeading'
import { ExerciseRunner } from '../components/ExerciseRunner'
import { useSubject } from '../core/SubjectContext'
import { loadWrongQuestionIds, setWrongQuestion } from '../lib/exerciseRecords'
import type { ExerciseQuestion } from '../content/types'

export function WrongQuestionsPage() {
  const { subject } = useSubject()
  const bank = (subject.courseData?.exercises ?? []) as ExerciseQuestion[]
  const [wrongIds, setWrongIds] = useState(() => loadWrongQuestionIds(subject.subjectId))
  const questions = useMemo(() => wrongIds.flatMap((id) => { const question = bank.find((item) => item.id === id); return question ? [question] : [] }), [bank, wrongIds])
  const [error, setError] = useState('')
  const remove = (id: string) => {
    const saved = setWrongQuestion(subject.subjectId, id, false)
    setError(saved ? '' : '错题本记录未能保存。')
    if (saved) setWrongIds(loadWrongQuestionIds(subject.subjectId))
  }
  return <>
    <PageHeading english="WRONG QUESTIONS" title="错题本" description="按稳定题目 ID 汇集需要复习的题目，可从题库中重新作答。" />
    <section className="wrong-book-toolbar"><div><CircleAlert size={18} /><span>{questions.length} 道错题</span></div><p>答题记录与错题清单保存在当前学科的浏览器本地数据中。</p></section>
    {error && <p className="module-error" role="alert">{error}</p>}
    {questions.length ? <ExerciseRunner key={wrongIds.join('|')} subjectId={subject.subjectId} questions={questions} wrongBookMode onWrongBookChange={() => setWrongIds(loadWrongQuestionIds(subject.subjectId))} /> : <div className="knowledge-empty"><CircleAlert size={23} /><h2>错题本是空的</h2><p>在章节练习提交答案后，可以主动将题目加入错题本。</p></div>}
    {questions.length > 0 && <div className="wrong-book-list">{questions.map((question) => <button type="button" key={question.id} className="button button-secondary" onClick={() => remove(question.id)}><Trash2 size={15} />移除「{question.id}」</button>)}</div>}
  </>
}
