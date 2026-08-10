// app/dashboard/admin/resumen/page.tsx
// Vista resumen por programa.
// Se elige un programa arriba y se muestra la tabla de las instituciones
// inscriptas en él, con una columna por cada etapa de ese programa.

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EstadoEscuelaBadge from '@/components/EstadoEscuelaBadge'
import PageLoading from '@/components/PageLoading'

type Programa = {
  id: string
  nombre: string
  icono: string | null
  orden: number
}
type Etapa = {
  id: string
  nombre: string
  orden: number
}
// Fila de la tabla: una institución inscripta en el programa elegido
type FilaResumen = {
  escuelaId: string
  nombre: string
  localidad: string | null
  ultima: any
  diasSinActualizar: number | null
  problemasAbiertos: number
  completadas: Record<string, boolean> // key = etapa_id
}

export default function ResumenGeneral() {
  const [programas, setProgramas] = useState<Programa[]>([])
  const [programaActivo, setProgramaActivo] = useState<string>('')
  const [etapas, setEtapas] = useState<Etapa[]>([])
  const [filas, setFilas] = useState<FilaResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [cargandoTabla, setCargandoTabla] = useState(false)
  const router = useRouter()

  // Carga inicial: validar admin y traer los programas
  useEffect(() => {
    async function init() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login/admin'); return }

      const { data: perfil } = await supabase
        .from('perfiles').select('rol').eq('id', user.id).single()
      if (!perfil || perfil.rol !== 'admin') { router.push('/login/admin'); return }

      const { data: programasData } = await supabase
        .from('programas')
        .select('id, nombre, icono, orden')
        .order('orden')

      setProgramas(programasData || [])
      // Seleccionamos el primer programa por defecto
      if (programasData && programasData.length > 0) {
        setProgramaActivo(programasData[0].id)
      }
      setLoading(false)
    }
    init()
  }, [router])

  // Cada vez que cambia el programa activo, cargamos sus etapas y sus instituciones
  useEffect(() => {
    if (!programaActivo) return

    async function cargarTabla() {
      setCargandoTabla(true)
      const supabase = createClient()

      // Etapas del programa elegido (columnas de la tabla)
      const { data: etapasData } = await supabase
        .from('programa_etapas')
        .select('id, nombre, orden')
        .eq('programa_id', programaActivo)
        .order('orden')
      setEtapas(etapasData || [])

      // Inscripciones activas a ese programa, con la institución
      const { data: inscData } = await supabase
        .from('inscripciones')
        .select(`
          id,
          escuela_id,
          escuelas (
            id, nombre, localidad, activa,
            actualizaciones ( estado, created_at ),
            problemas ( id, resuelto )
          ),
          etapas_completadas ( etapa_id, completada )
        `)
        .eq('programa_id', programaActivo)
        .eq('activa', true)

      const filasArmadas: FilaResumen[] = (inscData || [])
        .filter((insc: any) => insc.escuelas?.activa) // solo instituciones activas
        .map((insc: any) => {
          const escuela = insc.escuelas

          const actualizacionesOrdenadas = (escuela.actualizaciones || [])
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          const ultima = actualizacionesOrdenadas[0]
          const problemasAbiertos = (escuela.problemas || []).filter((p: any) => !p.resuelto).length

          let diasSinActualizar: number | null = null
          if (ultima) {
            const diff = new Date().getTime() - new Date(ultima.created_at).getTime()
            diasSinActualizar = Math.floor(diff / (1000 * 60 * 60 * 24))
          }

          // Mapa etapa_id -> completada, para esta inscripción
          const completadas: Record<string, boolean> = {}
          for (const ec of insc.etapas_completadas || []) {
            completadas[ec.etapa_id] = ec.completada
          }

          return {
            escuelaId: escuela.id,
            nombre: escuela.nombre,
            localidad: escuela.localidad,
            ultima,
            diasSinActualizar,
            problemasAbiertos,
            completadas,
          }
        })

      // Ordenar alfabéticamente por nombre
      filasArmadas.sort((a, b) => a.nombre.localeCompare(b.nombre))
      setFilas(filasArmadas)
      setCargandoTabla(false)
    }

    cargarTabla()
  }, [programaActivo])

  function CheckIcon({ value }: { value: boolean }) {
    return (
      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${value ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-300'}`}>
        {value ? '✓' : '—'}
      </div>
    )
  }

  const programaSeleccionado = programas.find(p => p.id === programaActivo)

  if (loading) {
    return <PageLoading message="Cargando resumen..." />
  }

  return (
    <main className="min-h-screen bg-neutral-50">

      <nav className="w-full px-4 sm:px-6 py-4 bg-white shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">🌱</span>
            <div className="min-w-0">
              <span className="font-bold text-primary-600 text-lg leading-none block truncate">
                EspaciosVerdes
              </span>
              <span className="text-xs text-neutral-400 leading-none">Resumen por programa</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-secondary text-sm py-2 px-3 shrink-0"
            >
              🖨️ Imprimir
            </button>
            <Link
              href="/dashboard/admin"
              className="text-sm text-neutral-500 hover:text-neutral-700 px-2 py-2 shrink-0"
            >
              ← Volver
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Selector de programa */}
        <div className="mb-6 no-print">
          <div className="flex gap-2 flex-wrap">
            {programas.map((prog) => (
              <button
                key={prog.id}
                onClick={() => setProgramaActivo(prog.id)}
                className={`text-sm px-4 py-2 rounded-xl border font-medium transition-all ${programaActivo === prog.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}>
                {prog.icono} {prog.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-neutral-900">
            {programaSeleccionado?.icono} Resumen — {programaSeleccionado?.nombre}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {filas.length} institución{filas.length !== 1 ? 'es' : ''} inscripta{filas.length !== 1 ? 's' : ''} · Generado el {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Tabla */}
        {cargandoTabla ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <span className="text-3xl block mb-2">🌱</span>
            <p className="text-sm text-neutral-400">Cargando instituciones...</p>
          </div>
        ) : filas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-neutral-400 text-sm">No hay instituciones inscriptas en este programa todavía</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary-600 text-white">
                    <th className="text-left px-4 py-3 font-semibold">Institución</th>
                    <th className="text-left px-4 py-3 font-semibold">Localidad</th>
                    {etapas.map((etapa) => (
                      <th key={etapa.id} className="text-center px-3 py-3 font-semibold text-xs whitespace-nowrap">
                        {/* Nombre corto: primeras palabras de la etapa */}
                        {etapa.nombre.length > 22 ? etapa.nombre.slice(0, 20) + '…' : etapa.nombre}
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, i) => (
                    <tr key={fila.escuelaId} className={`border-t border-neutral-100 hover:bg-neutral-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/admin/escuelas/${fila.escuelaId}`} className="font-medium text-neutral-800 hover:text-primary-600 transition-colors">
                          {fila.nombre}
                        </Link>
                        {fila.diasSinActualizar !== null ? (
                          <p className="text-xs text-neutral-400 mt-0.5">
                            Hace {fila.diasSinActualizar} día{fila.diasSinActualizar !== 1 ? 's' : ''}
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-400 mt-0.5">Sin actualizaciones</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{fila.localidad}</td>
                      {etapas.map((etapa) => (
                        <td key={etapa.id} className="px-3 py-3 text-center">
                          <CheckIcon value={fila.completadas[etapa.id] || false} />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <EstadoEscuelaBadge
                          problemasAbiertos={fila.problemasAbiertos}
                          ultima={fila.ultima}
                          diasSinActualizar={fila.diasSinActualizar}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          nav { display: none !important; }
          .no-print { display: none !important; }
          body { background: white !important; }
          .shadow-card { box-shadow: none !important; }
        }
      `}</style>

    </main>
  )
}