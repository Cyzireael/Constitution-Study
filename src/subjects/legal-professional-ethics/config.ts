import courseData from './course.json'
import type { CourseContent } from '../../content/types'
import type { SubjectConfig } from '../../core/subjects'

export const legalProfessionalEthicsSubject: SubjectConfig = {
  subjectId: 'legal-professional-ethics',
  name: '法律职业伦理',
  description: '个人学习空间，课程资料尚未添加。',
  enabled: true,
  courseData: courseData as CourseContent,
  courseDataPath: 'src/subjects/legal-professional-ethics/course.json',
  exerciseTypes: [],
}
