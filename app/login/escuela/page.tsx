// app/login/escuela/page.tsx
// Página de login para escuelas

'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginEscuelaForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signError } = await supabase.auth.signInWithPassword({ email, password })

    if (signError) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    const user = data.user
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

    router.push('/dashboard/escuela')
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
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Acceso Escuelas</h1>
            <p className="text-sm text-neutral-500">Ingresá con los datos que te proporcionó el ministerio</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="escuela@ejemplo.com"
                required
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
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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
              className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

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