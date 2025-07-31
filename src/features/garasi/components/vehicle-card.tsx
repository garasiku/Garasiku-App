import { TASK_TYPE_ICONS } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";
import { formatDate } from "@/lib/utils";
import { Vehicle } from "@/models/vehicle"
import { ImageIcon } from "lucide-react";
import { Link } from "react-router-dom"

type VehicleCardProps = {
  vehicle: Vehicle
}

export function VehicleCard({
  vehicle
}: VehicleCardProps) {
  const variant = vehicle.isSold ? "sold" : "active";
  const Icon = vehicle.isSold ? TASK_TYPE_ICONS["terjual"] : TASK_TYPE_ICONS["lokasi"];

  const imageUrl = vehicle.image?.startsWith("http")
    ? vehicle.image
    : supabase.storage.from("vehicle").getPublicUrl(vehicle.image || "").data.publicUrl ?? "/placeholder.svg";

  return (
    <Link to={`/kendaraan/detail/${vehicle.id}`} className="bg-background border rounded-lg shadow-xs hover:shadow-md overflow-hidden">
      {/* Image Placeholder */}
      <div className="relative aspect-video w-full overflow-hidden text-muted-foreground bg-muted flex items-center justify-center">
        {vehicle.image ? (
          <img
            src={imageUrl}
            alt={`${vehicle.name} - Image`}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center border bg-background px-5 py-1 rounded-xl shadow-md">
          <p className="text-medium text-sm">{vehicle.category}</p>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="w-full p-5 flex flex-col gap-3">
        <div className="flex flex-col">
          <p className="font-medium">{vehicle.name}</p>
          <p className="text-xs text-light">{vehicle.licensePlate}</p>
        </div>

        {/* Location or Sold Status */}
        <div className="border rounded-lg p-3 flex items-start gap-2">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 text-medium shrink-0" />}
            {variant === "active" && (
              <div>
                <p className="text-sm font-medium">{vehicle.location?.name}</p>
                <p className="text-xs text-medium">{vehicle.location?.address}</p>
              </div>
            )}
            {variant === "sold" && vehicle.soldDate && (
              <div>
                <p className="text-sm font-medium">Terjual</p>
                <p className="text-xs text-medium">{formatDate(vehicle.soldDate)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
