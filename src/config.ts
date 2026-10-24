export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    '[Config] Advertencia: VITE_SUPABASE_URL y/o VITE_SUPABASE_KEY no están configuradas en las variables de entorno (.env). El modo offline/local estará activo.'
  );
}
