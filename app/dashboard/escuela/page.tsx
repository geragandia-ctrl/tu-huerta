// app/dashboard/escuela/page.tsx
// Dashboard principal de la escuela
// Muestra el estado de la huerta, checklist de materiales y actualizaciones

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardEscuela() {
  const [perfil, setPerfil] = useState<any>(null)
  const [escuela, setEscuela] = useState<any>(null)
  const [materiales, setMateriales] = useState<any>(null)
  const [actualizaciones, setActualizaciones] = useState<any[]>([])
  const [problemas, setProblemas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function cargarDatos() {
      const supabase = createClient()

      // Verificar sesión
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login/escuela')
        return
      }

      // Cargar perfil
      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('*, escuelas(*)')
        .eq('id', user.id)
        .single()

      if (!perfilData || perfilData.rol !== 'escuela') {
        router.push('/login/escuela')
        return
      }

      setPerfil(perfilData)
      setEscuela(perfilData.escuelas)

      // Cargar materiales
      const { data: materialesData } = await supabase
        .from('materiales')
        .select('*')
        .eq('escuela_id', perfilData.escuela_id)
        .single()

      setMateriales(materialesData)

      // Cargar últimas actualizaciones
      const { data: actualizacionesData } = await supabase
        .from('actualizaciones')
        .select('*')
        .eq('escuela_id', perfilData.escuela_id)
        .order('created_at', { ascending: false })
        .limit(3)

      setActualizaciones(actualizacionesData || [])

      // Cargar problemas abiertos
      const { data: problemasData } = await supabase
        .from('problemas')
        .select('*')
        .eq('escuela_id', perfilData.escuela_id)
        .eq('resuelto', false)

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

      {/* ── NAVBAR ── */}
      <nav className="w-full px-6 py-4 bg-white shadow-soft sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <span className="font-bold text-primary-600 text-lg leading-none block">EspaciosVerdes</span>
              <span className="text-xs text-neutral-400 leading-none">{escuela?.nombre}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-sm text-neutral-500 hover:text-neutral-700">
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── BIENVENIDA ── */}
        <div className="card shadow-card">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">
                Bienvenida, {escuela?.nombre} 👋
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                {escuela?.localidad} · {escuela?.direccion}
              </p>
            </div>
            <div className="flex gap-2">
              <a href="/dashboard/escuela/nueva-actualizacion" className="btn-primary text-sm py-2">
                + Nueva actualización
              </a>
              <a href="/dashboard/escuela/reportar-problema" className="btn-secondary text-sm py-2">
                Reportar problema
              </a>
            </div>
          </div>
        </div>

        {/* ── CHECKLIST DE MATERIALES ── */}
        <div className="card shadow-card">
          <h2 className="text-base font-semibold text-neutral-800 mb-4">
            📦 Materiales y etapas del programa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'taller_capacitacion', fecha: materiales?.taller_fecha, label: 'Taller de capacitación', icon: '📚' },
              { key: 'semillas', fecha: materiales?.semillas_fecha, label: 'Semillas de estación', icon: '🌾' },
              { key: 'herramientas', fecha: materiales?.herramientas_fecha, label: 'Kit de herramientas', icon: '🛠️' },
              { key: 'certificacion', fecha: materiales?.certificacion_fecha, label: 'Certificación', icon: '📜' },
            ].map((item) => {
              const recibido = materiales?.[item.key]
              return (
                <div key={item.key} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${recibido ? 'bg-primary-50 border-primary-200' : 'bg-neutral-50 border-neutral-200'}`}>
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-700">{item.label}</p>
                    {recibido && item.fecha && (
                      <p className="text-xs text-neutral-400">{new Date(item.fecha).toLocaleDateString('es-AR')}</p>
                    )}
                  </div>
                  <span className={recibido ? 'badge-bien' : 'badge-regular'}>
                    {recibido ? 'Recibido' : 'Pendiente'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── ÚLTIMAS ACTUALIZACIONES ── */}
          <div className="card shadow-card">
            <h2 className="text-base font-semibold text-neutral-800 mb-4">
              📸 Últimas actualizaciones
            </h2>
            {actualizaciones.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">🌱</span>
                <p className="text-sm text-neutral-400">Todavía no cargaste ninguna actualización</p>
                <a href="/dashboard/escuela/nueva-actualizacion" className="btn-primary text-sm py-2 mt-4 inline-block">
                  Cargar primera actualización
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {actualizaciones.map((act) => (
                  <div key={act.id} className="flex items-center justify-between bg-neutral-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm text-neutral-700 line-clamp-1">{act.descripcion}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {new Date(act.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <span className={act.estado === 'bien' ? 'badge-bien' : act.estado === 'regular' ? 'badge-regular' : 'badge-mal'}>
                      {act.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PROBLEMAS ABIERTOS ── */}
          <div className="card shadow-card">
            <h2 className="text-base font-semibold text-neutral-800 mb-4">
              ⚠️ Problemas reportados
            </h2>
            {problemas.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">✅</span>
                <p className="text-sm text-neutral-400">Sin problemas activos. ¡Bien!</p>
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
      <span className="badge-problema flex-shrink-0">Abierto</span>
    </div>
    {prob.respuesta_admin && (
      <div className="px-4 py-3 bg-primary-50 border-t border-primary-100">
        <p className="text-xs font-semibold text-primary-700 mb-1">Respuesta del ministerio:</p>
        <p className="text-xs text-primary-800">{prob.respuesta_admin}</p>
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