// app/dashboard/admin/gestion/page.tsx
// Gestión de escuelas — activar/desactivar y reenvío de invitaciones

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function GestionEscuelas() {
  const [escuelas, setEscuelas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | 'activas' | 'inactivas'>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [reenvios, setReenvios] = useState<{ [key: string]: 'idle' | 'loading' | 'ok' | 'error' }>({})
  const router = useRouter()

  useEffect(() => {
    cargarEscuelas()
  }, [])

  async function cargarEscuelas() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login/admin'); return }

    const { data: perfil } = await supabase
      .from('perfiles').select('rol').eq('id', user.id).single()
    if (!perfil || perfil.rol !== 'admin') { router.push('/login/admin'); return }

    const { data } = await supabase
      .from('escuelas')
      .select('*')
      .order('nombre')

    setEscuelas(data || [])
    setLoading(false)
  }

  async function toggleActiva(id: string, activa: boolean) {
    const supabase = createClient()
    await supabase.from('escuelas').update({ activa: !activa }).eq('id', id)
    setEscuelas(prev => prev.map(e => e.id === id ? { ...e, activa: !activa } : e))
  }

  async function reenviarInvitacion(id: string, email: string) {
    setReenvios(prev => ({ ...prev, [id]: 'loading' }))
    const supabase = createClient()
    const { error } = await supabase.auth.admin.inviteUserByEmail(email)
    if (error) {
      setReenvios(prev => ({ ...prev, [id]: 'error' }))
    } else {
      setReenvios(prev => ({ ...prev, [id]: 'ok' }))
    }
    setTimeout(() => setReenvios(prev => ({ ...prev, [id]: 'idle' })), 3000)
  }

  const escuelasFiltradas = escuelas.filter(e => {
    const coincide = e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.localidad?.toLowerCase().includes(busqueda.toLowerCase())
    if (!coincide) return false
    if (filtro === 'activas') return e.activa
    if (filtro === 'inactivas') return !e.activa
    return true
  })

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
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <span className="font-bold text-primary-600 text-lg leading-none block">EspaciosVerdes</span>
              <span className="text-xs text-neutral-400 leading-none">Gestión de escuelas</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin/escuelas/nueva" className="btn-primary text-sm py-2">
              + Nueva escuela
            </Link>
            <Link href="/dashboard/admin" className="text-sm text-neutral-500 hover:text-neutral-700">
              ← Volver
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', valor: escuelas.length, color: 'bg-white' },
            { label: 'Activas', valor: escuelas.filter(e => e.activa).length, color: 'bg-primary-50' },
            { label: 'Inactivas', valor: escuelas.filter(e => !e.activa).length, color: 'bg-neutral-100' },
          ].map((s, i) => (
            <div key={i} className={`${s.color} rounded-2xl p-4 shadow-soft border border-neutral-100 text-center`}>
              <p className="text-2xl font-bold text-neutral-900">{s.valor}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="card shadow-soft">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre o localidad..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="flex-1 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-2">
              {[
                { valor: 'todas', label: 'Todas' },
                { valor: 'activas', label: '✅ Activas' },
                { valor: 'inactivas', label: '⭕ Inactivas' },
              ].map(f => (
                <button
                  key={f.valor}
                  onClick={() => setFiltro(f.valor as any)}
                  className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${filtro === f.valor ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="card shadow-card space-y-2">
          <h2 className="text-base font-semibold text-neutral-800 mb-4">
            Escuelas ({escuelasFiltradas.length})
          </h2>
          {escuelasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-neutral-400 text-sm">No se encontraron escuelas</p>
            </div>
          ) : (
            escuelasFiltradas.map((escuela) => {
              const estadoReenvio = reenvios[escuela.id] || 'idle'
              return (
                <div key={escuela.id} className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border ${escuela.activa ? 'bg-neutral-50 border-neutral-100' : 'bg-neutral-100 border-neutral-200 opacity-70'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{escuela.nombre}</p>
                    <p className="text-xs text-neutral-400">{escuela.localidad} · {escuela.email_contacto}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={escuela.activa ? 'badge-bien' : 'badge-mal'}>
                      {escuela.activa ? 'Activa' : 'Inactiva'}
                    </span>
                    <button
                      onClick={() => reenviarInvitacion(escuela.id, escuela.email_contacto)}
                      disabled={estadoReenvio === 'loading'}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${estadoReenvio === 'ok' ? 'bg-primary-100 text-primary-700' : estadoReenvio === 'error' ? 'bg-red-100 text-red-600' : 'bg-primary-50 text-primary-600 hover:bg-primary-100'}`}>
                      {estadoReenvio === 'loading' ? 'Enviando...' : estadoReenvio === 'ok' ? '✓ Enviado' : estadoReenvio === 'error' ? 'Error' : '📧 Reenviar invitación'}
                    </button>
                    <button
                      onClick={() => toggleActiva(escuela.id, escuela.activa)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-200 text-neutral-600 transition-all">
                      {escuela.activa ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </main>
  )
}