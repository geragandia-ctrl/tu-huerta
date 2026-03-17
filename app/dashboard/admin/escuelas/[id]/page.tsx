// app/dashboard/admin/escuelas/[id]/page.tsx
// Vista detalle de una escuela específica para el administrador

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DetalleEscuela({ params }: { params: { id: string } }) {
  const [escuela, setEscuela] = useState<any>(null)
  const [materiales, setMateriales] = useState<any>(null)
  const [actualizaciones, setActualizaciones] = useState<any[]>([])
  const [problemas, setProblemas] = useState<any[]>([])
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

      // Cargar escuela
      const { data: escuelaData } = await supabase
        .from('escuelas').select('*').eq('id', params.id).single()
      setEscuela(escuelaData)

      // Cargar materiales
      const { data: materialesData } = await supabase
        .from('materiales').select('*').eq('escuela_id', params.id).single()
      setMateriales(materialesData)

      // Cargar actualizaciones con fotos
      const { data: actualizacionesData } = await supabase
        .from('actualizaciones')
        .select('*, fotos(*)')
        .eq('escuela_id', params.id)
        .order('created_at', { ascending: false })
      setActualizaciones(actualizacionesData || [])

      // Cargar problemas
      const { data: problemasData } = await supabase
        .from('problemas').select('*')
        .eq('escuela_id', params.id)
        .order('created_at', { ascending: false })
      setProblemas(problemasData || [])

      setLoading(false)
    }
    cargarDatos()
  }, [params.id, router])

  async function toggleProblema(id: string, resuelto: boolean) {
    const supabase = createClient()
    await supabase.from('problemas').update({ resuelto: !resuelto }).eq('id', id)
    setProblemas(prev => prev.map(p => p.id === id ? { ...p, resuelto: !resuelto } : p))
  }

  async function toggleMaterial(campo: string, valor: boolean) {
    const supabase = createClient()
    const update: any = { [campo]: !valor }
    if (!valor) update[`${campo}_fecha`] = new Date().toISOString().split('T')[0]
    await supabase.from('materiales').update(update).eq('escuela_id', params.id)
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

      {/* Navbar */}
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

        {/* Encabezado escuela */}
        <div className="card shadow-card">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{escuela?.nombre}</h1>
              <p className="text-sm text-neutral-500 mt-1">
                {escuela?.localidad} · {escuela?.direccion}
              </p>
              <p className="text-sm text-neutral-500">{escuela?.email_contacto} · {escuela?.telefono}</p>
            </div>
            <span className={escuela?.activa ? 'badge-bien' : 'badge-mal'}>
              {escuela?.activa ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        {/* Materiales */}
        <div className="card shadow-card">
          <h2 className="text-base font-semibold text-neutral-800 mb-4">📦 Materiales y etapas</h2>
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
                <button
                  key={item.key}
                  onClick={() => toggleMaterial(item.key, recibido)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-soft ${recibido ? 'bg-primary-50 border-primary-200' : 'bg-neutral-50 border-neutral-200'}`}>
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-700">{item.label}</p>
                    {recibido && fecha && (
                      <p className="text-xs text-neutral-400">{new Date(fecha).toLocaleDateString('es-AR')}</p>
                    )}
                  </div>
                  <span className={recibido ? 'badge-bien' : 'badge-regular'}>
                    {recibido ? '✓ Recibido' : 'Pendiente'}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-neutral-400 mt-3">Hacé click en cada item para marcar como recibido</p>
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
              <div className="space-y-3">
                {problemas.map((prob) => (
                  <div key={prob.id} className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border ${prob.resuelto ? 'bg-neutral-50 border-neutral-200 opacity-60' : 'bg-orange-50 border-orange-100'}`}>
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