// app/login/escuela/page.tsx
// Página de login para escuelas

'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ensureRecoverySessionFromUrl } from '@/lib/auth-recovery'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginEscuelaForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const motivoInactiva = searchParams.get('motivo') === 'inactiva'

  useEffect(() => {
    if (motivoInactiva) {
      setError('Tu escuela está desactivada. Contactá al ministerio para más información.')
    }
  }, [motivoInactiva])

  useEffect(() => {
    const supabase = createClient()

    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setRecoveryMode(true)
    }

    let cancelled = false
    ;(async () => {
      if (typeof window !== 'undefined') {
        await ensureRecoverySessionFromUrl(supabase)
        if (cancelled) return
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session && window.location.hash.includes('type=recovery')) {
          setRecoveryMode(true)
        }
      }
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function verificarEscuelaYRedirigir(supabase: ReturnType<typeof createClient>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const ensure = await fetch('/api/auth/ensure-perfil', {
      method: 'POST',
      credentials: 'same-origin',
    })
    if (!ensure.ok) {
      const body = (await ensure.json()) as { error?: string }
      await supabase.auth.signOut()
      setError(body.error || 'No se pudo vincular tu cuenta con una escuela.')
      setLoading(false)
      return
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, escuelas(activa)')
      .eq('id', user.id)
      .single()

    if (!perfil || perfil.rol !== 'escuela') {
      await supabase.auth.signOut()
      setError('No tenés acceso como escuela.')
      setLoading(false)
      return
    }

    const raw = perfil.escuelas as { activa: boolean } | { activa: boolean }[] | null
    const escuela = Array.isArray(raw) ? raw[0] : raw
    if (!escuela?.activa) {
      await supabase.auth.signOut()
      setError('Tu escuela está desactivada. Contactá al ministerio para más información.')
      setLoading(false)
      return
    }

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    router.push('/dashboard/escuela')
  }

  async function handleNuevaPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }
    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    await ensureRecoverySessionFromUrl(supabase)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setError(
        'El enlace caducó o no es válido. Pedí que te reenvíen el acceso desde el ministerio.'
      )
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: nuevaPassword })

    if (updateError) {
      setError(updateError.message || 'No se pudo actualizar la contraseña.')
      setLoading(false)
      return
    }

    await verificarEscuelaYRedirigir(supabase)
    setLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password })

    if (signError) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    await verificarEscuelaYRedirigir(supabase)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col">

      {/* Navbar mínimo */}
      <nav className="w-full px-6 py-4 bg-white shadow-soft">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <span className="text-2xl">🌱</span>
          <div>
            <span className="font-bold text-primary-600 text-lg tracking-tight leading-none block">EspaciosVerdes</span>
            <span className="text-xs text-neutral-400 leading-none">Ministerio de Ambiente · Córdoba</span>
          </div>
        </Link>
      </nav>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="card w-full max-w-md shadow-card">

          <div className="text-center mb-8">
            <span className="text-4xl mb-3 block">🌿</span>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">
              {recoveryMode ? 'Nueva contraseña' : 'Acceso Escuelas'}
            </h1>
            <p className="text-sm text-neutral-500">
              {recoveryMode
                ? 'Definí tu nueva contraseña para continuar (es el paso que corresponde después del mail de recuperación).'
                : 'Ingresá con los datos que te proporcionó el ministerio'}
            </p>
          </div>

          {recoveryMode ? (
            <form onSubmit={handleNuevaPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Repetir contraseña
                </label>
                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repetí la contraseña"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar e ingresar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email institucional
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="escuela@ejemplo.com"
                  required
                  autoComplete="email"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-neutral-400 mt-6">
            ¿Problemas para ingresar? Contactá al ministerio.
          </p>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-neutral-400">
        Desarrollado por <a href="https://ggdesarrollos.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">GG Desarrollos</a>
      </footer>

    </main>
  )
}

export default function LoginEscuela() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-sm text-neutral-500">Cargando...</p>
      </main>
    }>
      <LoginEscuelaForm />
    </Suspense>
  )
}