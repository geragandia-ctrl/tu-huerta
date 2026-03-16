// lib/supabase.js
// Cliente de Supabase para usar en toda la aplicación
// Este archivo centraliza la conexión — si alguna vez cambian las credenciales,
// solo se cambia acá y afecta a todo el proyecto

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}