import { NotebookPen } from 'lucide-react'
import { EmptyPage } from '../components/EmptyPage'

export function SubjectivePage() {
  return <EmptyPage english="SUBJECTIVE QUESTION TRAINING" title="主观题训练" description="从理解知识到组织表达，练习有依据、有层次的作答。" icon={NotebookPen} emptyTitle="主观题训练，等待课程题目" emptyDescription="目前尚无主观题或参考答案。资料准备就绪后，将逐步支持简答题、论述题和案例分析。" stage="第四阶段" details={[
    { title: '独立作答区域', description: '围绕关联知识点组织语言，完成自己的书面回答。' },
    { title: '参考答案与评分要点', description: '仅依据老师资料整理，不自行编造老师的标准答案。' },
    { title: '资料覆盖说明', description: '老师资料没有涉及的问题，将明确标注“资料未覆盖”。' },
  ]} />
}
