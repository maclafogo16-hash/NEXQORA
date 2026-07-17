import { Routes, Route } from "react-router-dom";
import { useTenant } from "./hooks/useTenant";
import { CartProvider } from "./hooks/useCart";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";

export default function App() {
  const { organization, loading, error } = useTenant();

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando restaurante...</div>;

  if (error || !organization) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>{error}</p>
        <p className="text-sm mt-2">
          En desarrollo local, prueba con <code>?tenant=demo</code> en la URL.
        </p>
      </div>
    );
  }

  // NOTA: para simplificar el ejemplo se asume una sola sucursal (branch) por
  // organización y se resuelve implícitamente. Cuando el Motor Multi-Sucursal
  // esté activo, este valor debe venir de una consulta a `branches` por organización.
  const branchId = organization.main_branch_id;

  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Menu organization={organization} />} />
        <Route
          path="/checkout"
          element={<Checkout organization={organization} branchId={branchId} />}
        />
      </Routes>
    </CartProvider>
  );
}
