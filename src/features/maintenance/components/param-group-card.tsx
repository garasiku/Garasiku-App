import { ParamGroup } from "@/models/param-group"
import { Settings } from "lucide-react"
import { Link } from "react-router-dom"

type ParamGroupCardProps = {
  paramGroup: ParamGroup
}

export function ParamGroupCard({
  paramGroup
}: ParamGroupCardProps) {
  return (
    <Link to={`/parameter/detail/${paramGroup.group}`} className="bg-background border rounded-lg shadow-xs p-4 hover:shadow-md overflow-hidden">
      {/* Param Group Info */}
      <div className="flex items-center gap-4">
        <div className="bg-[#f5f5f5] p-2 rounded-full">
          <Settings />
        </div>
        <div>
          <p className="text-sm font-medium">{paramGroup.name}</p>
          <p className="text-xs text-medium">{paramGroup.description}</p>
        </div>
      </div>
    </Link>
  )
}
