import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Resuelve el "slug" del restaurante a partir del subdominio.
// demo.irreal.ia            -> "demo"
// demo.localhost:5173       -> "demo"      (desarrollo local)
// localhost:5173?tenant=demo -> "demo"     (alternativa sin configurar hosts locales)
function resolveSlugFromLocation() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("tenant")) return params.get("tenant");

  const host = window.location.hostname; // ej. demo.irreal.ia
  const parts = host.split(".");

  // localhost sin subdominio -> sin slug (se debe usar ?tenant=)
  if (host === "localhost" || host === "127.0.0.1") return null;

  // demo.localhost -> ["demo", "localhost"]
  if (parts.length >= 2) return parts[0];

  return null;
}

export function useTenant() {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const slug = resolveSlugFromLocation();

    if (!slug) {
      setError("No se pudo identificar el restaurante (falta subdominio o ?tenant=).");
      setLoading(false);
      return;
    }

    async function loadOrganization() {
      const { data, error: fetchError } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url, cover_image_url, tagline, primary_color, plan")
        .eq("slug", slug)
        .single();

      if (fetchError || !data) {
        setError(`No se encontró el restaurante "${slug}".`);
        setLoading(false);
        return;
      }

      // Resuelve la sucursal principal. Cuando el Motor Multi-Sucursal esté
      // activo, aquí se listarían todas las sucursales para que el cliente elija.
      const { data: branch } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", data.id)
        .eq("is_main", true)
        .single();

      setOrganization({ ...data, main_branch_id: branch?.id ?? null });
      setLoading(false);
    }

    loadOrganization();
  }, []);

  return { organization, loading, error };
}
