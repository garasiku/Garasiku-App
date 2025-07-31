import { Status, STATUS_LABEL } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

const statusVariants = cva(
    "rounded-full w-2.5 h-2.5",
    {
        variants: {
            status: {
                default:
                    "bg-primary",
                pending:
                    "bg-status-pending",
                ongoing:
                    "bg-status-ongoing",
                completed:
                    "bg-status-completed",
                cancelled:
                    "bg-status-cancelled",
                active:
                    "bg-status-active",
                inactive:
                    "bg-status-inactive",
            }
        },
        defaultVariants: {
            status: "pending"
        },
    }
)

interface StatusBarProps {
    status: Status
}

export default function StatusBar({
    status,
}: StatusBarProps) {
    return (
        <div className="flex gap-1.5 items-center justify-center">
            <div className={cn(statusVariants({ status }))} />
            <span className="text-xs font-medium">{STATUS_LABEL[status]}</span>
        </div>
    )
}
