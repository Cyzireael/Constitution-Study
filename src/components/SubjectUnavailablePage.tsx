import { BookOpen } from 'lucide-react'
import { PageHeading } from './PageHeading'
import { useSubject } from '../core/SubjectContext'

export function SubjectUnavailablePage() {
  const { subject } = useSubject()
  return <>
    <PageHeading english={subject.subjectId.toUpperCase()} title={subject.name} description={subject.description} />
    <section className="subject-empty-panel" aria-labelledby="subject-empty-title">
      <span className="subject-empty-icon"><BookOpen size={29} strokeWidth={1.4} /></span>
      <h2 id="subject-empty-title">尚未添加课程</h2>
      <p>{subject.name}暂未导入课程资料。当前页面不会显示其他学科的知识点或学习记录。</p>
    </section>
  </>
}
