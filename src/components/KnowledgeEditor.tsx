import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from 'lucide-react'
import { MarkdownContent } from './MarkdownContent'
import { contentTypeLabels } from '../lib/knowledgeLibrary'
import type { KnowledgeContentType } from '../content/types'
import type { LectureResource } from '../subjects/constitution/lectures'
import { customChapterId, type CourseChapterOption } from '../subjects/constitution/chapters'

export interface KnowledgeEditorBlock {
  heading: string
  body: string
  contentType: KnowledgeContentType
}

export interface KnowledgeEditorDraft {
  lectureId: string
  lectureTitle: string
  title: string
  chapterId?: string
  chapter: string
  section: string
  explanation: string
  sourceFile: string
  sourcePages: string
  contentMode: 'simple' | 'structured'
  blocks: KnowledgeEditorBlock[]
}

interface KnowledgeEditorProps {
  draft: KnowledgeEditorDraft
  chapters: readonly CourseChapterOption[]
  lectures: readonly LectureResource[]
  error: string
  saving: boolean
  onChange: (draft: KnowledgeEditorDraft) => void
  onSave: () => void
  onCancel: () => void
}

const contentTypes = Object.entries(contentTypeLabels) as [KnowledgeContentType, string][]

export function KnowledgeEditor({ draft, chapters, lectures, error, saving, onChange, onSave, onCancel }: KnowledgeEditorProps) {
  const update = (patch: Partial<KnowledgeEditorDraft>) => onChange({ ...draft, ...patch })
  const updateBlock = (index: number, patch: Partial<KnowledgeEditorBlock>) => {
    update({ blocks: draft.blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...patch } : block) })
  }
  const moveBlock = (index: number, offset: -1 | 1) => {
    const target = index + offset
    if (target < 0 || target >= draft.blocks.length) return
    const blocks = [...draft.blocks]
    ;[blocks[index], blocks[target]] = [blocks[target], blocks[index]]
    update({ blocks })
  }
  const changeMode = (contentMode: KnowledgeEditorDraft['contentMode']) => {
    if (contentMode === 'structured' && draft.blocks.length === 0) {
      update({ contentMode, blocks: [{ heading: '课件主要内容', body: draft.explanation, contentType: 'text' }] })
    } else if (contentMode === 'simple' && draft.blocks.length) {
      update({ contentMode, explanation: draft.blocks.map((block) => `## ${block.heading}\n\n${block.body}`).join('\n\n') })
    } else {
      update({ contentMode })
    }
  }

  return (
    <form className="knowledge-editor" onSubmit={(event) => { event.preventDefault(); onSave() }}>
      <div className="knowledge-editor-heading"><div><span className="eyebrow">EDIT KNOWLEDGE POINT</span><h3>编辑知识点</h3></div><span className="knowledge-editor-id">ID 保持不变</span></div>

      <fieldset className="editor-fieldset">
        <legend>基本信息</legend>
        <label className="editor-field"><span>所属讲次</span><select required value={draft.lectureId} onChange={(event) => {
          const lecture = lectures.find((item) => item.lectureId === event.target.value)
          if (lecture) {
            const matchingChapter = chapters.find((chapter) => chapter.lectureId === lecture.lectureId && chapter.title === draft.chapter)
            update({
              lectureId: lecture.lectureId,
              lectureTitle: lecture.lectureTitle,
              chapterId: matchingChapter?.chapterId ?? customChapterId(lecture.lectureId, draft.chapter),
            })
          }
        }}>{lectures.map((lecture) => <option key={lecture.lectureId} value={lecture.lectureId}>{lecture.lectureTitle}</option>)}</select></label>
        <label className="editor-field editor-field-wide"><span>知识点标题</span><input required maxLength={160} value={draft.title} onChange={(event) => update({ title: event.target.value })} /></label>
        <div className="editor-field-grid">
          <label className="editor-field"><span>所属章节</span><input required list="knowledge-chapters" value={draft.chapter} onChange={(event) => {
            const title = event.target.value
            const matchingChapter = chapters.find((chapter) => chapter.lectureId === draft.lectureId && chapter.title === title)
            update({ chapter: title, chapterId: matchingChapter?.chapterId ?? customChapterId(draft.lectureId, title) })
          }} /><datalist id="knowledge-chapters">{chapters.filter((chapter) => chapter.lectureId === draft.lectureId).map((chapter) => <option key={chapter.chapterId} value={chapter.title} />)}</datalist></label>
          <label className="editor-field"><span>章节小节</span><input required value={draft.section} onChange={(event) => update({ section: event.target.value })} /></label>
        </div>
      </fieldset>

      <fieldset className="editor-fieldset">
        <legend>讲解内容</legend>
        <div className="mode-switch" role="group" aria-label="讲解内容形式">
          <button type="button" className={draft.contentMode === 'simple' ? 'selected' : ''} aria-pressed={draft.contentMode === 'simple'} onClick={() => changeMode('simple')}>简单文本</button>
          <button type="button" className={draft.contentMode === 'structured' ? 'selected' : ''} aria-pressed={draft.contentMode === 'structured'} onClick={() => changeMode('structured')}>结构化区块</button>
        </div>
        <label className="editor-field"><span>{draft.contentMode === 'simple' ? '讲解正文' : '讲解摘要 / 简单模式正文'}</span><textarea rows={5} value={draft.explanation} onChange={(event) => update({ explanation: event.target.value })} /></label>
        <div className="markdown-preview"><div className="markdown-preview-label">Markdown 预览</div><MarkdownContent content={draft.explanation || '预览区域'} /></div>

        {draft.contentMode === 'structured' && <div className="editor-blocks">
          {draft.blocks.map((block, index) => (
            <section className="editor-block" key={`block-${index}`}>
              <div className="editor-block-heading"><strong>内容区块 {index + 1}</strong><div className="editor-block-actions">
                <button type="button" className="icon-button" title="上移区块" aria-label={`上移内容区块 ${index + 1}`} disabled={index === 0} onClick={() => moveBlock(index, -1)}><ArrowUp size={15} /></button>
                <button type="button" className="icon-button" title="下移区块" aria-label={`下移内容区块 ${index + 1}`} disabled={index === draft.blocks.length - 1} onClick={() => moveBlock(index, 1)}><ArrowDown size={15} /></button>
                <button type="button" className="icon-button danger-button" title="删除区块" aria-label={`删除内容区块 ${index + 1}`} onClick={() => update({ blocks: draft.blocks.filter((_, blockIndex) => blockIndex !== index) })}><Trash2 size={15} /></button>
              </div></div>
              <label className="editor-field"><span>区块标题</span><input value={block.heading} onChange={(event) => updateBlock(index, { heading: event.target.value })} /></label>
              <label className="editor-field"><span>内容类型</span><select value={block.contentType} onChange={(event) => updateBlock(index, { contentType: event.target.value as KnowledgeContentType })}>{contentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="editor-field"><span>区块正文</span><textarea rows={5} value={block.body} onChange={(event) => updateBlock(index, { body: event.target.value })} /></label>
              <div className="markdown-preview"><div className="markdown-preview-label">区块预览</div><MarkdownContent content={block.body || '预览区域'} /></div>
            </section>
          ))}
          <button type="button" className="button button-secondary add-block-button" onClick={() => update({ blocks: [...draft.blocks, { heading: '', body: '', contentType: 'text' }] })}><Plus size={15} />新增内容区块</button>
        </div>}
      </fieldset>

      <fieldset className="editor-fieldset">
        <legend>资料来源</legend>
        <label className="editor-field"><span>来源文件</span><input required value={draft.sourceFile} onChange={(event) => update({ sourceFile: event.target.value })} /></label>
        <label className="editor-field"><span>PPT 页码</span><input required inputMode="numeric" placeholder="例如：3, 4, 5" value={draft.sourcePages} onChange={(event) => update({ sourcePages: event.target.value })} /><small>多个页码以逗号或顿号分隔。</small></label>
      </fieldset>

      {error && <p className="editor-error" role="alert">{error}</p>}
      <div className="knowledge-editor-footer"><button type="button" className="button button-secondary" onClick={onCancel}><X size={15} />取消</button><button type="submit" className="button button-primary" disabled={saving}><Save size={15} />保存修改</button></div>
    </form>
  )
}
