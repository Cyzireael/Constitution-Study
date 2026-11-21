import { PenLine } from 'lucide-react'
import { EmptyPage } from '../components/EmptyPage'

export function ExercisesPage() {
  return <EmptyPage english="CHAPTER EXERCISES" title="章节练习" description="围绕课程章节巩固理解，在练习中检查知识的掌握情况。" icon={PenLine} emptyTitle="章节练习，待知识库建立后开启" emptyDescription="目前尚无练习题。后续将依据核对后的课程资料整理题目，并关联对应的知识点。" stage="第三阶段" details={[
    { title: '按章节练习', description: '根据实际课程章节组织题目，逐步巩固知识。' },
    { title: '答案与解析', description: '依据资料提供答案解析，并追踪对应的知识点 ID。' },
    { title: '错题收集', description: '记录练习中答错的题目，为后续针对性复习做准备。' },
  ]} />
}
