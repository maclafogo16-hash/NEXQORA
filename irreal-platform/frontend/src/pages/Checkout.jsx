import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";

// Motor de Pedidos — sección 4 del Blueprint.
// Arma el pedido y lo envía a la Edge Function create-order, que valida
// precios en el servidor y dispara el Flujo de Eventos (sección 7).
export default function Checkout({ organization, branchId }) {
  const { items, removeItem, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    order_type: "delivery",
    payment_method: "cash",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitOrder(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`;

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          organization_slug: organization.slug,
          branch_id: branchId,
          order_type: form.order_type,
          payment_method: form.payment_method,
          customer: { full_name: form.full_name, phone: form.phone },
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          notes: form.notes,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo crear el pedido.");

      setConfirmedOrderId(result.order_id);
      clearCart();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrderId) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <h1 className="text-xl font-bold text-navy mb-2">¡Pedido recibido!</h1>
        <p className="text-gray-600">
          Tu pedido <span className="font-mono">{confirmedOrderId.slice(0, 8)}</span> fue enviado a{" "}
          {organization.name}. Te contactarán para confirmar.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 rounded-full bg-navy text-white px-5 py-2"
        >
          Volver al menú
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold text-navy mb-4">Tu pedido</h1>

      <div className="space-y-2 mb-6">
        {items.map((item) => (
          <div key={item.product_id} className="flex justify-between items-center text-sm">
            <span>
              {item.quantity}x {item.name}
            </span>
            <div className="flex items-center gap-3">
              <span>${(item.price * item.quantity).toLocaleString("es-CO")}</span>
              <button
                type="button"
                onClick={() => removeItem(item.product_id)}
                className="text-gray-400 text-xs"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>${total.toLocaleString("es-CO")}</span>
        </div>
      </div>

      <form onSubmit={submitOrder} className="space-y-4">
        <input
          required
          placeholder="Nombre completo"
          value={form.full_name}
          onChange={(e) => updateField("full_name", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          required
          placeholder="Teléfono (WhatsApp)"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />

        <select
          value={form.order_type}
          onChange={(e) => updateField("order_type", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="delivery">Domicilio</option>
          <option value="pickup">Recoger en tienda</option>
          <option value="scheduled">Pedido programado</option>
        </select>

        <select
          value={form.payment_method}
          onChange={(e) => updateField("payment_method", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="cash">Efectivo</option>
          <option value="nequi">Nequi</option>
          <option value="daviplata">Daviplata</option>
          <option value="pse">PSE</option>
          <option value="card">Tarjeta</option>
        </select>

        <textarea
          placeholder="Notas del pedido (opcional)"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="w-full rounded-xl bg-gold text-white font-semibold py-3 disabled:opacity-50"
        >
          {submitting ? "Enviando..." : "Confirmar pedido"}
        </button>
      </form>
    </div>
  );
}
