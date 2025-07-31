interface SectionItemProps {
  label?: string
  value?: string | number
  className?: string
}

export default function SectionItem({ 
  label = "Label", 
  value = "-",
  className = ""
}: SectionItemProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <p className="text-medium text-xs mb-1">{label ?? "Label"}</p>
      <pre className="text-medium text-xs font-semibold whitespace-pre-wrap break-words">{value ?? "-"}</pre>
    </div>
  )
}