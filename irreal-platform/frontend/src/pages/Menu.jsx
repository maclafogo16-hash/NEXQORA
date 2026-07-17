import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../hooks/useCart";

// Motor Web — sección 4 del Blueprint.
// Muestra el menú público de la organización actual (sin necesidad de login).
export default function Menu({ organization }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { items, addItem, total } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadMenu() {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, sort_order")
          .eq("organization_id", organization.id)
          .order("sort_order"),
        supabase
          .from("products")
          .select("id, name, description, price, image_url, category_id")
          .eq("organization_id", organization.id)
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      setCategories(cats ?? []);
      setProducts(prods ?? []);
      setLoading(false);
    }
    loadMenu();
  }, [organization.id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando menú...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-28">
      <header
        className="relative px-6 py-10 text-white bg-cover bg-center"
        style={{
          backgroundColor: organization.primary_color || "#16233B",
          backgroundImage: organization.cover_image_url
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${organization.cover_image_url})`
            : undefined,
        }}
      >
        <div className="flex items-center gap-3">
          {organization.logo_url && (
            <img
              src={organization.logo_url}
              alt=""
              className="w-14 h-14 rounded-full object-cover border-2 border-white/60"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{organization.name}</h1>
            <p className="text-sm opacity-90 mt-0.5">
              {organization.tagline || "Pide directo, sin comisiones de terceros."}
            </p>
          </div>
        </div>
      </header>

      {categories.map((cat) => {
        const catProducts = products.filter((p) => p.category_id === cat.id);
        if (!catProducts.length) return null;
        return (
          <section key={cat.id} className="px-6 mt-6">
            <h2 className="text-lg font-semibold text-navy mb-3">{cat.name}</h2>
            <div className="space-y-3">
              {catProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 border-b border-gray-100 pb-3"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.description && (
                      <p className="text-sm text-gray-500">{product.description}</p>
                    )}
                    <p className="text-sm font-semibold text-navy mt-1">
                      ${Number(product.price).toLocaleString("es-CO")}
                    </p>
                  </div>
                  <button
                    onClick={() => addItem(product)}
                    className="shrink-0 rounded-full bg-navy text-white text-sm font-medium px-4 py-2 active:scale-95 transition"
                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <button
            onClick={() => navigate("/checkout")}
            className="w-full max-w-2xl mx-auto flex items-center justify-between rounded-xl bg-gold text-white font-semibold px-5 py-3 block"
          >
            <span>{items.reduce((n, i) => n + i.quantity, 0)} producto(s)</span>
            <span>Ver carrito · ${total.toLocaleString("es-CO")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
