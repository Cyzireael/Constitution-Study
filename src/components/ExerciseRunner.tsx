import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookmarkCheck, BookmarkPlus, RotateCcw } from 'lucide-react'
import type { ExerciseQuestion } from '../content/types'
import { isExerciseAnswerCorrect, loadExerciseProgress, loadWrongQuestionIds, recordExerciseAttempt, setWrongQuestion } from '../lib/exerciseRecords'

interface Props {
  subjectId: string
  questions: readonly ExerciseQuestion[]
  wrongBookMode?: boolean
  onWrongBookChange?: () => void
}

export function ExerciseRunner({ subjectId, questions, wrongBookMode = false, onWrongBookChange }: Props) {
  const [index, setIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const [incorrect, setIncorrect] = useState<Record<string, boolean>>({})
  const [wrongIds, setWrongIds] = useState(() => loadWrongQuestionIds(subjectId))
  const [progress, setProgress] = useState(() => loadExerciseProgress(subjectId))
  const [storageError, setStorageError] = useState('')

  const question = questions[index]
  const wrongSet = useMemo(() => new Set(wrongIds), [wrongIds])

  if (!question) return <div className="knowledge-empty"><h2>{wrongBookMode ? '錯題本是空的' : '本章暫無練習題'}</h2><p>{wrongBookMode ? '作答后可将题目加入错题本。' : '该章节当前没有题目。'}</p></div>

  const selected = selections[question.id] ?? []
  const didSubmit = Boolean(submitted[question.id])
  const isCorrect = didSubmit && !incorrect[question.id]
  const questionProgress = progress.attempts[question.id]
  const totalAttempts = Object.values(progress.attempts).reduce((sum, item) => sum + item.attempts, 0)
  const totalCorrect = Object.values(progress.attempts).reduce((sum, item) => sum + item.correct, 0)

  const toggleOption = (option: string) => {
    if (didSubmit) return
    setSelections((current) => {
      const values = current[question.id] ?? []
      const next = question.type === 'single'
        ? [option]
        : values.includes(option) ? values.filter((value) => value !== option) : [...values, option]
      return { ...current, [question.id]: next }
    })
  }

  const submit = () => {
    if (didSubmit || selected.length === 0) return
    const correct = isExerciseAnswerCorrect(question, selected)
    setSubmitted((current) => ({ ...current, [question.id]: true }))
    setIncorrect((current) => ({ ...current, [question.id]: !correct }))
    const saved = recordExerciseAttempt(subjectId, question.id, correct)
    setProgress(loadExerciseProgress(subjectId))
    setStorageError(saved ? '' : '答题结果未能保存，请检查浏览器存储权限。')
  }

  const toggleWrong = (included: boolean) => {
    const saved = setWrongQuestion(subjectId, question.id, included)
    const nextIds = loadWrongQuestionIds(subjectId)
    if (saved) {
      setWrongIds(nextIds)
      setStorageError('')
      if (wrongBookMode && !included) onWrongBookChange?.()
    } else setStorageError('错题本记录未能保存，请检查浏览器存储权限。')
  }

  const redo = () => {
    setSubmitted((current) => ({ ...current, [question.id]: false }))
    setIncorrect((current) => ({ ...current, [question.id]: false }))
    setSelections((current) => ({ ...current, [question.id]: [] }))
  }

  return <section className="exercise-workspace" aria-label="章节练习答题区">
    <div className="exercise-session-meta"><span>{question.chapterTitle}</span><span>{index + 1} / {questions.length} 题</span><span>历史正确率 {totalAttempts ? `${Math.round(totalCorrect / totalAttempts * 100)}%` : '—'}</span></div>
    <article className="exercise-question-card">
      <div className="exercise-question-tags"><span>{question.type === 'single' ? '单项选择' : '多项选择'}</span><span>{question.difficulty}</span><span>{question.knowledgePointIds.join(' · ')}</span></div>
      <h2>{question.stem}</h2>
      <fieldset className="exercise-options" disabled={didSubmit}>
        <legend className="visually-hidden">选择答案</legend>
        {question.options.map((option, optionIndex) => {
          const optionId = `${question.id}-${optionIndex}`
          const key = option.trim().match(/^([A-Z])\./)?.[1] ?? String(optionIndex)
          const chosen = selected.includes(key)
          const answer = question.answer.includes(key)
          const stateClass = didSubmit ? answer ? ' is-correct' : chosen ? ' is-wrong' : '' : ''
          return <label className={`exercise-option${chosen ? ' is-selected' : ''}${stateClass}`} key={optionId} htmlFor={optionId}>
            <input id={optionId} type={question.type === 'single' ? 'radio' : 'checkbox'} name={`answer-${question.id}`} checked={chosen} onChange={() => toggleOption(key)} />
            <span>{option}</span>
          </label>
        })}
      </fieldset>
      {!didSubmit
        ? <button type="button" className="button button-primary exercise-submit" disabled={!selected.length} onClick={submit}>提交答案</button>
        : <div className={`exercise-feedback${isCorrect ? ' correct' : ' incorrect'}`} role="status">
          <strong>{isCorrect ? '回答正确' : '回答错误'}</strong>
          <p>正确答案：{question.answer.join('、')}</p>
          <p>{question.explanation}</p>
          <div className="exercise-feedback-actions">
            <button type="button" className="button button-secondary" onClick={() => toggleWrong(!wrongSet.has(question.id))}>{wrongSet.has(question.id) ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}{wrongSet.has(question.id) ? '已在错题本，点击移除' : '加入错题本'}</button>
            <button type="button" className="button button-secondary" onClick={redo}><RotateCcw size={15} />重新作答</button>
          </div>
        </div>}
      {questionProgress && <p className="exercise-attempt-note">本题已作答 {questionProgress.attempts} 次，答对 {questionProgress.correct} 次。</p>}
    </article>
    {storageError && <p className="module-error" role="alert">{storageError}</p>}
    <nav className="exercise-step-nav" aria-label="题目导航">
      <button type="button" className="button button-secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}><ArrowLeft size={15} />上一题</button>
      <span aria-live="polite">第 {index + 1} 题</span>
      <button type="button" className="button button-secondary" disabled={index >= questions.length - 1} onClick={() => setIndex((value) => value + 1)}>下一题<ArrowRight size={15} /></button>
    </nav>
  </section>
}
