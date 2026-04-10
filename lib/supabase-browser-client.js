// Igual que @supabase/ssr createBrowserClient, pero con flowType "implicit".
// Los mails de recuperación (recover) usan redirección tipo implicit grant; con PKCE
// el cliente rechaza el callback y queda la sesión anterior (p. ej. admin) o ninguna.

import { createClient } from '@supabase/supabase-js'
import { VERSION } from '@supabase/ssr/dist/module/version'
import { isBrowser } from '@supabase/ssr/dist/module/utils'
import { createStorageFromOptions } from '@supabase/ssr/dist/module/cookies'

let cachedBrowserClient

export function createBrowserClient(supabaseUrl, supabaseKey, options) {
  const shouldUseSingleton =
    options?.isSingleton === true || ((!options || !('isSingleton' in options)) && isBrowser())
  if (shouldUseSingleton && cachedBrowserClient) {
    return cachedBrowserClient
  }
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase URL and anon key are required. Check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }
  const { storage } = createStorageFromOptions(
    {
      ...options,
      cookieEncoding: options?.cookieEncoding ?? 'base64url',
    },
    false
  )
  const client = createClient(supabaseUrl, supabaseKey, {
    ...options,
    global: {
      ...options?.global,
      headers: {
        ...options?.global?.headers,
        'X-Client-Info': `supabase-ssr/${VERSION} createBrowserClient(implicit)`,
      },
    },
    auth: {
      ...options?.auth,
      ...(options?.cookieOptions?.name ? { storageKey: options.cookieOptions.name } : null),
      flowType: 'implicit',
      autoRefreshToken: isBrowser(),
      detectSessionInUrl: isBrowser(),
      persistSession: true,
      storage,
      ...(options?.cookies &&
      'encode' in options.cookies &&
      options.cookies.encode === 'tokens-only'
        ? {
            userStorage: options?.auth?.userStorage ?? window.localStorage,
          }
        : null),
    },
  })
  if (shouldUseSingleton) {
    cachedBrowserClient = client
  }
  return client
}
