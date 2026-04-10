import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Crea la fila en `perfiles` si el usuario viene de una invitación con
 * user_metadata (escuela_id, rol) pero aún no tiene perfil (p. ej. sin trigger en BD).
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ ok: true, created: false })
    }

    const meta = user.user_metadata || {}
    const escuelaId = meta.escuela_id as string | undefined
    const rol = meta.rol as string | undefined

    if (!escuelaId || rol !== 'escuela') {
      return NextResponse.json(
        {
          error:
            'Tu cuenta no está vinculada a una escuela (falta perfil). Pedí al ministerio que revise la invitación o tu usuario en Supabase.',
        },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()
    const { error } = await admin.from('perfiles').insert({
      id: user.id,
      escuela_id: escuelaId,
      rol: 'escuela',
      nombre_completo: typeof meta.nombre_completo === 'string' ? meta.nombre_completo : 'Escuela',
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, created: false })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, created: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
