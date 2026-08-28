import { useAuth } from "@/lib/AuthContext";

// Admin mode is active only for an authenticated user whose role is "admin".
// Public visitors are never authenticated, so they never see admin controls.
export function useIsAdmin() {
  const { isAuthenticated, user } = useAuth();
  return Boolean(isAuthenticated && user && user.role === "admin");
}