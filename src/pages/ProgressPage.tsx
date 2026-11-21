import { ChartNoAxesCombined } from 'lucide-react'
import { EmptyPage } from '../components/EmptyPage'

export function ProgressPage() {
  return <EmptyPage english="LEARNING PROGRESS" title="学习进度" description="看见一点一滴的积累，找到适合自己的复习节奏。" icon={ChartNoAxesCombined} emptyTitle="你的学习旅程，尚未开始记录" emptyDescription="学习记录功能将在后续阶段开放。当前没有学习统计，待课程资料与练习功能就绪后再开始积累。" stage="第五阶段" details={[
    { title: '学习进度', description: '根据实际学习与答题记录呈现复习进展。' },
    { title: '个人收藏', description: '收藏需要反复阅读的内容，方便再次回顾。' },
    { title: '本地记录与备份', description: '使用 LocalStorage 保存学习记录，并提供数据备份功能。' },
  ]} />
}
