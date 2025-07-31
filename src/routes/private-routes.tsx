import { useAuth } from "@/lib/auth-context";
import { ADMIN, DIVISI, DRIVER, OWNER, WSHEAD } from "@/lib/constants";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  "/dashboard": [OWNER, DIVISI, WSHEAD, DRIVER, ADMIN],
  "/garasi/daftar-kendaraan": [OWNER, DIVISI],
  "/garasi/cari-kendaraan": [OWNER, DIVISI, WSHEAD, DRIVER],
  "/kendaraan/detail": [OWNER, DIVISI, WSHEAD, DRIVER],
  "/servis": [OWNER, DIVISI, WSHEAD],
  "/administrasi": [OWNER, DIVISI],
  "/user": [ADMIN],
  "/parameter": [ADMIN],
};

function getPathPermission(pathname: string): string[] {
  const match = Object.keys(ROLE_PERMISSIONS).find((key) =>
    pathname.startsWith(key)
  );
  return ROLE_PERMISSIONS[match || ""] || [];
}

export default function PrivateRoute() {
  const { isAuthenticated, role, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const allowedRoles = getPathPermission(location.pathname);
  if (allowedRoles.length > 0 && !allowedRoles.includes(role || "")) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />
}
