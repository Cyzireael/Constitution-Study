import { ArrowLeft, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeading } from './PageHeading'

interface EmptyPageProps {
  english: string
  title: string
  description: string
  icon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  stage: string
  details: readonly { title: string; description: string }[]
}

export function EmptyPage({ english, title, description, icon: Icon, emptyTitle, emptyDescription, stage, details }: EmptyPageProps) {
  return (
    <>
      <PageHeading english={english} title={title} description={description} />
      <section className="empty-panel" aria-labelledby="empty-title">
        <span className="stage-tag">{stage} · 待开放</span>
        <div className="empty-icon"><Icon size={32} strokeWidth={1.3} /></div>
        <h2 id="empty-title">{emptyTitle}</h2>
        <p>{emptyDescription}</p>
        <Link to="/" className="button button-secondary"><ArrowLeft size={16} />返回学习主页</Link>
      </section>
      <section className="planned-section" aria-labelledby="planned-title">
        <h2 id="planned-title" className="section-title">后续将支持</h2>
        <div className="detail-grid">{details.map((detail, index) => (
          <article className="detail-card" key={detail.title}><span className="detail-number">0{index + 1}</span><h3>{detail.title}</h3><p>{detail.description}</p></article>
        ))}</div>
      </section>
      <div className="source-note"><BookOpen size={17} /><p>所有知识点、参考答案与评分要点均以你提供的老师 PPT 和课堂笔记为依据。资料未覆盖的内容会明确标注。</p></div>
    </>
  )
}
