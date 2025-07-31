import SectionItem from "@/components/shared/section-item"
import StatusBar from "@/components/shared/status-bar"
import TaskTypeBar from "@/components/shared/task-type-bar"
import { Status } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { Service } from "@/models/service"
import { Link } from "react-router-dom"

interface ServiceActivityItemProps {
    service: Service
}

export default function ServiceActivityItem({
    service
}: ServiceActivityItemProps) {
    return (
        <Link to={`/servis/detail/${service.id}`} className="flex flex-col gap-5 hover:bg-accent">
            <div className="flex items-start justify-between">
                <TaskTypeBar taskType={service.type} />
                <StatusBar status={service.status as Status} />
            </div>
            <div className="flex items-end justify-between">
                <SectionItem label="Jadwal Servis" value={formatDate(service.scheduleDate) ?? "-"} />
                <SectionItem label="Servis Mulai" value={formatDate(service.startDate) ?? "-"} />
                <SectionItem label="Servis Selesai" value={formatDate(service.endDate) ?? "-"} />
            </div>
        </Link>
    )
}
