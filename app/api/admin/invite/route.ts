import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

type Body = {
  email?: string
  redirectTo?: string
  data?: Record<string, unknown>
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'admin') {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 })
    }

    let body: Body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      ...(body.redirectTo ? { redirectTo: body.redirectTo } : {}),
      ...(body.data && typeof body.data === 'object' ? { data: body.data } : {}),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
