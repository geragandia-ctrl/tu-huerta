// app/dashboard/escuela/page.tsx
// Dashboard principal de la escuela

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardEscuela() {
  const [escuela, setEscuela] = useState<any>(null)
  const [materiales, setMateriales] = useState<any>(null)
  const [actualizaciones, setActualizaciones] = useState<any[]>([])
  const [problemas, setProblemas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalActualizacion, setModalActualizacion] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function cargarDatos() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login/escuela'); return }

      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('*, escuelas(*)')
        .eq('id', user.id)
        .single()

      if (!perfilData || perfilData.rol !== 'escuela') { router.push('/login/escuela'); return }

      setEscuela(perfilData.escuelas)

      const { data: materialesData } = await supabase
        .from('materiales').select('*').eq('escuela_id', perfilData.escuela_id).single()
      setMateriales(materialesData)

      const { data: actualizacionesData } = await supabase
        .from('actualizaciones')
        .select('*, fotos(*)')
        .eq('escuela_id', perfilData.escuela_id)
        .order('created_at', { ascending: false })
        .limit(5)
      setActualizaciones(actualizacionesData || [])

      const { data: problemasData } = await supabase
        .from('problemas')
        .select('*, fotos_problemas(*)')
        .eq('escuela_id', perfilData.escuela_id)
        .eq('resuelto', false)
        .order('created_at', { ascending: false })
      setProblemas(problemasData || [])

      setLoading(false)
    }
    cargarDatos()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-3">🌱</span>
          <p className="text-neutral-500 text-sm">Cargando tu huerta...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50">

      {/* Modal actualizacion */}
      {modalActualizacion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalActualizacion(null)}>
          <div className="bg-white rounded-2xl shadow-hover max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-neutral-400">{new Date(modalActualizacion.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <span className={`mt-1 inline-block ${modalActualizacion.estado === 'bien' ? 'badge-bien' : modalActualizacion.estado === 'regular' ? 'badge-regular' : 'badge-mal'}`}>
                    {modalActualizacion.estado === 'bien' ? '😊 Bien' : modalActualizacion.estado === 'regular' ? '😐 Regular' : '😟 Mal'}
                  </span>
                </div>
                <button onClick={() => setModalActualizacion(null)} className="text-neutral-400 hover:text-neutral-600 text-2xl leading-none">×</button>
              </div>
              <p className="text-sm text-neutral-700 mb-4">{modalActualizacion.descripcion}</p>
              {modalActualizacion.fotos?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 mb-2">FOTOS</p>
                  <div className="grid grid-cols-2 gap-2">
                    {modalActualizacion.fotos.map((foto: any) => (
                      <a key={foto.id} href={foto.url} target="_blank" rel="noopener noreferrer">
                        <img src={foto.url} alt="foto huerta" className="w-full h-36 object-cover rounded-xl hover:opacity-90 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="w-full px-6 py-4 bg-white shadow-soft sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <span className="font-bold text-primary-600 text-lg leading-none block">EspaciosVerdes</span>
              <span className="text-xs text-neutral-400 leading-none">{escuela?.nombre}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-sm text-neutral-500 hover:text-neutral-700">Cerrar sesión</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Bienvenida */}
        <div className="card shadow-card">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Bienvenida 👋</h1>
              <p className="text-sm text-neutral-500 mt-1">{escuela?.localidad} · {escuela?.direccion}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/escuela/nueva-actualizacion" className="btn-primary text-sm py-2">+ Nueva actualización</Link>
              <Link href="/dashboard/escuela/reportar-problema" className="btn-secondary text-sm py-2">Reportar problema</Link>
            </div>
          </div>
        </div>

        {/* Materiales */}
        <div className="card shadow-card">
          <h2 className="text-base font-semibold text-neutral-800 mb-4">📦 Materiales y etapas del programa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'taller_capacitacion', label: 'Taller de capacitación', icon: '📚' },
              { key: 'semillas', label: 'Semillas de estación', icon: '🌾' },
              { key: 'herramientas', label: 'Kit de herramientas', icon: '🛠️' },
              { key: 'certificacion', label: 'Certificación', icon: '📜' },
            ].map((item) => {
              const recibido = materiales?.[item.key]
              const fecha = materiales?.[`${item.key}_fecha`]
              return (
                <div key={item.key} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${recibido ? 'bg-primary-50 border-primary-200' : 'bg-neutral-50 border-neutral-200'}`}>
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-700">{item.label}</p>
                    {recibido && fecha && <p className="text-xs text-neutral-400">{new Date(fecha).toLocaleDateString('es-AR')}</p>}
                  </div>
                  <span className={recibido ? 'badge-bien' : 'badge-regular'}>{recibido ? 'Recibido ✓' : 'Pendiente'}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Actualizaciones */}
          <div className="card shadow-card">
            <h2 className="text-base font-semibold text-neutral-800 mb-4">📸 Mis actualizaciones</h2>
            {actualizaciones.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">🌱</span>
                <p className="text-sm text-neutral-400">Todavía no cargaste ninguna actualización</p>
                <Link href="/dashboard/escuela/nueva-actualizacion" className="btn-primary text-sm py-2 mt-4 inline-block">Cargar primera actualización</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {actualizaciones.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setModalActualizacion(act)}
                    className="w-full flex items-center justify-between bg-neutral-50 hover:bg-primary-50 rounded-xl px-4 py-3 transition-colors group cursor-pointer text-left">
                    <div>
                      <p className="text-sm text-neutral-700 line-clamp-1 group-hover:text-primary-700">{act.descripcion}</p>
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
                ))}
              </div>
            )}
          </div>

          {/* Problemas */}
          <div className="card shadow-card">
            <h2 className="text-base font-semibold text-neutral-800 mb-4">⚠️ Casos abiertos</h2>
            {problemas.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">✅</span>
                <p className="text-sm text-neutral-400">Sin casos abiertos. ¡Todo bien!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {problemas.map((prob) => (
                  <div key={prob.id} className="rounded-xl border border-orange-100 overflow-hidden">
                    <div className="flex items-start justify-between gap-2 bg-orange-50 px-4 py-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-700">{prob.tipo}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{prob.descripcion}</p>
                        <p className="text-xs text-neutral-400 mt-1">{new Date(prob.created_at).toLocaleDateString('es-AR')}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700 flex-shrink-0">En revisión</span>
                    </div>
                    {prob.respuesta_admin && (
                      <div className="px-4 py-3 bg-primary-50 border-t border-primary-100">
                        <p className="text-xs font-semibold text-primary-700 mb-1">Respuesta del ministerio:</p>
                        <p className="text-xs text-primary-800">{prob.respuesta_admin}</p>
                      </div>
                    )}
                    {prob.fotos_problemas?.length > 0 && (
                      <div className="px-4 py-3 bg-white border-t border-neutral-100">
                        <div className="flex gap-2 flex-wrap">
                          {prob.fotos_problemas.map((foto: any) => (
                            <a key={foto.id} href={foto.url} target="_blank" rel="noopener noreferrer">
                              <img src={foto.url} alt="foto problema" className="w-16 h-16 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
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