export interface LectureResource {
  lectureId: string
  lectureTitle: string
  sourceFile: string
  publicUrl: string
  pdfUrl: string
  pageCount: number
}

export const constitutionLectures: readonly LectureResource[] = [
  { lectureId: 'L01', lectureTitle: '第一讲｜宪法学', sourceFile: 'source-materials/lecture-01.pptx.pptx', publicUrl: '/course-materials/lecture-01.pptx.pptx', pdfUrl: '/course-materials/pdf/lecture-01.pdf', pageCount: 61 },
  { lectureId: 'L02', lectureTitle: '第二讲｜宪法的分类和渊源', sourceFile: 'source-materials/lecture-02.pptx', publicUrl: '/course-materials/lecture-02.pptx', pdfUrl: '/course-materials/pdf/lecture-02.pdf', pageCount: 49 },
  { lectureId: 'L03', lectureTitle: '第三讲｜宪法制定与宪法修改', sourceFile: 'source-materials/lecture-03.pptx', publicUrl: '/course-materials/lecture-03.pptx', pdfUrl: '/course-materials/pdf/lecture-03.pdf', pageCount: 46 },
  { lectureId: 'L04', lectureTitle: '第四讲｜宪法解释', sourceFile: 'source-materials/lecture-04.pptx', publicUrl: '/course-materials/lecture-04.pptx', pdfUrl: '/course-materials/pdf/lecture-04.pdf', pageCount: 52 },
  { lectureId: 'L05', lectureTitle: '第五讲｜近代宪法的产生与发展、国家形式', sourceFile: 'source-materials/lecture-05.pptx', publicUrl: '/course-materials/lecture-05.pptx', pdfUrl: '/course-materials/pdf/lecture-05.pdf', pageCount: 91 },
  { lectureId: 'L06', lectureTitle: '第六讲｜宪法的指导思想和基本原则', sourceFile: 'source-materials/lecture-06.pptx', publicUrl: '/course-materials/lecture-06.pptx', pdfUrl: '/course-materials/pdf/lecture-06.pdf', pageCount: 48 },
  { lectureId: 'L07', lectureTitle: '第七讲｜基本权利和义务概述', sourceFile: 'source-materials/lecture-07.pptx', publicUrl: '/course-materials/lecture-07.pptx', pdfUrl: '/course-materials/pdf/lecture-07.pdf', pageCount: 114 },
]

export function lectureById(lectureId: string) {
  return constitutionLectures.find((lecture) => lecture.lectureId === lectureId)
}

export function lectureBySourceFile(sourceFile: string) {
  return constitutionLectures.find((lecture) => lecture.sourceFile === sourceFile)
}
