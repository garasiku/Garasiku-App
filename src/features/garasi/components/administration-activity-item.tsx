import SectionItem from "@/components/shared/section-item"
import StatusBar from "@/components/shared/status-bar"
import TaskTypeBar from "@/components/shared/task-type-bar"
import { Status } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { Administration } from "@/models/administration"
import { Link } from "react-router-dom"

interface AdministrationActivityItemProps {
    administrasi:Administration
}

export default function AdministrationActivityItem({
    administrasi
}: AdministrationActivityItemProps) {
    return (
        <Link to={`/administrasi/detail/${administrasi.id}`} className="flex flex-col gap-5 hover:bg-accent">
            <div className="flex items-start justify-between">
                <TaskTypeBar taskType={administrasi.type} />
                <StatusBar status={administrasi.status as Status} />
            </div>
            <div className="flex items-end justify-between">
                <SectionItem label="Jatuh Tempo" value={formatDate(administrasi.dueDate) ?? "-"} />
                <SectionItem label="Administrasi Selesai" value={formatDate(administrasi.endDate) ?? "-"} />
            </div>
        </Link>
    )
}
