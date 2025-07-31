import { MapPin } from "lucide-react"
import SectionItem from "./section-item"
import { formatDateTime } from "@/lib/utils"

interface LocationCardProps {
  name?: string
  address?: string
  createdAt?: string
  createdBy?: string
  disabled?: boolean;
}

export function LocationCard({
  name = "Name",
  address = "Address",
  createdAt = "Created At",
  createdBy = "Created By",
  disabled = false,
}: LocationCardProps) {
  return (
    <>
      <div
        className={`w-full flex flex-row gap-3 px-4 py-3 border rounded-lg shadow-xs
          ${disabled
            ? "bg-muted text-muted-foreground opacity-80"
            : "bg-background"
          }`}
      >
        <div className="pt-2">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="w-full flex flex-col gap-4">
          <div className="w-full">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-medium">{address}</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-5 text-xs text-gray-400">
            <SectionItem label="Diubah Pada" value={formatDateTime(createdAt)} />
            <SectionItem label="Diubah Oleh" value={createdBy} />
          </div>
        </div>
      </div>
    </>
  )
}
