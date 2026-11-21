export interface ConstitutionChapter {
  chapterId: string
  lectureId: string
  title: string
  knowledgePointIds: readonly string[]
}

export type CourseChapterOption = Pick<ConstitutionChapter, 'chapterId' | 'lectureId' | 'title'> & {
  custom?: boolean
  lectureTitle?: string
}

export const constitutionChapters: readonly ConstitutionChapter[] = [
  {
    chapterId: 'L01-TOPIC-WHAT',
    lectureId: 'L01',
    title: '一、宪法是什么？',
    knowledgePointIds: ['L01-INTRO-001', 'L01-INTRO-002'],
  },
  {
    chapterId: 'L01-TOPIC-USE',
    lectureId: 'L01',
    title: '二、宪法有什么用？',
    knowledgePointIds: ['L01-INTRO-003', 'L01-INTRO-004', 'L01-INTRO-005', 'L01-INTRO-006', 'L01-INTRO-007', 'L01-INTRO-008', 'L01-INTRO-009', 'L01-INTRO-011', 'L01-INTRO-012'],
  },
  {
    chapterId: 'L01-TOPIC-STUDY',
    lectureId: 'L01',
    title: '三、如何学习宪法学？',
    knowledgePointIds: ['L01-INTRO-010'],
  },
  {
    chapterId: 'L01-SECTION-CONCEPT',
    lectureId: 'L01',
    title: '第一节 宪法的概念和本质',
    knowledgePointIds: [
      'L01-CONCEPT-002', 'L01-CONCEPT-003', 'L01-CONCEPT-004', 'L01-CONCEPT-005', 'L01-CONCEPT-006', 'L01-CONCEPT-007', 'L01-CONCEPT-008',
      'L01-CONCEPT-009', 'L01-CONCEPT-010', 'L01-CONCEPT-011', 'L01-CONCEPT-012', 'L01-CONCEPT-013',
      'L01-STATUS-001', 'L01-STATUS-002', 'L01-STATUS-003', 'L01-STATUS-004', 'L01-STATUS-005', 'L01-STATUS-006', 'L01-STATUS-007',
      'L01-STATUS-008', 'L01-STATUS-009', 'L01-STATUS-010', 'L01-STATUS-011', 'L01-STATUS-012', 'L01-STATUS-013', 'L01-STATUS-014',
      'L01-ESSENCE-001', 'L01-ESSENCE-002', 'L01-ESSENCE-003',
    ],
  },
  {
    chapterId: 'L02-CLASSIFICATION',
    lectureId: 'L02',
    title: '一、宪法的分类',
    knowledgePointIds: ['L02-CLASS-001', 'L02-CLASS-002', 'L02-CLASS-003', 'L02-CLASS-004', 'L02-CLASS-005'],
  },
  {
    chapterId: 'L02-SOURCES',
    lectureId: 'L02',
    title: '二、宪法的渊源',
    knowledgePointIds: ['L02-SOURCE-001', 'L02-SOURCE-002', 'L02-SOURCE-003', 'L02-SOURCE-004', 'L02-SOURCE-005', 'L02-SOURCE-006', 'L02-SOURCE-007', 'L02-SOURCE-008'],
  },
  {
    chapterId: 'L02-CONSTITUTIONALISM',
    lectureId: 'L02',
    title: '宪法、宪政与民主',
    knowledgePointIds: ['L02-CONST-001', 'L02-CONST-002'],
  },
  {
    chapterId: 'L03-FOUNDATION',
    lectureId: 'L03',
    title: '一、宪法制定概述',
    knowledgePointIds: ['L03-FOUND-001', 'L03-FOUND-002', 'L03-FOUND-003', 'L03-FOUND-006'],
  },
  {
    chapterId: 'L03-DOMESTIC-CONSTITUTION',
    lectureId: 'L03',
    title: '二、我国宪法的制定',
    knowledgePointIds: ['L03-FOUND-004', 'L03-FOUND-005'],
  },
  {
    chapterId: 'L03-AMENDMENT',
    lectureId: 'L03',
    title: '三、宪法修改',
    knowledgePointIds: ['L03-AMEND-001', 'L03-AMEND-002', 'L03-AMEND-003'],
  },
  {
    chapterId: 'L04-INTERPRETATION-CONCEPT',
    lectureId: 'L04',
    title: '一、宪法解释的概念',
    knowledgePointIds: ['L04-INTERP-001', 'L04-INTERP-002', 'L04-INTERP-003', 'L04-INTERP-004'],
  },
  {
    chapterId: 'L04-INTERPRETATION-BODY',
    lectureId: 'L04',
    title: '二、宪法解释机关和宪法解释体制',
    knowledgePointIds: ['L04-INTERP-005'],
  },
  {
    chapterId: 'L04-INTERPRETATION-TYPES',
    lectureId: 'L04',
    title: '三、宪法解释的分类',
    knowledgePointIds: ['L04-INTERP-006', 'L04-INTERP-007', 'L04-INTERP-009'],
  },
  {
    chapterId: 'L04-INTERPRETATION-PRINCIPLES',
    lectureId: 'L04',
    title: '四、宪法解释的原则｜五、我国的宪法解释',
    knowledgePointIds: ['L04-INTERP-008'],
  },
  {
    chapterId: 'L04-CONSTITUTIONAL-APPLICATION',
    lectureId: 'L04',
    title: '六、宪法的适用｜七、宪法司法适用在我国的实践情况',
    knowledgePointIds: ['L04-APPLY-001'],
  },
  {
    chapterId: 'L05-ORIGIN',
    lectureId: 'L05',
    title: '一、近代宪法的产生条件｜二、近代宪法的产生过程',
    knowledgePointIds: ['L05-ORIGIN-001', 'L05-ORIGIN-002', 'L05-ORIGIN-003', 'L05-ORIGIN-004', 'L05-ORIGIN-005', 'L05-ORIGIN-006', 'L05-ORIGIN-007'],
  },
  {
    chapterId: 'L05-DEVELOPMENT',
    lectureId: 'L05',
    title: '三、宪法的发展',
    knowledgePointIds: ['L05-DEV-001', 'L05-DEV-002', 'L05-DEV-003', 'L05-DEV-004', 'L05-DEV-005'],
  },
  {
    chapterId: 'L05-GOVERNMENT-FORM',
    lectureId: 'L05',
    title: '第四章 国家形式｜第一节 政权组织形式',
    knowledgePointIds: ['L05-FORM-001', 'L05-FORM-002', 'L05-FORM-003'],
  },
  {
    chapterId: 'L05-STATE-STRUCTURE',
    lectureId: 'L05',
    title: '第四章 国家形式｜第二节 国家结构形式',
    knowledgePointIds: ['L05-FORM-004'],
  },
  {
    chapterId: 'L06-GUIDING-IDEAS',
    lectureId: 'L06',
    title: '第一节 宪法指导思想',
    knowledgePointIds: ['L06-PRINCIPLE-001'],
  },
  {
    chapterId: 'L06-PRINCIPLES',
    lectureId: 'L06',
    title: '第二节 宪法基本原则',
    knowledgePointIds: ['L06-PRINCIPLE-002', 'L06-PRINCIPLE-003', 'L06-PRINCIPLE-004', 'L06-PRINCIPLE-005', 'L06-PRINCIPLE-006', 'L06-PRINCIPLE-007'],
  },
  {
    chapterId: 'L07-RIGHTS',
    lectureId: 'L07',
    title: '一、宪法与基本权利',
    knowledgePointIds: ['L07-RIGHTS-001', 'L07-RIGHTS-002', 'L07-RIGHTS-003', 'L07-RIGHTS-004', 'L07-RIGHTS-005', 'L07-RIGHTS-006', 'L07-RIGHTS-007', 'L07-RIGHTS-008', 'L07-RIGHTS-009', 'L07-RIGHTS-010', 'L07-RIGHTS-011', 'L07-RIGHTS-012', 'L07-RIGHTS-013', 'L07-RIGHTS-014', 'L07-RIGHTS-015'],
  },
  {
    chapterId: 'L07-TYPES',
    lectureId: 'L07',
    title: '二、基本权利的类型',
    knowledgePointIds: ['L07-TYPES-001', 'L07-TYPES-002'],
  },
  {
    chapterId: 'L07-GUARANTEES-LIMITS',
    lectureId: 'L07',
    title: '三、基本权利的保障与界限',
    knowledgePointIds: ['L07-GUARANTEE-001', 'L07-GUARANTEE-002', 'L07-GUARANTEE-003', 'L07-LIMIT-001', 'L07-LIMIT-002', 'L07-LIMIT-003', 'L07-LIMIT-004'],
  },
]

export const constitutionChapterByKnowledgePointId = Object.fromEntries(
  constitutionChapters.flatMap((chapter) => chapter.knowledgePointIds.map((id) => [id, chapter] as const)),
)

export function customChapterId(lectureId: string, title: string) {
  return `custom:${lectureId}:${encodeURIComponent(title.trim())}`
}
