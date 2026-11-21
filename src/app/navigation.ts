import { BookOpen, ChartNoAxesCombined, CircleAlert, House, NotebookPen, PenLine } from 'lucide-react'

export const navigation = [
  { path: '/', label: '学习主页', english: 'Dashboard', icon: House },
  { path: '/knowledge', label: '知识点库', english: 'Knowledge Library', icon: BookOpen },
  { path: '/exercises', label: '章节练习', english: 'Chapter Exercises', icon: PenLine },
  { path: '/subjective', label: '主观题训练', english: 'Subjective Question Training', icon: NotebookPen },
  { path: '/wrong-questions', label: '错题本', english: 'Wrong Questions', icon: CircleAlert },
  { path: '/progress', label: '学习进度', english: 'Progress', icon: ChartNoAxesCombined },
] as const
