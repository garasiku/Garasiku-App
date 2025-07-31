import StatusBar from "@/components/shared/status-bar";
import { ACTIVE, INACTIVE } from "@/lib/constants";
import { User } from "@/models/user"
import { Link } from "react-router-dom"

type UserCardProps = {
  user: User
}

export function UserCard({
  user
}: UserCardProps) {
  const initial = user.fullname.charAt(0).toUpperCase();
  const isActive = user.isActive ? ACTIVE : INACTIVE;

  return (
    <Link to={`/user/detail/${user.id}`} className="bg-background border rounded-lg shadow-xs p-4 hover:shadow-md overflow-hidden">
      {/* User Info */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-lg">{initial}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{user.fullname}</p>
            <p className="text-xs text-medium">{user.username}</p>
          </div>
        </div>
        <div className="flex items-center justify-center px-2">
          <StatusBar status={isActive} />
        </div>
      </div>
    </Link>
  )
}
