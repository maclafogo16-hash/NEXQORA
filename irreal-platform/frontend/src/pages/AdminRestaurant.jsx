import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import ImageUploader from "../components/ImageUploader";

export default function AdminRestaurant() {
  const { appUser } = useAuth();
  const organizationId = appUser?.organization_id;

  const [org, setOrg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (organizationId) loadOrg();
  }, [organizationId]);

  async function loadOrg() {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();
    setOrg(data);
  }

  function updateField(field, value) {
    setOrg((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(false);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: org.name,
        tagline: org.tagline,
        primary_color: org.primary_color,
        logo_url: org.logo_url,
        cover_image_url: org.cover_image_url,
      })
      .eq("id", organizationId);
    setSaving(false);
    if (!error) setSavedMessage(true);
  }

  if (!org) return <p className="text-gray-500">Cargando...</p>;

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-md">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Nombre del restaurante</label>
        <input
          value={org.name}
          onChange={(e) => updateField("name", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Frase corta (aparece bajo el nombre en tu menú)
        </label>
        <input
          placeholder="Ej. Comida santandereana a domicilio"
          value={org.tagline ?? ""}
          onChange={(e) => updateField("tagline", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <ImageUploader
        organizationId={organizationId}
        currentUrl={org.logo_url}
        label="Logo"
        onUploaded={(url) => updateField("logo_url", url)}
      />

      <ImageUploader
        organizationId={organizationId}
        currentUrl={org.cover_image_url}
        label="Foto de portada (fondo del menú)"
        onUploaded={(url) => updateField("cover_image_url", url)}
      />

      <div>
        <label className="block text-sm text-gray-600 mb-1">Color de marca</label>
        <input
          type="color"
          value={org.primary_color ?? "#16233B"}
          onChange={(e) => updateField("primary_color", e.target.value)}
          className="w-16 h-10 border border-gray-300 rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-navy text-white font-semibold px-5 py-2 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
      {savedMessage && <p className="text-green-600 text-sm">Cambios guardados.</p>}
    </form>
  );
}
