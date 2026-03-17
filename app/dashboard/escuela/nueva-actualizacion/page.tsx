// app/dashboard/escuela/nueva-actualizacion/page.tsx
// Formulario para que la escuela cargue una actualización semanal de su huerta

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NuevaActualizacion() {
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState<'bien' | 'regular' | 'mal'>('bien')
  const [fotos, setFotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const archivos = Array.from(e.target.files).slice(0, 5)
    setFotos(archivos)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Obtener usuario y perfil
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

    // Crear la actualización
    const { data: actualizacion, error: errorActualizacion } = await supabase
      .from('actualizaciones')
      .insert({
        escuela_id: perfil.escuela_id,
        descripcion,
        estado,
      })
      .select()
      .single()

    if (errorActualizacion || !actualizacion) {
      setError('Error al guardar la actualización')
      setLoading(false)
      return
    }

    // Subir fotos si hay
    for (const foto of fotos) {
      const nombreArchivo = `${perfil.escuela_id}/${actualizacion.id}/${Date.now()}-${foto.name}`
      const { data: fotoSubida } = await supabase.storage
        .from('fotos-huertas')
        .upload(nombreArchivo, foto)

      if (fotoSubida) {
        const { data: urlPublica } = supabase.storage
          .from('fotos-huertas')
          .getPublicUrl(fotoSubida.path)

        await supabase.from('fotos').insert({
          actualizacion_id: actualizacion.id,
          url: urlPublica.publicUrl,
        })
      }
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
            <h1 className="text-xl font-bold text-neutral-900">Nueva actualización</h1>
            <p className="text-sm text-neutral-500 mt-1">Contanos cómo está la huerta esta semana</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Estado general */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                ¿Cómo está la huerta?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { valor: 'bien', label: '😊 Bien', clase: 'border-primary-400 bg-primary-50 text-primary-700' },
                  { valor: 'regular', label: '😐 Regular', clase: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
                  { valor: 'mal', label: '😟 Mal', clase: 'border-red-400 bg-red-50 text-red-700' },
                ].map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => setEstado(op.valor as 'bien' | 'regular' | 'mal')}
                    className={`border-2 rounded-xl py-3 text-sm font-medium transition-all ${estado === op.valor ? op.clase : 'border-neutral-200 bg-white text-neutral-500'}`}>
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Contanos qué pasó esta semana en la huerta, qué plantaron, cómo están los cultivos..."
                rows={4}
                required
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Fotos */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Fotos (máximo 5)
              </label>
              <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFotos}
                  className="hidden"
                  id="fotos-input"
                />
                <label htmlFor="fotos-input" className="cursor-pointer">
                  <span className="text-3xl block mb-2">📸</span>
                  <p className="text-sm text-neutral-500">
                    {fotos.length > 0
                      ? `${fotos.length} foto${fotos.length > 1 ? 's' : ''} seleccionada${fotos.length > 1 ? 's' : ''}`
                      : 'Tocá para seleccionar fotos'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">JPG, PNG · Máximo 5 fotos</p>
                </label>
              </div>
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
              {loading ? 'Guardando...' : 'Guardar actualización'}
            </button>

          </form>
        </div>
      </div>
    </main>
  )
}