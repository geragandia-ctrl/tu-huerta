import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { findUserIdByEmail } from '@/lib/admin-find-user'
import { isPlausibleEmail, isValidPasswordLength } from '@/lib/validation'
import { jsonInternalError } from '@/lib/api-error'

type Body = {
  email?: string
  password?: string
}

async function assertAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') {
    return { error: NextResponse.json({ error: 'Prohibido' }, { status: 403 }) }
  }

  return { supabase, user }
}

export async function POST(request: Request) {
  try {
    const auth = await assertAdmin()
    if ('error' in auth && auth.error) return auth.error

    let body: Body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !isPlausibleEmail(email)) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }
    if (!isValidPasswordLength(password)) {
      return NextResponse.json(
        { error: 'La contraseña debe tener entre 6 y 128 caracteres' },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()
    const userId = await findUserIdByEmail(admin, email)
    if (!userId) {
      return NextResponse.json({ error: 'No se encontró un usuario con ese email' }, { status: 404 })
    }

    const { data: existing, error: getErr } = await admin.auth.admin.getUserById(userId)
    if (getErr || !existing?.user) {
      return NextResponse.json({ error: getErr?.message || 'Usuario no encontrado' }, { status: 400 })
    }
    const prev = (existing.user.user_metadata || {}) as Record<string, unknown>
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { ...prev, must_change_password: true },
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return jsonInternalError(e)
  }
}

