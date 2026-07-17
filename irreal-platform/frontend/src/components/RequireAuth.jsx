import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RequireAuth({ children }) {
  const { session, appUser, loading } = useAuth();

  if (loading || session === undefined) {
    return <p className="p-8 text-center text-gray-500">Verificando sesión...</p>;
  }

  if (!session) return <Navigate to="/admin/login" replace />;

  if (!appUser) {
    return (
      <p className="p-8 text-center text-gray-500">
        Tu cuenta no tiene un perfil de staff asociado a ningún restaurante. Pide a un
        administrador que te agregue en la tabla <code>app_users</code>.
      </p>
    );
  }

  return children;
}
