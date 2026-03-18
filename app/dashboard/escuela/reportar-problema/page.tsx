// app/dashboard/escuela/reportar-problema/page.tsx
// Formulario para reportar un problema — con hasta 2 fotos

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ReportarProblema() {
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    setFotos(Array.from(e.target.files).slice(0, 2))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login/escuela'); return }

    const { data: perfil } = await supabase
      .from('perfiles').select('escuela_id').eq('id', user.id).single()
    if (!perfil) { setError('No se encontró tu perfil'); setLoading(false); return }

    const { data: problema, error: errorProblema } = await supabase
      .from('problemas')
      .insert({ escuela_id: perfil.escuela_id, tipo, descripcion })
      .select().single()

    if (errorProblema || !problema) {
      setError('Error al guardar el caso')
      setLoading(false)
      return
    }

    // Subir fotos si hay
    for (const foto of fotos) {
      const nombreArchivo = `problemas/${problema.id}/${Date.now()}-${foto.name}`
      const { data: fotoSubida } = await supabase.storage
        .from('fotos-huertas')
        .upload(nombreArchivo, foto)

      if (fotoSubida) {
        const { data: urlPublica } = supabase.storage
          .from('fotos-huertas').getPublicUrl(fotoSubida.path)
        await supabase.from('fotos_problemas').insert({
          problema_id: problema.id,
          url: urlPublica.publicUrl,
        })
      }
    }

    router.push('/dashboard/escuela')
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col">

      <nav className="w-full px-6 py-4 bg-white shadow-soft sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/dashboard/escuela" className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-primary-600 text-lg">EspaciosVerdes</span>
          </Link>
          <Link href="/dashboard/escuela" className="text-sm text-neutral-500 hover:text-neutral-700">← Volver</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto w-full px-6 py-8">
        <div className="card shadow-card">

          <div className="mb-6">
            <h1 className="text-xl font-bold text-neutral-900">Reportar un caso</h1>
            <p className="text-sm text-neutral-500 mt-1">El ministerio va a recibir tu reporte y te va a contactar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Tipo de problema</label>
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
                    <span>{op.icon}</span>{op.valor}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Descripción</label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Describí el problema con el mayor detalle posible..."
                rows={4}
                required
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Fotos */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Fotos (máximo 2)</label>
              <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFotos}
                  className="hidden"
                  id="fotos-problema"
                />
                <label htmlFor="fotos-problema" className="cursor-pointer">
                  <span className="text-3xl block mb-2">📷</span>
                  <p className="text-sm text-neutral-500">
                    {fotos.length > 0
                      ? `${fotos.length} foto${fotos.length > 1 ? 's' : ''} seleccionada${fotos.length > 1 ? 's' : ''}`
                      : 'Tocá para agregar fotos del problema'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">Opcional · Máximo 2 fotos</p>
                </label>
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

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