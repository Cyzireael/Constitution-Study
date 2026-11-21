import { CircleAlert } from 'lucide-react'
import { EmptyPage } from '../components/EmptyPage'

export function WrongQuestionsPage() {
  return <EmptyPage english="WRONG QUESTIONS" title="错题本" description="留意每一次卡顿，把尚未掌握的知识重新学扎实。" icon={CircleAlert} emptyTitle="这里将收集你的错题" emptyDescription="目前尚未开放答题，也没有错题记录。完成章节练习功能后，错题会在这里汇集。" stage="第三阶段" details={[
    { title: '错题归集', description: '保留练习中的错题，方便回顾易错之处。' },
    { title: '回到关联知识', description: '通过知识点 ID 回看相应内容与来源。' },
    { title: '错题重练', description: '第五阶段将支持重新练习，巩固薄弱环节。' },
  ]} />
}
