import SectionItem from "@/components/shared/section-item"
import StatusBar from "@/components/shared/status-bar"
import TaskTypeBar from "@/components/shared/task-type-bar"
import { Status } from "@/lib/constants"
import { cn, formatDate } from "@/lib/utils"
import { Administration } from "@/models/administration"
import { cva } from "class-variance-authority"
import { Link } from "react-router-dom"

const statusVariants = cva(
  "border-l-8",
  {
    variants: {
      status: {
        default:
          "border-primary",
        pending:
          "border-status-pending",
        ongoing:
          "border-status-ongoing",
        completed:
          "border-status-completed",
        cancelled:
          "border-status-cancelled",
        active:
          "border-status-active",
        inactive:
          "border-status-inactive",
      }
    },
    defaultVariants: {
      status: "pending"
    },
  }
)

type AdministrationCardProps = {
  administration: Administration
}

export function AdministrationCard({
  administration
}: AdministrationCardProps) {
  const status = administration.status as Status;

  return (
    <Link to={`/administrasi/detail/${administration.id}`} className="bg-background border rounded-lg shadow-xs hover:shadow-md overflow-hidden">
      {/* Administration Info */}
      <div className={cn(statusVariants({ status }), "w-full p-5 flex flex-col gap-5")}>
        <div className="flex items-start justify-between gap-5">
          <div className="flex flex-col capitalize">
            <h3 className="text-lg font-medium">{administration.ticketNum}</h3>
            <p className="text-sm text-medium ">{administration.vehicle?.name}</p>
            <p className="text-xs text-light">{administration.vehicle?.category} - {administration.vehicle?.licensePlate}</p>
          </div>
          <div>
            <StatusBar status={status} />
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <TaskTypeBar taskType={administration.type} />
          </div>
          <div>
            <SectionItem label="Jatuh Tempo" value={formatDate(administration.dueDate)} className="items-end" />
          </div>
        </div>
      </div>
    </Link>
  )
}
