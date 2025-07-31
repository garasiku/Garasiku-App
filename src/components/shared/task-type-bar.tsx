import { TASK_TYPE_ICONS, TASK_TYPE_LABEL } from "@/lib/constants"

interface TaskTypeProps {
    taskType?: keyof typeof TASK_TYPE_LABEL
}

export default function TaskType({
    taskType = ""
}: TaskTypeProps) {
    const Icon = TASK_TYPE_ICONS[taskType]
    
    return (
        <div className="flex gap-2 items-center justify-center border rounded-lg px-3 py-2 ">
            {Icon && <Icon className="w-4 h-4" />}
            <span className="text-xs font-medium">{TASK_TYPE_LABEL[taskType]}</span>
        </div>
    )
}
