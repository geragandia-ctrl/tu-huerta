// app/dashboard/admin/escuelas/[id]/page.tsx
// Vista detalle de una escuela específica para el administrador

'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'


export default function DetalleEscuela({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [escuela, setEscuela] = useState<any>(null)
  const [materiales, setMateriales] = useState<any>(null)
  const [actualizaciones, setActualizaciones] = useState<any[]>([])
  const [problemas, setProblemas] = useState<any[]>([])
  const [respuestas, setRespuestas] = useState<{ [key: string]: string }>({})
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

      const { data: materialesData } = await supabase
        .from('materiales').select('*').eq('escuela_id', id).single()
      setMateriales(materialesData)

      const { data: actualizacionesData } = await supabase
        .from('actualizaciones')
        .select('*, fotos(*)')
        .eq('escuela_id', id)
        .order('created_at', { ascending: false })
      setActualizaciones(actualizacionesData || [])

      const { data: problemasData } = await supabase
        .from('problemas').select('*')
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

  async function toggleMaterial(campo: string, valor: boolean) {
    const supabase = createClient()
    const update: any = { [campo]: !valor }
    if (!valor) update[`${campo}_fecha`] = new Date().toISOString().split('T')[0]
    await supabase.from('materiales').update(update).eq('escuela_id', id)
    setMateriales((prev: any) => ({ ...prev, ...update }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-3">🌱</span>
          <p className="text-neutral-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50">

      <nav className="w-full px-6 py-4 bg-white shadow-soft sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard/admin" className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <span className="font-bold text-primary-600 text-lg leading-none block">EspaciosVerdes</span>
              <span className="text-xs text-neutral-400 leading-none">Panel Administrador</span>
            </div>
          </Link>
          <Link href="/dashboard/admin" className="text-sm text-neutral-500 hover:text-neutral-700">
            ← Volver al panel
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

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

        {/* Materiales */}
        <div className="card shadow-card">
          <h2 className="text-base font-semibold text-neutral-800 mb-1">📦 Materiales y etapas</h2>
          <p className="text-xs text-neutral-400 mb-4">Marcá lo que ya fue entregado a la escuela</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'taller_capacitacion', label: 'Taller de capacitación', icon: '📚' },
              { key: 'semillas', label: 'Semillas de estación', icon: '🌾' },
              { key: 'herramientas', label: 'Kit de herramientas', icon: '🛠️' },
              { key: 'certificacion', label: 'Certificación', icon: '📜' },
            ].map((item) => {
              const entregado = materiales?.[item.key]
              const fecha = materiales?.[`${item.key}_fecha`]
              return (
                <button
                  key={item.key}
                  onClick={() => toggleMaterial(item.key, entregado)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-soft ${entregado ? 'bg-primary-50 border-primary-200' : 'bg-neutral-50 border-neutral-200'}`}>
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-700">{item.label}</p>
                    {entregado && fecha && (
                      <p className="text-xs text-neutral-400">{new Date(fecha).toLocaleDateString('es-AR')}</p>
                    )}
                  </div>
                  <span className={entregado ? 'badge-bien' : 'badge-regular'}>
                    {entregado ? '✓ Entregado' : 'Pendiente'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Problemas */}
          <div className="card shadow-card">
            <h2 className="text-base font-semibold text-neutral-800 mb-4">⚠️ Problemas reportados</h2>
            {problemas.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">✅</span>
                <p className="text-sm text-neutral-400">Sin problemas reportados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {problemas.map((prob) => (
                  <div key={prob.id} className={`rounded-xl border overflow-hidden ${prob.resuelto ? 'opacity-60' : ''}`}>
                    
                    {/* Problema */}
                    <div className={`px-4 py-3 ${prob.resuelto ? 'bg-neutral-50 border-neutral-200' : 'bg-orange-50 border-orange-100'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-700">{prob.tipo}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{prob.descripcion}</p>
                          <p className="text-xs text-neutral-400 mt-1">{new Date(prob.created_at).toLocaleDateString('es-AR')}</p>
                        </div>
                        <button
                          onClick={() => toggleProblema(prob.id, prob.resuelto)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${prob.resuelto ? 'bg-neutral-200 text-neutral-600' : 'bg-primary-600 text-white hover:bg-primary-500'}`}>
                          {prob.resuelto ? 'Reabrir' : 'Resolver'}
                        </button>
                      </div>
                    </div>

                    {/* Respuesta existente */}
                    {prob.respuesta_admin && (
                      <div className="px-4 py-3 bg-primary-50 border-t border-primary-100">
                        <p className="text-xs font-semibold text-primary-700 mb-1">Respuesta del ministerio:</p>
                        <p className="text-xs text-primary-800">{prob.respuesta_admin}</p>
                      </div>
                    )}

                    {/* Campo para responder */}
                    {!prob.resuelto && (
                      <div className="px-4 py-3 bg-white border-t border-neutral-100">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Escribir respuesta a la escuela..."
                            value={respuestas[prob.id] || ''}
                            onChange={e => setRespuestas(prev => ({ ...prev, [prob.id]: e.target.value }))}
                            className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            onClick={() => enviarRespuesta(prob.id)}
                            className="btn-primary text-xs py-2 px-3 flex-shrink-0">
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actualizaciones */}
          <div className="card shadow-card">
            <h2 className="text-base font-semibold text-neutral-800 mb-4">📸 Historial de actualizaciones</h2>
            {actualizaciones.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">🌱</span>
                <p className="text-sm text-neutral-400">Sin actualizaciones aún</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {actualizaciones.map((act) => (
                  <div key={act.id} className="bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-neutral-400">{new Date(act.created_at).toLocaleDateString('es-AR')}</p>
                      <span className={act.estado === 'bien' ? 'badge-bien' : act.estado === 'regular' ? 'badge-regular' : 'badge-mal'}>
                        {act.estado}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700">{act.descripcion}</p>
                    {act.fotos?.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {act.fotos.map((foto: any) => (
                          <a key={foto.id} href={foto.url} target="_blank" rel="noopener noreferrer">
                            <img src={foto.url} alt="foto huerta" className="w-16 h-16 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}