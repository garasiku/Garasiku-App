import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Separator } from "../shadcn/separator"
import { cn } from "@/lib/utils"
import { Button } from "../shadcn/button"

interface SectionCardProps {
  title: string
  headerAction?: React.ReactNode
  children?: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  collapsedHeight?: number
}

export function SectionCard({
  title = "Section",
  headerAction,
  children,
  collapsible = false,
  defaultCollapsed = true,
  collapsedHeight = 100,
}: SectionCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed && collapsible)
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)
  const contentRef = useRef<HTMLDivElement>(null)

  // Measure the full content height when component mounts or children change
  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight)
        }
      })

      observer.observe(contentRef.current)
      return () => observer.disconnect()
    }
  }, [children])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Only show toggle button if collapsible
  const showToggle = collapsible && contentHeight && contentHeight > collapsedHeight

  return (
    <div className="bg-background border rounded-lg p-5 shadow-xs flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">{title}</h2>
        {headerAction && <div>{headerAction}</div>}
      </div>

      <Separator />

      {children ? (
        <div className="flex flex-col">
          <div
            ref={contentRef}
            className={cn(
              "relative mb-2 transition-all duration-300 ease-in-out overflow-hidden",
              isCollapsed && showToggle && "mb-2",
            )}
            style={{
              maxHeight: isCollapsed && collapsible ? `${collapsedHeight}px` : `${contentHeight}px`,
            }}
          >
            {children}
          </div>

          {showToggle && (
            <Button
              variant="ghost"
              onClick={toggleCollapse}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="py-4 flex items-center justify-center text-center">
          <p className="text-sm text-medium">Belum ada data tersedia</p>
        </div>
      )}
    </div>
  )
}
