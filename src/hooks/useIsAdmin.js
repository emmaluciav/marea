import { useAuth } from "@/lib/AuthContext";

// Modo administrador: se activa con el código secreto (puerta secreta frontend).
// La marca vive en sessionStorage: persiste al recargar, se borra al cerrar la
// pestaña o con "Salir del modo administrador".
export function useIsAdmin() {
  const { isAuthenticated, user } = useAuth();
  const unlocked =
    typeof window !== "undefined" && sessionStorage.getItem("marea_admin_session") === "1";
  return Boolean(unlocked || (isAuthenticated && user && user.role === "admin"));
}