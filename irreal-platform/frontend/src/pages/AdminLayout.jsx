import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AdminLayout() {
  const { signOut, appUser } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium ${
      isActive ? "bg-navy text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <p className="font-semibold text-navy">Panel IRREAL.IA</p>
          {appUser && <p className="text-xs text-gray-500">{appUser.full_name}</p>}
        </div>
        <button onClick={handleSignOut} className="text-sm text-gray-500 underline">
          Cerrar sesión
        </button>
      </header>

      <nav className="flex gap-2 px-6 py-3 border-b border-gray-100">
        <NavLink to="/admin/productos" className={linkClass}>
          Productos
        </NavLink>
        <NavLink to="/admin/restaurante" className={linkClass}>
          Mi restaurante
        </NavLink>
      </nav>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
