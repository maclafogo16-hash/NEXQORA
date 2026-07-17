import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import ImageUploader from "../components/ImageUploader";

const emptyForm = {
  id: null,
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
  is_active: true,
};

export default function AdminProducts() {
  const { appUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);

  const organizationId = appUser?.organization_id;

  useEffect(() => {
    if (organizationId) loadData();
  }, [organizationId]);

  async function loadData() {
    setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").eq("organization_id", organizationId).order("sort_order"),
      supabase.from("products").select("*").eq("organization_id", organizationId).order("sort_order"),
    ]);
    setCategories(cats ?? []);
    setProducts(prods ?? []);
    setLoading(false);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(product) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      category_id: product.category_id ?? "",
      image_url: product.image_url ?? "",
      is_active: product.is_active,
    });
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from("categories").insert({
      organization_id: organizationId,
      name: newCategoryName.trim(),
      sort_order: categories.length,
    });
    if (!error) {
      setNewCategoryName("");
      loadData();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      organization_id: organizationId,
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
    };

    const result = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (!result.error) {
      setForm(emptyForm);
      loadData();
    }
  }

  async function handleDelete(productId) {
    if (!confirm("¿Eliminar este producto?")) return;
    await supabase.from("products").delete().eq("id", productId);
    loadData();
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-10">
      {/* ---------- Formulario de producto ---------- */}
      <section>
        <h2 className="font-semibold text-navy mb-3">
          {form.id ? "Editar producto" : "Agregar producto"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 p-4 rounded-xl">
          <ImageUploader
            organizationId={organizationId}
            currentUrl={form.image_url}
            label="Foto del producto"
            onUploaded={(url) => updateField("image_url", url)}
          />
          <input
            required
            placeholder="Nombre del producto"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <textarea
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            required
            type="number"
            min="0"
            step="100"
            placeholder="Precio (COP)"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <select
            value={form.category_id}
            onChange={(e) => updateField("category_id", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)}
            />
            Visible en el menú
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-navy text-white font-semibold px-5 py-2 disabled:opacity-50"
            >
              {saving ? "Guardando..." : form.id ? "Guardar cambios" : "Agregar producto"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="text-sm text-gray-500"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ---------- Categorías rápidas ---------- */}
      <section>
        <h2 className="font-semibold text-navy mb-3">Categorías</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((cat) => (
            <span key={cat.id} className="text-sm bg-gray-100 rounded-full px-3 py-1">
              {cat.name}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Nueva categoría (ej. Postres)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            Agregar
          </button>
        </div>
      </section>

      {/* ---------- Lista de productos ---------- */}
      <section>
        <h2 className="font-semibold text-navy mb-3">Tu menú ({products.length})</h2>
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 border border-gray-100 rounded-xl p-3"
            >
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {product.name} {!product.is_active && <span className="text-gray-400">(oculto)</span>}
                </p>
                <p className="text-xs text-gray-500">
                  ${Number(product.price).toLocaleString("es-CO")}
                </p>
              </div>
              <button onClick={() => startEdit(product)} className="text-sm text-navy underline">
                Editar
              </button>
              <button onClick={() => handleDelete(product.id)} className="text-sm text-red-500">
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
