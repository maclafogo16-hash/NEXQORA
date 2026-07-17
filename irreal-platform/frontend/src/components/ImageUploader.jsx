import { useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Sube una imagen al bucket "product-images", dentro de la carpeta de la
// organización (ver política de storage en 0004_storage_y_marca.sql), y
// devuelve la URL pública lista para guardar en la base de datos.
export default function ImageUploader({ organizationId, currentUrl, onUploaded, label }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 5MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${organizationId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
  }

  return (
    <div>
      {label && <label className="block text-sm text-gray-600 mb-1">{label}</label>}
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <img src={currentUrl} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            Sin foto
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 disabled:opacity-50"
        >
          {uploading ? "Subiendo..." : "Cambiar foto"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
