import courseData from './course.json'
import type { CourseContent } from '../../content/types'
import type { SubjectConfig } from '../../core/subjects'
import { chineseLawHistoryChapters, chineseLawHistoryCollection } from './chapters'

export const chineseLawHistorySubject: SubjectConfig = {
  subjectId: 'chinese-law-history',
  name: '中国法律史',
  description: '依据个人课程笔记整理的中国法律史知识库。',
  enabled: true,
  courseData: courseData as CourseContent,
  courseDataPath: 'src/subjects/chinese-law-history/course.json + 学科隔离的本地新增知识点记录',
  exerciseTypes: [],
}

export { chineseLawHistoryChapters, chineseLawHistoryCollection }
