import { ArrowRight, BookOpen, Check, FileText, Library, NotebookPen, PenLine, Quote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeading } from '../components/PageHeading'
import { useSubject } from '../core/SubjectContext'
import { loadKnowledgeAdditions } from '../lib/knowledgeAdditions'

const studyEntries = [
  { path: '/knowledge', icon: Library, number: '01', title: '知识点库', english: 'KNOWLEDGE LIBRARY', description: '梳理课程脉络，回到每一个知识点的原始出处。', label: '浏览知识点' },
  { path: '/exercises', icon: PenLine, number: '02', title: '章节练习', english: 'CHAPTER EXERCISES', description: '按章节巩固所学，在练习中发现尚未掌握的部分。', label: '查看章节练习' },
  { path: '/subjective', icon: NotebookPen, number: '03', title: '主观题训练', english: 'SUBJECTIVE TRAINING', description: '从简答到论述，逐步练习清晰、完整的书面表达。', label: '了解主观题训练' },
] as const

export function DashboardPage() {
  const { subject } = useSubject()
  const course = subject.courseData!
  const knowledgeCount = course.knowledgePoints.length + loadKnowledgeAdditions(subject.subjectId).points.length
  return (
    <>
      <PageHeading english="YOUR PERSONAL STUDY DESK" title="学习，从这里开始。" description="整理知识，循序练习，让复习更有条理。" />
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <span className="welcome-tag"><span />{subject.name}个人学习空间</span>
          <h2 id="welcome-title">让每一次复习，<br />都有据可循。</h2>
          <p>以老师的 PPT 与课堂笔记为起点，<br className="desktop-break" />建立属于自己的知识脉络。</p>
          <Link className="button button-primary" to="/knowledge">前往知识点库<ArrowRight size={17} /></Link>
        </div>
        <div className="welcome-illustration" aria-hidden="true">
          <div className="illustration-circle" />
          <div className="book book-back" />
          <div className="book book-front"><span className="book-rule" /><span className="book-caption">个人学习平台</span><span className="book-title">{subject.name}</span><span className="book-subtitle">PERSONAL LAW STUDY</span><span className="book-seal"><BookOpen size={27} strokeWidth={1.2} /></span><span className="book-bottom">阅读 · 思考 · 研习</span></div>
        </div>
      </section>
      <section className="stats-grid" aria-label="课程内容概览">
        {[{ icon: BookOpen, label: '知识点', value: course.knowledgePoints.length, suffix: '个' }, { icon: PenLine, label: '章节练习', value: course.exercises.length, suffix: '题' }, { icon: NotebookPen, label: '主观题', value: course.subjectiveQuestions.length, suffix: '题' }].map(({ icon: Icon, label, value, suffix }) => (
          <article className="stat-card" key={label}><div><span className="stat-label">{label}</span><div className="stat-value">{value}<span>{suffix}</span></div></div><Icon size={23} strokeWidth={1.4} /></article>
        ))}
      </section>
      <section className="study-section" aria-labelledby="study-title">
        <div className="section-heading"><h2 id="study-title" className="section-title">开启你的复习路径</h2><span>从理解到表达，循序渐进</span></div>
        <div className="study-grid">{studyEntries.map(({ path, icon: Icon, number, title, english, description, label }) => (
          <Link to={path} className="study-card" key={path}><div className="study-card-top"><span className="entry-icon"><Icon size={22} strokeWidth={1.5} /></span><span className="entry-number">{number}</span></div><h3>{title}</h3><span className="entry-english">{english}</span><p>{description}</p><span className="entry-link">{label}<ArrowRight size={16} /></span></Link>
        ))}</div>
      </section>
      <section className="dashboard-bottom" aria-label="资料与学习说明">
          <article className="material-panel"><div className="section-heading"><h2 className="section-title">课程资料</h2><span className="muted-tag">{knowledgeCount ? (subject.subjectId === 'constitution' ? '课程已整理' : '笔记已整理') : '等待整理'}</span></div><div className="material-empty"><span className="document-icon"><FileText size={25} strokeWidth={1.3} /></span><div><h3>{knowledgeCount ? `${subject.name}知识点库` : '还没有课程资料'}</h3><p>{knowledgeCount ? `已整理 ${knowledgeCount} 条课程知识点。` : '提供老师的课程资料或个人笔记后，即可开始整理课程内容。'}<br />目前题库内容仍为空。</p></div></div></article>
        <article className="principle-panel"><Quote size={20} strokeWidth={1.5} /><h2>有来源，才有依据。</h2><p>忠于课程资料，保留原始出处；<br />对未覆盖的问题，明确标注。</p><span><Check size={14} />不生成未经资料支持的课程内容</span></article>
      </section>
    </>
  )
}
