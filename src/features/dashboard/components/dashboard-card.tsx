import { Button } from "@/components/shadcn/button";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardCardProps {
  title: string;
  count: number;
  urlLink: string;
  icon?: LucideIcon;
  className?: string;
  background?: string;
  text?: string;
}

export function DashboardCard({
  title,
  count,
  urlLink,
  icon: Icon,
  className = "",
  background = "",
  text = "",
}: DashboardCardProps) {

  return (
    <div className={`rounded-xl p-6 shadow-xs hover:shadow-md ${className} ${background} ${text}`}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="mb-2">{title}</h2>
          <p className="text-5xl font-bold mb-4">{count}</p>
          {/* Replace next/link with shadcn/ui Button styled as a link */}
          <Button
            asChild
            variant="link"
            className={`has-[>svg]:p-0 ${text}`}
          >
            <Link to={`/${urlLink}`}>
              <span>Lihat Detail</span>
              <ChevronRight className="w-8 h-8" />
            </Link>
          </Button>
        </div>
        {Icon && <Icon className="w-8 h-8" />}
      </div>
    </div>
  );
}