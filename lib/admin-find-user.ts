import type { SupabaseClient } from '@supabase/supabase-js'

export async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  const perPage = 1000
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(error.message)
    const user = data?.users?.find((u) => (u.email || '').toLowerCase() === normalized)
    if (user) return user.id
    if (!data?.users || data.users.length < perPage) break
  }
  return null
}
