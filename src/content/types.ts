export type VerificationStatus = '待整理' | '待核对' | '已核对'
export type ExerciseType = 'single' | 'multiple'
export type ExerciseDifficulty = '基础' | '理解' | '易混辨析' | '应用' | '记忆' | '高频记忆'

export interface ExerciseQuestion {
  id: string
  chapterId: string
  chapterTitle: string
  type: ExerciseType
  difficulty: ExerciseDifficulty
  stem: string
  options: string[]
  answer: string[]
  explanation: string
  knowledgePointIds: string[]
}

export interface SubjectiveQuestion {
  id: string
  chapterId: string
  chapterTitle: string
  type: '简答题' | '论述题' | '材料分析题'
  knowledgePointIds: string[]
  prompt: string
  material?: string
}
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
  exercises: ExerciseQuestion[]
  subjectiveQuestions: SubjectiveQuestion[]
}

export type EditableKnowledgePoint = Pick<KnowledgePoint, 'lectureId' | 'lectureTitle' | 'title' | 'chapterId' | 'chapter' | 'section' | 'explanation' | 'contentSections' | 'source'>
export type KnowledgeContentOverrides = Record<string, EditableKnowledgePoint>
