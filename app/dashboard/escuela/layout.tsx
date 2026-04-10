'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PageLoading from '@/components/PageLoading'

export default function EscuelaDashboardLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const router = useRouter()

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
  }, [router])

  if (!ready) {
    return <PageLoading message="Verificando acceso..." />
  }

  return <>{children}</>
}
