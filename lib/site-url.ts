/** URL pública del sitio (sin barra final). Definí NEXT_PUBLIC_SITE_URL en Vercel. */
export function getPublicSiteUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return undefined
  return raw.replace(/\/$/, '')
}

/** Destino post-invitación / magic link para usuarios escuela */
export function escuelaLoginAbsoluteUrl(): string | undefined {
  const base = getPublicSiteUrl()
  if (!base) return undefined
  return `${base}/login/escuela`
}
