// app/dashboard/admin/escuelas/[id]/page.tsx
// Vista detalle de una institución para el administrador
// Muestra un bloque por cada programa en el que está inscripta, con sus
// etapas propias y el tilde de completadas. Reemplaza la sección fija de
// "materiales" por el modelo multi-programa.

'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ActualizacionModal from '@/components/ActualizacionModal'
import PageLoading from '@/components/PageLoading'

// --- Tipos del modelo multi-programa ---
type Etapa = {
  id: string
  nombre: string
  orden: number
}
type EtapaCompletada = {
  etapa_id: string
  completada: boolean
  fecha: string | null
}
type InscripcionVista = {
  inscripcionId: string
  programaId: string
  programaNombre: string
  programaIcono: string | null
  programaOrden: number
  etapas: Etapa[]
  completadas: Record<string, EtapaCompletada> // key = etapa_id
}

export default function DetalleEscuela({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [escuela, setEscuela] = useState<any>(null)
  const [inscripciones, setInscripciones] = useState<InscripcionVista[]>([])
  const [actualizaciones, setActualizaciones] = useState<any[]>([])
  const [problemas, setProblemas] = useState<any[]>([])
  const [respuestas, setRespuestas] = useState<{ [key: string]: string }>({})
  const [modalActualizacion, setModalActualizacion] = useState<any>(null)
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

      const { data: escuelaData } = await supabase
        .from('escuelas').select('*').eq('id', id).single()
      setEscuela(escuelaData)

      // --- Cargar inscripciones de la institución, con programa + etapas + completadas ---
      // 1) inscripciones activas de esta institución, con datos del programa
      const { data: inscData } = await supabase
        .from('inscripciones')
        .select(`
          id,
          programa_id,
          programas ( id, nombre, icono, orden )
        `)
        .eq('escuela_id', id)
        .eq('activa', true)

      const inscripcionesVista: InscripcionVista[] = []

      for (const insc of inscData || []) {
        const programa: any = insc.programas

        // 2) etapas del programa
        const { data: etapasData } = await supabase
          .from('programa_etapas')
          .select('id, nombre, orden')
          .eq('programa_id', insc.programa_id)
          .order('orden')

        // 3) etapas completadas de esta inscripción
        const { data: completadasData } = await supabase
          .from('etapas_completadas')
          .select('etapa_id, completada, fecha')
          .eq('inscripcion_id', insc.id)

        // Armo un mapa etapa_id -> completada para acceso rápido
        const completadasMap: Record<string, EtapaCompletada> = {}
        for (const c of completadasData || []) {
          completadasMap[c.etapa_id] = c
        }

        inscripcionesVista.push({
          inscripcionId: insc.id,
          programaId: insc.programa_id,
          programaNombre: programa?.nombre || 'Programa',
          programaIcono: programa?.icono || '🌱',
          programaOrden: programa?.orden ?? 999,
          etapas: etapasData || [],
          completadas: completadasMap,
        })
      }

      // Ordeno los bloques por el orden del programa
      inscripcionesVista.sort((a, b) => a.programaOrden - b.programaOrden)
      setInscripciones(inscripcionesVista)

      const { data: actualizacionesData } = await supabase
        .from('actualizaciones')
        .select('*, fotos(*), programas(nombre, icono)')
        .eq('escuela_id', id)
        .order('created_at', { ascending: false })
      setActualizaciones(actualizacionesData || [])

      const { data: problemasData } = await supabase
        .from('problemas')
        .select('*, fotos_problemas(*), programas(nombre, icono)')
        .eq('escuela_id', id)
        .order('created_at', { ascending: false })
      setProblemas(problemasData || [])

      setLoading(false)
    }
    cargarDatos()
  }, [id, router])

  async function toggleProblema(probId: string, resuelto: boolean) {
    const supabase = createClient()
    await supabase.from('problemas').update({ resuelto: !resuelto }).eq('id', probId)
    setProblemas(prev => prev.map(p => p.id === probId ? { ...p, resuelto: !resuelto } : p))
  }

  async function enviarRespuesta(probId: string) {
    const respuesta = respuestas[probId]
    if (!respuesta?.trim()) return
    const supabase = createClient()
    await supabase.from('problemas').update({ respuesta_admin: respuesta }).eq('id', probId)
    setProblemas(prev => prev.map(p => p.id === probId ? { ...p, respuesta_admin: respuesta } : p))
    setRespuestas(prev => ({ ...prev, [probId]: '' }))
  }

  // Tilda / destilda una etapa de una inscripción concreta.
  // Usa upsert sobre etapas_completadas: crea la fila si no existía.
  async function toggleEtapa(
    inscripcionId: string,
    etapaId: string,
    completadaActual: boolean
  ) {
    const supabase = createClient()
    const nuevoValor = !completadaActual
    const fecha = nuevoValor ? new Date().toISOString().split('T')[0] : null

    const { error } = await supabase
      .from('etapas_completadas')
      .upsert(
        {
          inscripcion_id: inscripcionId,
          etapa_id: etapaId,
          completada: nuevoValor,
          fecha,
        },
        { onConflict: 'inscripcion_id,etapa_id' }
      )

    if (error) return

    // Actualizo el estado local para reflejar el cambio sin recargar
    setInscripciones(prev =>
      prev.map(insc => {
        if (insc.inscripcionId !== inscripcionId) return insc
        return {
          ...insc,
          completadas: {
            ...insc.completadas,
            [etapaId]: { etapa_id: etapaId, completada: nuevoValor, fecha },
          },
        }
      })
    )
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <ActualizacionModal
        actualizacion={modalActualizacion}
        onClose={() => setModalActualizacion(null)}
      />

      {/* Navbar */}
      <nav className="w-full px-4 sm:px-6 py-4 bg-white shadow-soft sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard/admin" className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">🌱</span>
            <div className="min-w-0">
              <span className="font-bold text-primary-600 text-lg leading-none block truncate">
                EspaciosVerdes
              </span>
              <span className="text-xs text-neutral-400 leading-none">Panel Administrador</span>
            </div>
          </Link>
          <Link
            href="/dashboard/admin"
            className="text-sm text-neutral-500 hover:text-neutral-700 shrink-0"
          >
            ← Volver al panel
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Encabezado */}
        <div className="card shadow-card">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{escuela?.nombre}</h1>
              <p className="text-sm text-neutral-500 mt-1">{escuela?.localidad} · {escuela?.direccion}</p>
              <p className="text-sm text-neutral-500">{escuela?.email_contacto} · {escuela?.telefono}</p>
            </div>
            <span className={escuela?.activa ? 'badge-bien' : 'badge-mal'}>
              {escuela?.activa ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        {/* Programas y etapas — un bloque por cada programa inscripto */}
        {inscripciones.length === 0 ? (
          <div className="card shadow-card">
            <h2 className="text-base font-semibold text-neutral-800 mb-1">📦 Programas y etapas</h2>
            <p className="text-sm text-neutral-400 mt-2">
              Esta institución no tiene programas asignados.
            </p>
          </div>
        ) : (
          inscripciones.map((insc) => (
            <div key={insc.inscripcionId} className="card shadow-card">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{insc.programaIcono}</span>
                <h2 className="text-base font-semibold text-neutral-800">{insc.programaNombre}</h2>
              </div>
              <p className="text-xs text-neutral-400 mb-4">Marcá las etapas completadas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insc.etapas.map((etapa) => {
                  const comp = insc.completadas[etapa.id]
                  const completada = comp?.completada || false
                  const fecha = comp?.fecha
                  return (
                    <button
                      key={etapa.id}
                      onClick={() => toggleEtapa(insc.inscripcionId, etapa.id, completada)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-soft ${completada ? 'bg-primary-50 border-primary-200' : 'bg-neutral-50 border-neutral-200'}`}>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-700">{etapa.nombre}</p>
                        {completada && fecha && (
                          <p className="text-xs text-neutral-400">{new Date(fecha).toLocaleDateString('es-AR')}</p>
                        )}
                      </div>
                      <span className={completada ? 'badge-bien' : 'badge-regular'}>
                        {completada ? '✓ Completada' : 'Pendiente'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Problemas */}
          <div className="card shadow-card flex flex-col min-h-[280px] max-h-[min(70vh,520px)]">
            <h2 className="text-base font-semibold text-neutral-800 mb-4 flex-shrink-0">⚠️ Casos reportados</h2>
            <div className="overflow-y-auto flex-1 min-h-0 space-y-4 pr-1">
              {problemas.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-2">✅</span>
                  <p className="text-sm text-neutral-400">Sin casos reportados</p>
                </div>
              ) : (
                problemas.map((prob) => (
                  <div key={prob.id} className={`rounded-xl border overflow-hidden ${prob.resuelto ? 'opacity-60' : ''}`}>
                    <div className={`px-4 py-3 ${prob.resuelto ? 'bg-neutral-50 border-neutral-200' : 'bg-orange-50'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-neutral-700">{prob.tipo}</p>
                            {prob.programas && (
                              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                {prob.programas.icono} {prob.programas.nombre}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">{prob.descripcion}</p>
                          <p className="text-xs text-neutral-400 mt-1">{new Date(prob.created_at).toLocaleDateString('es-AR')}</p>
                        </div>
                        <button
                          onClick={() => toggleProblema(prob.id, prob.resuelto)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${prob.resuelto ? 'bg-neutral-200 text-neutral-600' : 'bg-primary-600 text-white hover:bg-primary-500'}`}>
                          {prob.resuelto ? 'Reabrir caso' : 'Marcar resuelto'}
                        </button>
                      </div>
                    </div>
                    {prob.fotos_problemas?.length > 0 && (
                      <div className="px-4 py-3 bg-white border-t border-neutral-100">
                        <p className="text-xs font-semibold text-neutral-500 mb-2">FOTOS</p>
                        <div className="flex gap-2 flex-wrap">
                          {prob.fotos_problemas.map((foto: any) => (
                            <a key={foto.id} href={foto.url} target="_blank" rel="noopener noreferrer">
                              <img src={foto.url} alt="foto problema" className="w-16 h-16 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {prob.respuesta_admin && (
                      <div className="px-4 py-3 bg-primary-50 border-t border-primary-100">
                        <p className="text-xs font-semibold text-primary-700 mb-1">Tu respuesta:</p>
                        <p className="text-xs text-primary-800">{prob.respuesta_admin}</p>
                      </div>
                    )}
                    {!prob.resuelto && (
                      <div className="px-4 py-3 bg-white border-t border-neutral-100">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                          <input
                            type="text"
                            placeholder="Escribir respuesta a la escuela..."
                            value={respuestas[prob.id] || ''}
                            onChange={(e) =>
                              setRespuestas((prev) => ({ ...prev, [prob.id]: e.target.value }))
                            }
                            className="w-full sm:flex-1 min-w-0 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => enviarRespuesta(prob.id)}
                            className="btn-primary text-xs py-2.5 px-4 w-full sm:w-auto shrink-0"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actualizaciones */}
          <div className="card shadow-card flex flex-col min-h-[280px] max-h-[min(70vh,520px)]">
            <h2 className="text-base font-semibold text-neutral-800 mb-4 flex-shrink-0">📸 Historial de actualizaciones</h2>
            <div className="overflow-y-auto flex-1 min-h-0 space-y-2 pr-1">
              {actualizaciones.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-2">🌱</span>
                  <p className="text-sm text-neutral-400">Sin actualizaciones aún</p>
                </div>
              ) : (
                actualizaciones.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setModalActualizacion(act)}
                    className="w-full flex items-center justify-between bg-neutral-50 hover:bg-primary-50 rounded-xl px-4 py-3 transition-colors group cursor-pointer text-left">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-neutral-700 line-clamp-1 group-hover:text-primary-700">{act.descripcion}</p>
                        {act.programas && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full shrink-0">
                            {act.programas.icono} {act.programas.nombre}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {new Date(act.created_at).toLocaleDateString('es-AR')}
                        {act.fotos?.length > 0 && <span className="ml-2">📷 {act.fotos.length} foto{act.fotos.length > 1 ? 's' : ''}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={act.estado === 'bien' ? 'badge-bien' : act.estado === 'regular' ? 'badge-regular' : 'badge-mal'}>
                        {act.estado}
                      </span>
                      <span className="text-neutral-300 group-hover:text-primary-400 text-lg">›</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}