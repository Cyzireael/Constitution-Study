export type VerificationStatus = '待整理' | '待核对' | '已核对'
export type KnowledgeContentType = 'text' | 'list' | 'quote' | 'comparison' | 'case' | 'theory' | 'provision' | 'diagram'

export interface KnowledgeContentSection {
  heading: string
  body?: string
  items?: string[]
  contentType?: KnowledgeContentType
}

export interface KnowledgePoint {
  id: string
  subjectId?: string
  lectureId: string
  lectureTitle: string
  title: string
  chapterId?: string
  chapter: string
  section: string
  explanation: string
  contentSections?: KnowledgeContentSection[] | null
  source: {
    file: string
    pages: number[]
    location?: string
  }
  verificationStatus: VerificationStatus
}

export interface CourseContent {
  knowledgePoints: KnowledgePoint[]
  exercises: unknown[]
  subjectiveQuestions: unknown[]
}

export type EditableKnowledgePoint = Pick<KnowledgePoint, 'lectureId' | 'lectureTitle' | 'title' | 'chapterId' | 'chapter' | 'section' | 'explanation' | 'contentSections' | 'source'>
export type KnowledgeContentOverrides = Record<string, EditableKnowledgePoint>
