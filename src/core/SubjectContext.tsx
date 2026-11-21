import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { subjects, subjectById, type SubjectConfig } from './subjects'
import { storageKeys } from './storage'

interface SubjectContextValue {
  subject: SubjectConfig
  subjects: SubjectConfig[]
  setSubject: (subjectId: string) => void
  registerSubjectChangeGuard: (guard: (nextSubjectId: string) => boolean) => () => void
}

const SubjectContext = createContext<SubjectContextValue | null>(null)

function readSelectedSubject() {
  try {
    const subjectId = window.localStorage.getItem(storageKeys.selectedSubject)
    return subjectById(subjectId ?? '') ?? subjects[0]
  } catch {
    return subjects[0]
  }
}

export function SubjectProvider({ children }: { children: ReactNode }) {
  const [subject, setSubjectState] = useState(readSelectedSubject)
  const guards = useRef(new Set<(nextSubjectId: string) => boolean>())
  const value = useMemo<SubjectContextValue>(() => ({
    subject,
    subjects,
    registerSubjectChangeGuard(guard) {
      guards.current.add(guard)
      return () => guards.current.delete(guard)
    },
    setSubject(subjectId) {
      const next = subjectById(subjectId)
      if (!next) return
      if (next.subjectId !== subject.subjectId && [...guards.current].some((guard) => !guard(next.subjectId))) return
      setSubjectState(next)
      try { window.localStorage.setItem(storageKeys.selectedSubject, next.subjectId) } catch { /* retain current session choice */ }
    },
  }), [subject])

  return <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>
}

export function useSubject() {
  const context = useContext(SubjectContext)
  if (!context) throw new Error('useSubject must be used within SubjectProvider')
  return context
}
