import courseData from './course.json'
import additionalLectureData from './lectures-02-07.json'
import additionalLectureDetails from './lectures-02-06-additional.json'
import exerciseBank from './exercises.json'
import subjectiveQuestionBank from './subjective-questions.json'
import type { CourseContent } from '../../content/types'
import type { SubjectConfig } from '../../core/subjects'
import { constitutionLectures } from './lectures'
import { constitutionChapterByKnowledgePointId } from './chapters'

const originalCourse = courseData as unknown as CourseContent
const additionalCourse = additionalLectureData as unknown as CourseContent
const additionalLectureDetailCourse = additionalLectureDetails as unknown as CourseContent
const exerciseData = exerciseBank as CourseContent['exercises']
const subjectiveQuestionData = subjectiveQuestionBank as CourseContent['subjectiveQuestions']
const firstLecture = constitutionLectures[0]
const sourceKnowledgePoints = [
  ...originalCourse.knowledgePoints.map((point) => ({
    ...point,
    lectureId: firstLecture.lectureId,
    lectureTitle: firstLecture.lectureTitle,
  })),
  ...additionalCourse.knowledgePoints,
  ...additionalLectureDetailCourse.knowledgePoints,
]

export const constitutionLegacyChapterByKnowledgePointId = Object.fromEntries(
  sourceKnowledgePoints.map((point) => [point.id, point.chapter]),
)

const combinedCourse: CourseContent = {
  ...originalCourse,
  exercises: exerciseData,
  subjectiveQuestions: subjectiveQuestionData,
  knowledgePoints: sourceKnowledgePoints.map((point) => {
    const chapter = constitutionChapterByKnowledgePointId[point.id]
    return chapter
      ? { ...point, chapter: chapter.title, chapterId: chapter.chapterId }
      : { ...point, chapter: '未归类（待核对）', chapterId: `unclassified:${point.lectureId}` }
  }),
}

export const constitutionSubject: SubjectConfig = {
  subjectId: 'constitution',
  name: '宪法学',
  description: '依据课程 PPT 与课堂笔记整理的宪法学课程。',
  enabled: true,
  courseData: combinedCourse,
  courseDataPath: 'src/subjects/constitution/course.json + lectures-02-07.json',
  exerciseTypes: ['单项选择题', '多项选择题', '简答题', '论述题', '材料分析题'],
}
