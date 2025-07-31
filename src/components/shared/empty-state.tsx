import { FileWarning } from "lucide-react"

type EmptyStateProps = {
  title?: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

export function EmptyState({
  title = "Tidak Ada Data",
  description = "Data belum tersedia atau tidak ditemukan.",
  icon = <FileWarning className="w-10 h-10 text-muted-foreground" />,
  children
}: EmptyStateProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center text-muted-foreground">
      {icon}
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm">{description}</p>
      </div>
      {children}
    </div>
  )
}
