'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function CambiarPasswordEscuela() {
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
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
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login/escuela')
      return
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    if (!perfil || perfil.rol !== 'escuela') {
      await supabase.auth.signOut()
      router.push('/login/escuela')
      return
    }

    const meta = (user.user_metadata || {}) as Record<string, unknown>
    const { error: updateError } = await supabase.auth.updateUser({
      password: nuevaPassword,
      data: { ...meta, must_change_password: false },
    })

    if (updateError) {
      setError(updateError.message || 'No se pudo actualizar la contraseña.')
      setLoading(false)
      return
    }

    router.push('/dashboard/escuela')
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col">
      <nav className="w-full px-6 py-4 bg-white shadow-soft">
        <Link href="/dashboard/escuela" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Volver
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="card w-full max-w-md shadow-card">
          <div className="text-center mb-8">
            <span className="text-4xl mb-3 block">🔐</span>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Cambiar contraseña</h1>
            <p className="text-sm text-neutral-500">
              Por seguridad, te pedimos que cambies la contraseña temporal del ministerio.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nueva contraseña</label>
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

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

