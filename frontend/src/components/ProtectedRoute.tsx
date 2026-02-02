import { ACCESS_TOKEN_KEY, getShareToken } from "@/services/api";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Login path for this app (e.g. /coffee/login or /boostcoffee/login) */
  loginPath: string;
}

/**
 * Renders children if access_token is present (JWT) or share token is present (share link).
 * Otherwise redirects to loginPath. Share-mode users can navigate all report routes.
 */
export function ProtectedRoute({ children, loginPath }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const shareToken = getShareToken();

  if (!token && !shareToken) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
