import { type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { KnowledgePage } from '../pages/KnowledgePage'
import { ExercisesPage } from '../pages/ExercisesPage'
import { SubjectivePage } from '../pages/SubjectivePage'
import { WrongQuestionsPage } from '../pages/WrongQuestionsPage'
import { ProgressPage } from '../pages/ProgressPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { useSubject } from '../core/SubjectContext'
import { SubjectUnavailablePage } from '../components/SubjectUnavailablePage'

function SubjectPage({ children }: { children: ReactNode }) {
  const { subject } = useSubject()
  return subject.enabled && subject.courseData ? <div key={subject.subjectId}>{children}</div> : <SubjectUnavailablePage />
}

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<SubjectPage><DashboardPage /></SubjectPage>} />
        <Route path="knowledge" element={<SubjectPage><KnowledgePage /></SubjectPage>} />
        <Route path="exercises" element={<SubjectPage><ExercisesPage /></SubjectPage>} />
        <Route path="subjective" element={<SubjectPage><SubjectivePage /></SubjectPage>} />
        <Route path="wrong-questions" element={<SubjectPage><WrongQuestionsPage /></SubjectPage>} />
        <Route path="progress" element={<SubjectPage><ProgressPage /></SubjectPage>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
