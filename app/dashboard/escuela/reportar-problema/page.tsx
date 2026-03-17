// app/dashboard/escuela/reportar-problema/page.tsx
// Formulario para que la escuela reporte un problema en su huerta

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ReportarProblema() {
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login/escuela')
      return
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('escuela_id')
      .eq('id', user.id)
      .single()

    if (!perfil) {
      setError('No se encontró tu perfil')
      setLoading(false)
      return
    }

    const { error: errorProblema } = await supabase
      .from('problemas')
      .insert({
        escuela_id: perfil.escuela_id,
        tipo,
        descripcion,
      })

    if (errorProblema) {
      setError('Error al guardar el problema')
      setLoading(false)
      return
    }

    router.push('/dashboard/escuela')
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col">

      {/* Navbar */}
      <nav className="w-full px-6 py-4 bg-white shadow-soft sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/dashboard/escuela" className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-primary-600 text-lg">EspaciosVerdes</span>
          </Link>
          <Link href="/dashboard/escuela" className="text-sm text-neutral-500 hover:text-neutral-700">
            ← Volver
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto w-full px-6 py-8">
        <div className="card shadow-card">

          <div className="mb-6">
            <h1 className="text-xl font-bold text-neutral-900">Reportar un problema</h1>
            <p className="text-sm text-neutral-500 mt-1">El ministerio va a recibir tu reporte y te va a contactar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Tipo de problema */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tipo de problema
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { valor: 'Plaga o enfermedad', icon: '🐛' },
                  { valor: 'Falta de agua', icon: '💧' },
                  { valor: 'Vandalismo', icon: '⚠️' },
                  { valor: 'Falta de insumos', icon: '📦' },
                  { valor: 'Problema estructural', icon: '🏗️' },
                  { valor: 'Otro', icon: '❓' },
                ].map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => setTipo(op.valor)}
                    className={`border-2 rounded-xl py-3 px-4 text-sm font-medium text-left transition-all flex items-center gap-2 ${tipo === op.valor ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-neutral-200 bg-white text-neutral-500'}`}>
                    <span>{op.icon}</span>
                    {op.valor}
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Descripción del problema
              </label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Describí el problema con el mayor detalle posible..."
                rows={4}
                required
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !tipo}
              className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Enviando...' : 'Enviar reporte'}
            </button>

          </form>
        </div>
      </div>
    </main>
  )
}