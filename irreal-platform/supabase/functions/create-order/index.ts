// ============================================================
// Motor de Pedidos — create-order
// Recibe un pedido del Motor Web (sin login) y lo crea de forma segura:
// valida precios contra la base de datos (nunca confía en el precio que
// manda el navegador), crea o reutiliza el cliente por teléfono, y registra
// el pedido con sus items. Este es el punto de entrada al Flujo de Eventos
// (sección 7 del Blueprint): Cliente compra → Pedido.
// ============================================================

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Cliente con service role: puede saltarse RLS porque esta función
// hace su propia validación de negocio antes de escribir nada.
const supabase = createClient(supabaseUrl, serviceRoleKey);

interface CartItem {
  product_id: string;
  quantity: number;
}

interface CreateOrderPayload {
  organization_slug: string;
  branch_id: string;
  order_type: "delivery" | "pickup" | "scheduled";
  payment_method: "cash" | "nequi" | "daviplata" | "pse" | "card";
  customer: { full_name: string; phone: string; email?: string };
  items: CartItem[];
  notes?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload: CreateOrderPayload = await req.json();

    if (!payload.items?.length) {
      return json({ error: "El pedido no tiene productos." }, 400);
    }

    // 1. Resolver la organización por su slug (subdominio) — nunca se confía en un organization_id enviado por el cliente.
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", payload.organization_slug)
      .single();

    if (orgError || !org) return json({ error: "Restaurante no encontrado." }, 404);

    // 2. Traer los productos reales de la base de datos y recalcular el total en el servidor.
    const productIds = payload.items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, is_active")
      .eq("organization_id", org.id)
      .in("id", productIds);

    if (productsError || !products?.length) {
      return json({ error: "No se pudieron validar los productos." }, 400);
    }

    let subtotal = 0;
    const orderItems = payload.items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product || !product.is_active) {
        throw new Error(`Producto no disponible: ${item.product_id}`);
      }
      const itemSubtotal = Number(product.price) * item.quantity;
      subtotal += itemSubtotal;
      return {
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    // 3. Crear o reutilizar el cliente por teléfono (Motor de Clientes).
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          organization_id: org.id,
          phone: payload.customer.phone,
          full_name: payload.customer.full_name,
          email: payload.customer.email ?? null,
        },
        { onConflict: "organization_id,phone" }
      )
      .select()
      .single();

    if (customerError) return json({ error: "No se pudo registrar el cliente." }, 500);

    // 4. Crear el pedido.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        organization_id: org.id,
        branch_id: payload.branch_id,
        customer_id: customer.id,
        channel: "web",
        order_type: payload.order_type,
        payment_method: payload.payment_method,
        subtotal,
        total: subtotal,
        notes: payload.notes ?? null,
      })
      .select()
      .single();

    if (orderError || !order) return json({ error: "No se pudo crear el pedido." }, 500);

    // 5. Insertar los items del pedido.
    const itemsToInsert = orderItems.map((i) => ({ ...i, order_id: order.id }));
    const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);
    if (itemsError) return json({ error: "No se pudieron guardar los productos del pedido." }, 500);

    return json({ order_id: order.id, total: subtotal }, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Error inesperado." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
