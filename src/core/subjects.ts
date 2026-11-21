import type { CourseContent } from '../content/types'
import { constitutionSubject } from '../subjects/constitution/config'

export interface SubjectConfig {
  subjectId: string
  name: string
  description: string
  enabled: boolean
  courseData: CourseContent | null
  courseDataPath: string | null
  exerciseTypes: string[]
}

const notAdded = (subjectId: string, name: string, description: string, exerciseTypes: string[] = []): SubjectConfig => ({
  subjectId,
  name,
  description,
  enabled: false,
  courseData: null,
  courseDataPath: null,
  exerciseTypes,
})

export const subjects: SubjectConfig[] = [
  constitutionSubject,
  notAdded('jurisprudence', '法理学', '待添加课程资料。'),
  notAdded('criminal-law', '刑法学', '待添加课程资料。', ['选择题', '判断题', '简答题', '案例分析']),
  notAdded('civil-law', '民法学', '待添加课程资料。'),
  notAdded('administrative-law', '行政法学', '待添加课程资料。'),
  notAdded('civil-procedure', '民事诉讼法', '待添加课程资料。'),
  notAdded('criminal-procedure', '刑事诉讼法', '待添加课程资料。'),
  notAdded('commercial-law', '商法', '待添加课程资料。'),
  notAdded('maritime-law', '海商法', '待添加课程资料。'),
  notAdded('international-law', '国际法', '待添加课程资料。'),
]

export const enabledSubjects = subjects.filter((subject) => subject.enabled)
export const subjectById = (subjectId: string) => subjects.find((subject) => subject.subjectId === subjectId)
