import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getPublicSiteUrl } from '@/lib/site-url'

type Body = {
  email?: string
  redirectTo?: string
  data?: Record<string, unknown>
}

function isEmailAlreadyRegistered(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('already been registered') ||
    m.includes('already registered') ||
    m.includes('user already registered')
  )
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
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      ...(body.redirectTo ? { redirectTo: body.redirectTo } : {}),
      ...(body.data && typeof body.data === 'object' ? { data: body.data } : {}),
    })

    if (!inviteError) {
      return NextResponse.json({ ok: true, mode: 'invite' as const })
    }

    const isNewSchoolInvite = Boolean(
      body.data && typeof body.data === 'object' && 'escuela_id' in body.data
    )

    if (isEmailAlreadyRegistered(inviteError.message) && isNewSchoolInvite) {
      return NextResponse.json(
        {
          error:
            'Este email ya tiene una cuenta en el sistema. Usá otro correo o pedí que ingresen con la cuenta existente.',
        },
        { status: 400 }
      )
    }

    if (isEmailAlreadyRegistered(inviteError.message) && !isNewSchoolInvite) {
      const redirectTo =
        body.redirectTo?.trim() ||
        (getPublicSiteUrl() ? `${getPublicSiteUrl()}/login/escuela` : '')

      if (!redirectTo.startsWith('http')) {
        return NextResponse.json(
          {
            error:
              'Este usuario ya se registró. Configurá NEXT_PUBLIC_SITE_URL o redirectTo para poder enviar el mail de acceso.',
          },
          { status: 400 }
        )
      }

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anon) {
        return NextResponse.json({ error: 'Configuración incompleta del servidor' }, { status: 500 })
      }

      const publicClient = createClient(url, anon, {
        // Implicit: el recover por mail debe coincidir con el cliente browser (sin PKCE en servidor).
        auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false },
      })

      const { error: resetError } = await publicClient.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (resetError) {
        return NextResponse.json({ error: resetError.message }, { status: 400 })
      }

      return NextResponse.json({ ok: true, mode: 'password_reset' as const })
    }

    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
