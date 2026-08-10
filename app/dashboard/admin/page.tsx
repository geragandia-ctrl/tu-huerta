// app/dashboard/admin/page.tsx
// Panel principal del administrador del ministerio

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EstadoEscuelaBadge from '@/components/EstadoEscuelaBadge'
import PageLoading from '@/components/PageLoading'

type ProgramaChip = {
  id: string
  nombre: string
  icono: string | null
  orden: number
}

export default function DashboardAdmin() {
  const [escuelas, setEscuelas] = useState<any[]>([])
  const [programasDisponibles, setProgramasDisponibles] = useState<ProgramaChip[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'bien' | 'regular' | 'mal' | 'sin-actualizar'>('todas')
  const [filtroPrograma, setFiltroPrograma] = useState<string>('todos') // 'todos' | programa_id
  const router = useRouter()

  useEffect(() => {
    async function cargarDatos() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login/admin'); return }

      const { data: perfil } = await supabase
        .from('perfiles').select('rol').eq('id', user.id).single()
      if (!perfil || perfil.rol !== 'admin') { router.push('/login/admin'); return }

      // Catálogo de programas (para los chips de filtro)
      const { data: programasData } = await supabase
        .from('programas')
        .select('id, nombre, icono, orden')
        .order('orden')
      setProgramasDisponibles(programasData || [])

      // Escuelas con su seguimiento y sus inscripciones (programas)
      const { data: escuelasData } = await supabase
        .from('escuelas')
        .select(`
          *,
          actualizaciones(estado, created_at),
          problemas(id, resuelto),
          inscripciones ( activa, programas ( id, nombre, icono, orden ) )
        `)
        .eq('activa', true)
        .order('nombre')

      const escuelasProcesadas = (escuelasData || []).map((escuela: any) => {
        const actualizacionesOrdenadas = (escuela.actualizaciones || [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        const ultimaActualizacion = actualizacionesOrdenadas[0]
        const problemasAbiertos = (escuela.problemas || []).filter((p: any) => !p.resuelto).length

        let diasSinActualizar = null
        if (ultimaActualizacion) {
          const diff = new Date().getTime() - new Date(ultimaActualizacion.created_at).getTime()
          diasSinActualizar = Math.floor(diff / (1000 * 60 * 60 * 24))
        }

        // Lista de programas de esta institución (solo inscripciones activas)
        const programas: ProgramaChip[] = (escuela.inscripciones || [])
          .filter((i: any) => i.activa && i.programas)
          .map((i: any) => i.programas)
          .sort((a: any, b: any) => (a.orden ?? 999) - (b.orden ?? 999))

        return { ...escuela, ultimaActualizacion, problemasAbiertos, diasSinActualizar, programas }
      })

      escuelasProcesadas.sort((a: any, b: any) => {
        if (a.problemasAbiertos > 0 && b.problemasAbiertos === 0) return -1
        if (a.problemasAbiertos === 0 && b.problemasAbiertos > 0) return 1
        if (!a.ultimaActualizacion && b.ultimaActualizacion) return -1
        if (a.ultimaActualizacion && !b.ultimaActualizacion) return 1
        return 0
      })

      setEscuelas(escuelasProcesadas)
      setLoading(false)
    }
    cargarDatos()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const escuelasFiltradas = escuelas.filter(escuela => {
    const coincideBusqueda =
      escuela.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      escuela.localidad?.toLowerCase().includes(busqueda.toLowerCase())
    if (!coincideBusqueda) return false

    // Filtro por programa
    if (filtroPrograma !== 'todos') {
      const tienePrograma = escuela.programas?.some((p: ProgramaChip) => p.id === filtroPrograma)
      if (!tienePrograma) return false
    }

    // Filtro por estado
    if (filtroEstado === 'todas') return true
    if (filtroEstado === 'sin-actualizar') return !escuela.ultimaActualizacion || escuela.diasSinActualizar > 14
    return escuela.ultimaActualizacion?.estado === filtroEstado
  })

  const stats = {
    total: escuelas.length,
    alDia: escuelas.filter(e => e.diasSinActualizar !== null && e.diasSinActualizar <= 7).length,
    sinActualizar: escuelas.filter(e => !e.ultimaActualizacion || e.diasSinActualizar > 7).length,
    conProblemas: escuelas.filter(e => e.problemasAbiertos > 0).length,
  }

  if (loading) {
    return <PageLoading message="Cargando panel..." />
  }

  return (
    <main className="min-h-screen bg-neutral-50">

      <nav className="w-full px-4 sm:px-6 py-4 bg-white shadow-soft sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">🌱</span>
            <div className="min-w-0">
              <span className="font-bold text-primary-600 text-lg leading-none block truncate">
                EspaciosVerdes
              </span>
              <span className="text-xs text-neutral-400 leading-none">Panel Administrador</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end w-full sm:w-auto">
            <Link href="/dashboard/admin/escuelas/nueva" className="btn-primary text-sm py-2 px-3 sm:px-4 text-center shrink-0">
              + Nueva escuela
            </Link>
            <Link
              href="/dashboard/admin/resumen"
              className="btn-secondary text-sm py-2 px-3 sm:px-4 text-center shrink-0"
            >
              📊 Resumen
            </Link>
            <Link href="/dashboard/admin/gestion" className="btn-secondary text-sm py-2 px-3 sm:px-4 text-center shrink-0">
              ⚙️ Gestión
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-neutral-500 hover:text-neutral-700 px-2 py-2 shrink-0"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total escuelas', valor: stats.total, icon: '🏫', color: 'bg-white' },
            { label: 'Al día (últimos 7 días)', valor: stats.alDia, icon: '✅', color: 'bg-primary-50' },
            { label: 'Sin actualizar', valor: stats.sinActualizar, icon: '⏰', color: 'bg-yellow-50' },
            { label: 'Con problemas', valor: stats.conProblemas, icon: '⚠️', color: 'bg-orange-50' },
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} rounded-2xl p-5 shadow-soft border border-neutral-100`}>
              <span className="text-2xl block mb-2">{stat.icon}</span>
              <p className="text-2xl font-bold text-neutral-900">{stat.valor}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="card shadow-soft space-y-3">
          {/* Búsqueda + estado */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre o localidad..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="flex-1 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-2 flex-wrap">
              {[
                { valor: 'todas', label: 'Todas' },
                { valor: 'bien', label: '✅ Al día' },
                { valor: 'regular', label: '😐 Regular' },
                { valor: 'sin-actualizar', label: '⏰ Sin actualizar' },
                { valor: 'mal', label: '❌ Necesita atención' },
              ].map((f) => (
                <button
                  key={f.valor}
                  onClick={() => setFiltroEstado(f.valor as any)}
                  className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${filtroEstado === f.valor ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por programa */}
          <div className="flex gap-2 flex-wrap items-center border-t border-neutral-100 pt-3">
            <span className="text-xs text-neutral-400 mr-1">Programa:</span>
            <button
              onClick={() => setFiltroPrograma('todos')}
              className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${filtroPrograma === 'todos' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200'}`}>
              Todos
            </button>
            {programasDisponibles.map((prog) => (
              <button
                key={prog.id}
                onClick={() => setFiltroPrograma(prog.id)}
                className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${filtroPrograma === prog.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                {prog.icono} {prog.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de escuelas */}
        <div className="card shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-800">
              Escuelas ({escuelasFiltradas.length})
            </h2>
          </div>

          {escuelasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-neutral-400 text-sm">No se encontraron escuelas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {escuelasFiltradas.map((escuela) => (
                <Link
                  key={escuela.id}
                  href={`/dashboard/admin/escuelas/${escuela.id}`}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-neutral-50 hover:bg-primary-50 rounded-xl px-4 py-3 transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xl shrink-0">🌿</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 group-hover:text-primary-700">
                        {escuela.nombre}
                      </p>
                      <p className="text-xs text-neutral-400 line-clamp-2 sm:line-clamp-none">
                        {escuela.localidad}
                        {escuela.diasSinActualizar !== null
                          ? ` · Última actualización hace ${escuela.diasSinActualizar} día${escuela.diasSinActualizar !== 1 ? 's' : ''}`
                          : ' · Sin actualizaciones aún'}
                      </p>
                      {/* Badges de programas */}
                      {escuela.programas?.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1.5">
                          {escuela.programas.map((prog: ProgramaChip) => (
                            <span
                              key={prog.id}
                              className="text-xs bg-white border border-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full"
                            >
                              {prog.icono} {prog.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 self-start sm:self-center pl-9 sm:pl-0">
                    <EstadoEscuelaBadge
                      problemasAbiertos={escuela.problemasAbiertos}
                      ultima={escuela.ultimaActualizacion}
                      diasSinActualizar={escuela.diasSinActualizar}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}