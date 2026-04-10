// app/dashboard/admin/gestion/page.tsx
// Gestión de escuelas — activar/desactivar y reenvío de invitaciones

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageLoading from '@/components/PageLoading'
import { escuelaLoginAbsoluteUrl } from '@/lib/site-url'

export default function GestionEscuelas() {
  const [escuelas, setEscuelas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | 'activas' | 'inactivas'>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [reenvios, setReenvios] = useState<{
    [key: string]: 'idle' | 'loading' | 'ok_invite' | 'ok_reset' | 'error'
  }>({})
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
    const redirectTo = escuelaLoginAbsoluteUrl()
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, redirectTo }),
    })
    const json = (await res.json()) as {
      error?: string
      mode?: 'invite' | 'password_reset'
    }
    if (!res.ok) {
      console.error('Reenviar invitación:', json.error || res.statusText)
      setReenvios(prev => ({ ...prev, [id]: 'error' }))
    } else {
      const next =
        json.mode === 'password_reset' ? 'ok_reset' : 'ok_invite'
      setReenvios(prev => ({ ...prev, [id]: next }))
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
    return <PageLoading />
  }

  return (
    <main className="min-h-screen bg-neutral-50">

      <nav className="w-full px-4 sm:px-6 py-4 bg-white shadow-soft sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">🌱</span>
            <div className="min-w-0">
              <span className="font-bold text-primary-600 text-lg leading-none block truncate">
                EspaciosVerdes
              </span>
              <span className="text-xs text-neutral-400 leading-none">Gestión de escuelas</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
            <Link href="/dashboard/admin/escuelas/nueva" className="btn-primary text-sm py-2 px-3 shrink-0 text-center">
              + Nueva escuela
            </Link>
            <Link
              href="/dashboard/admin"
              className="text-sm text-neutral-500 hover:text-neutral-700 px-2 py-2 shrink-0"
            >
              ← Volver
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

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
                <div
                  key={escuela.id}
                  className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 px-4 py-3 rounded-xl border ${
                    escuela.activa ? 'bg-neutral-50 border-neutral-100' : 'bg-neutral-100 border-neutral-200 opacity-70'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 sm:truncate">{escuela.nombre}</p>
                    <p className="text-xs text-neutral-400 break-all sm:break-normal">
                      {escuela.localidad} · {escuela.email_contacto}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:flex-shrink-0 w-full sm:w-auto">
                    <span
                      className={`self-start sm:self-center ${escuela.activa ? 'badge-bien' : 'badge-mal'}`}
                    >
                      {escuela.activa ? 'Activa' : 'Inactiva'}
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => reenviarInvitacion(escuela.id, escuela.email_contacto)}
                        disabled={estadoReenvio === 'loading'}
                        aria-label="Reenviar invitación por email"
                        className={`text-xs px-3 py-2 rounded-lg transition-all text-center sm:text-left ${
                          estadoReenvio === 'ok_invite' || estadoReenvio === 'ok_reset'
                            ? 'bg-primary-100 text-primary-700'
                            : estadoReenvio === 'error'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                        }`}
                      >
                        <span className="sm:hidden">
                          {estadoReenvio === 'loading'
                            ? 'Enviando...'
                            : estadoReenvio === 'ok_invite'
                              ? '✓ Invitación enviada'
                              : estadoReenvio === 'ok_reset'
                                ? '✓ Mail de acceso'
                                : estadoReenvio === 'error'
                                  ? 'Error'
                                  : '📧 Reenviar'}
                        </span>
                        <span className="hidden sm:inline">
                          {estadoReenvio === 'loading'
                            ? 'Enviando...'
                            : estadoReenvio === 'ok_invite'
                              ? '✓ Invitación enviada'
                              : estadoReenvio === 'ok_reset'
                                ? '✓ Mail de acceso enviado (ya tenía cuenta)'
                                : estadoReenvio === 'error'
                                  ? 'Error'
                                  : '📧 Reenviar invitación'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActiva(escuela.id, escuela.activa)}
                        className="text-xs px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-200 text-neutral-600 transition-all text-center sm:text-left"
                      >
                        {escuela.activa ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
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