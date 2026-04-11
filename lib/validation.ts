/** Validación ligera para inputs de APIs (no reemplaza RLS en Supabase). */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value.trim())
}

const EMAIL_MAX = 254

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/** Comprueba formato razonable de email (Supabase valida el resto). */
export function isPlausibleEmail(email: string): boolean {
  if (!email || email.length > EMAIL_MAX) return false
  const at = email.indexOf('@')
  if (at < 1 || at === email.length - 1) return false
  return email.includes('.', at)
}

const PASSWORD_MIN = 6
const PASSWORD_MAX = 128

export function isValidPasswordLength(password: string): boolean {
  const len = password.length
  return len >= PASSWORD_MIN && len <= PASSWORD_MAX
}
