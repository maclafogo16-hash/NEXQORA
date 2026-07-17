import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Sesión de staff (Owner, Admin, Gerente...) — distinta del comprador final,
// que nunca necesita loguearse para pedir en el Motor Web.
export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = aún no se sabe
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // todavía cargando
    if (!session) {
      setAppUser(null);
      setLoading(false);
      return;
    }
    supabase
      .from("app_users")
      .select("id, organization_id, full_name")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("No se encontró un perfil de staff para este usuario:", error.message);
        }
        setAppUser(data ?? null);
        setLoading(false);
      });
  }, [session]);

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, appUser, loading, signIn, signOut };
}
