import { getPublicSiteUrl } from '@/lib/site-url'

/**
 * Evita open-redirect en redirectTo hacia Supabase (invite / recovery).
 * Solo permite el mismo origin que NEXT_PUBLIC_SITE_URL (http en localhost, https en prod).
 */
export function isAllowedAppRedirectUrl(url: string): boolean {
  const base = getPublicSiteUrl()
  if (!base || !url.trim()) return false
  try {
    const u = new URL(url.trim())
    const allowed = new URL(base)
    return u.origin === allowed.origin
  } catch {
    return false
  }
}
