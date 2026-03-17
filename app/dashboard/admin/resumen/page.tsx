// app/dashboard/admin/resumen/page.tsx
// Vista resumen general de todas las escuelas
// Muestra estado de materiales y última actualización de cada escuela

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResumenGeneral() {
  const [escuelas, setEscuelas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function cargarDatos() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login/admin'); return }

      const { data: perfil } = await supabase
        .from('perfiles').select('rol').eq('id', user.id).single()
      if (!perfil || perfil.rol !== 'admin') { router.push('/login/admin'); return }

      const { data: escuelasData } = await supabase
        .from('escuelas')
        .select(`
          *,
          materiales(*),
          actualizaciones(estado, created_at),
          problemas(id, resuelto)
        `)
        .eq('activa', true)
        .order('nombre')

      const procesadas = (escuelasData || []).map((escuela: any) => {
        const actualizacionesOrdenadas = (escuela.actualizaciones || [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        const ultima = actualizacionesOrdenadas[0]
        const problemasAbiertos = (escuela.problemas || []).filter((p: any) => !p.resuelto).length
        const materiales = escuela.materiales?.[0]

        let diasSinActualizar = null
        if (ultima) {
          const diff = new Date().getTime() - new Date(ultima.created_at).getTime()
          diasSinActualizar = Math.floor(diff / (1000 * 60 * 60 * 24))
        }

        return { ...escuela, ultima, problemasAbiertos, diasSinActualizar, materiales }
      })

      setEscuelas(procesadas)
      setLoading(false)
    }
    cargarDatos()
  }, [router])

  function getEstadoBadge(escuela: any) {
    if (escuela.problemasAbiertos > 0) return <span className="badge-problema">⚠️ {escuela.problemasAbiertos} problema{escuela.problemasAbiertos > 1 ? 's' : ''}</span>
    if (!escuela.ultima || escuela.diasSinActualizar > 7) return <span className="badge-regular">Sin actualizar</span>
    if (escuela.ultima.estado === 'bien') return <span className="badge-bien">Al día ✓</span>
    if (escuela.ultima.estado === 'regular') return <span className="badge-regular">Regular</span>
    return <span className="badge-mal">Necesita atención</span>
  }

  function CheckIcon({ value }: { value: boolean }) {
    return (
      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${value ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-300'}`}>
        {value ? '✓' : '—'}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-3">🌱</span>
          <p className="text-neutral-500 text-sm">Cargando resumen...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50">

      <nav className="w-full px-6 py-4 bg-white shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <span className="font-bold text-primary-600 text-lg leading-none block">EspaciosVerdes</span>
              <span className="text-xs text-neutral-400 leading-none">Resumen general</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="btn-secondary text-sm py-2">
              🖨️ Imprimir
            </button>
            <Link href="/dashboard/admin" className="text-sm text-neutral-500 hover:text-neutral-700">
              ← Volver
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-neutral-900">Resumen general de escuelas</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {escuelas.length} escuelas activas · Generado el {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-600 text-white">
                  <th className="text-left px-4 py-3 font-semibold">Escuela</th>
                  <th className="text-left px-4 py-3 font-semibold">Localidad</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs">Taller</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs">Semillas</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs">Herramientas</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs">Certificación</th>
                  <th className="text-center px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {escuelas.map((escuela, i) => (
                  <tr key={escuela.id} className={`border-t border-neutral-100 hover:bg-neutral-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/admin/escuelas/${escuela.id}`} className="font-medium text-neutral-800 hover:text-primary-600 transition-colors">
                        {escuela.nombre}
                      </Link>
                      {escuela.diasSinActualizar !== null && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Hace {escuela.diasSinActualizar} día{escuela.diasSinActualizar !== 1 ? 's' : ''}
                        </p>
                      )}
                      {escuela.diasSinActualizar === null && (
                        <p className="text-xs text-neutral-400 mt-0.5">Sin actualizaciones</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{escuela.localidad}</td>
                    <td className="px-3 py-3 text-center"><CheckIcon value={escuela.materiales?.taller_capacitacion} /></td>
                    <td className="px-3 py-3 text-center"><CheckIcon value={escuela.materiales?.semillas} /></td>
                    <td className="px-3 py-3 text-center"><CheckIcon value={escuela.materiales?.herramientas} /></td>
                    <td className="px-3 py-3 text-center"><CheckIcon value={escuela.materiales?.certificacion} /></td>
                    <td className="px-4 py-3 text-center">{getEstadoBadge(escuela)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          nav { display: none !important; }
          body { background: white !important; }
          .shadow-card { box-shadow: none !important; }
        }
      `}</style>

    </main>
  )
}