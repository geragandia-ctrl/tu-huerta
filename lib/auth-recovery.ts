import type { SupabaseClient } from '@supabase/supabase-js'

/** Misma lógica que en auth-js: hash + query; la query pisa al hash. */
export function parseAuthParamsFromHref(href: string): Record<string, string> {
  const result: Record<string, string> = {}
  try {
    const url = new URL(href)
    if (url.hash?.startsWith('#')) {
      try {
        const hashSearchParams = new URLSearchParams(url.hash.slice(1))
        hashSearchParams.forEach((value, key) => {
          result[key] = value
        })
      } catch {
        /* hash no es query string */
      }
    }
    url.searchParams.forEach((value, key) => {
      result[key] = value
    })
  } catch {
    /* ignore */
  }
  return result
}

export function looksLikePasswordRecoveryUrl(href: string): boolean {
  const p = parseAuthParamsFromHref(href)
  if (p.type === 'recovery') return true
  if (p.access_token && p.refresh_token) return true
  return false
}

/**
 * Tras un redirect de recuperación, asegura sesión: initialize + tokens en URL si hace falta.
 * Útil si un primer initialize falló (p. ej. mezcla PKCE/implicit) y quedó sesión vacía.
 */
export async function ensureRecoverySessionFromUrl(supabase: SupabaseClient): Promise<void> {
  if (typeof window === 'undefined') return
  await supabase.auth.initialize()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session) return

  const params = parseAuthParamsFromHref(window.location.href)
  const access_token = params.access_token
  const refresh_token = params.refresh_token
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token })
  }
}
