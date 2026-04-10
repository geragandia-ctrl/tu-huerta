'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePathname, useRouter } from 'next/navigation'
import PageLoading from '@/components/PageLoading'

export default function EscuelaDashboardLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false

    async function guard() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return
      if (!user) {
        router.replace('/login/escuela')
        return
      }

      const mustChange = Boolean(
        (user.user_metadata as { must_change_password?: boolean } | undefined)?.must_change_password
      )
      if (mustChange && pathname && !pathname.includes('/cambiar-password')) {
        router.replace('/dashboard/escuela/cambiar-password')
        return
      }

      const ensure = await fetch('/api/auth/ensure-perfil', {
        method: 'POST',
        credentials: 'same-origin',
      })
      if (!ensure.ok) {
        await supabase.auth.signOut()
        router.replace('/login/escuela')
        return
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol, escuelas(activa)')
        .eq('id', user.id)
        .single()

      if (cancelled) return

      if (!perfil || perfil.rol !== 'escuela') {
        await supabase.auth.signOut()
        router.replace('/login/escuela')
        return
      }

      const raw = perfil.escuelas as { activa: boolean } | { activa: boolean }[] | null
      const escuela = Array.isArray(raw) ? raw[0] : raw
      if (!escuela?.activa) {
        await supabase.auth.signOut()
        router.replace('/login/escuela?motivo=inactiva')
        return
      }

      setReady(true)
    }

    guard()
    return () => {
      cancelled = true
    }
  }, [router, pathname])

  if (!ready) {
    return <PageLoading message="Verificando acceso..." />
  }

  return <>{children}</>
}
