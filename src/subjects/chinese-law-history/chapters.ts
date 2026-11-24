import type { CourseChapterOption } from '../constitution/chapters'

const collectionId = 'CLH-NOTES'
const chapterDefinitions = [
  ['CLH-TOPIC-LEARNING', '课程主题｜法学院本科生的学习内容'],
  ['CLH-TOPIC-SIGNIFICANCE', '课程主题｜中国法律史的学习意义'],
  ['CLH-CH01', '第一章 中国古代法律概述'],
  ['CLH-CH02', '第二章 中国法制文明的起源'],
  ['CLH-CH03', '第三章 夏商周法律史'],
  ['CLH-CH04', '第四章 春秋战国时期的发展概况'],
  ['CLH-CH04-HAN', '第四章 秦汉时期的法律制度'],
  ['CLH-CH05', '第五章 魏晋南北朝法制史'],
  ['CLH-CH07', '第七章 唐朝的法律制度'],
  ['CLH-CH08', '第八章 帝制中后期的法律发展'],
  ['CLH-FINAL', '终章 中华法系的消解与中国法律的近代化'],
] as const

export const chineseLawHistoryChapterDefinitions = chapterDefinitions

export const chineseLawHistoryCollection = {
  lectureId: collectionId,
  lectureTitle: '中国法律史笔记（未按讲次划分）',
} as const

export const chineseLawHistoryChapters: readonly CourseChapterOption[] = chapterDefinitions.map(([chapterId, title]) => ({
  chapterId,
  lectureId: collectionId,
  lectureTitle: chineseLawHistoryCollection.lectureTitle,
  title,
}))

export const chineseLawHistoryChapterById = new Map(chineseLawHistoryChapters.map((chapter) => [chapter.chapterId, chapter]))

export function chineseLawHistorySectionId(chapterId: string, section: string) {
  return `${chapterId}::${section.trim().normalize('NFC')}`
}
