import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { findUserIdByEmail } from '@/lib/admin-find-user'
import { isPlausibleEmail, isValidPasswordLength, isValidUuid } from '@/lib/validation'
import { jsonInternalError } from '@/lib/api-error'

function isUserAlreadyExists(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('already been registered') ||
    m.includes('already registered') ||
    m.includes('user already registered') ||
    m.includes('already exists')
  )
}

type Body = {
  email?: string
  escuelaId?: string
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
    const escuelaId = typeof body.escuelaId === 'string' ? body.escuelaId.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !isPlausibleEmail(email)) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }
    if (!escuelaId || !isValidUuid(escuelaId)) {
      return NextResponse.json({ error: 'Escuela no válida' }, { status: 400 })
    }
    if (!isValidPasswordLength(password)) {
      return NextResponse.json(
        { error: 'La contraseña debe tener entre 6 y 128 caracteres' },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()

    const { data: escuelaRow, error: escuelaErr } = await admin
      .from('escuelas')
      .select('id')
      .eq('id', escuelaId)
      .maybeSingle()

    if (escuelaErr || !escuelaRow) {
      return NextResponse.json({ error: 'No existe la escuela indicada' }, { status: 400 })
    }

    const meta = { escuela_id: escuelaId, rol: 'escuela' as const, must_change_password: true }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: meta,
    })

    let userId = data?.user?.id

    if (error) {
      if (!isUserAlreadyExists(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      const existingId = await findUserIdByEmail(admin, email)
      if (!existingId) {
        return NextResponse.json(
          { error: 'Ese email ya está registrado pero no se pudo actualizar el usuario.' },
          { status: 400 }
        )
      }
      const { data: existingUser, error: getErr } = await admin.auth.admin.getUserById(existingId)
      if (getErr || !existingUser?.user) {
        return NextResponse.json({ error: getErr?.message || 'No se pudo leer el usuario' }, { status: 400 })
      }
      const prev = (existingUser.user.user_metadata || {}) as Record<string, unknown>
      const { error: updErr } = await admin.auth.admin.updateUserById(existingId, {
        password,
        user_metadata: { ...prev, ...meta },
      })
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 400 })
      }
      userId = existingId
    }

    if (!userId) {
      return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 400 })
    }

    // Crear perfil si no existe (no fallar si ya está).
    const { error: perfilError } = await admin.from('perfiles').insert({
      id: userId,
      escuela_id: escuelaId,
      rol: 'escuela',
      nombre_completo: 'Escuela',
    })

    if (perfilError && perfilError.code !== '23505') {
      return NextResponse.json({ error: perfilError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return jsonInternalError(e)
  }
}

