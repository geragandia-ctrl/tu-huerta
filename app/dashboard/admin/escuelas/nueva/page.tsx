// app/dashboard/admin/escuelas/nueva/page.tsx
// Formulario para que el admin cree una nueva escuela y le envíe la invitación

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NuevaEscuela() {
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [localidad, setLocalidad] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Verificar que sea admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login/admin')
      return
    }

    // Crear la escuela
    const { data: escuela, error: errorEscuela } = await supabase
      .from('escuelas')
      .insert({ nombre, direccion, localidad, telefono, email_contacto: email })
      .select()
      .single()

    if (errorEscuela || !escuela) {
      setError('Error al crear la escuela')
      setLoading(false)
      return
    }

    // Crear registro de materiales vacío para la escuela
    await supabase.from('materiales').insert({ escuela_id: escuela.id })

    // Invitar al usuario por email
    const { error: errorInvite } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { escuela_id: escuela.id, rol: 'escuela' }
    })

    if (errorInvite) {
      setError('Escuela creada pero hubo un error al enviar la invitación. Podés invitarla manualmente desde Supabase.')
      setLoading(false)
      return
    }

    setExito(true)
    setLoading(false)
  }

  if (exito) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
        <div className="card shadow-card w-full max-w-md text-center">
          <span className="text-5xl block mb-4">✅</span>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">¡Escuela creada!</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Se envió una invitación por email a <strong>{email}</strong> para que configuren su acceso.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setExito(false); setNombre(''); setEmail(''); setDireccion(''); setLocalidad(''); setTelefono('') }}
              className="btn-secondary text-sm py-2">
              Agregar otra
            </button>
            <Link href="/dashboard/admin" className="btn-primary text-sm py-2">
              Volver al panel
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col">

      {/* Navbar */}
      <nav className="w-full px-6 py-4 bg-white shadow-soft sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/dashboard/admin" className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-primary-600 text-lg">EspaciosVerdes</span>
          </Link>
          <Link href="/dashboard/admin" className="text-sm text-neutral-500 hover:text-neutral-700">
            ← Volver
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto w-full px-6 py-8">
        <div className="card shadow-card">

          <div className="mb-6">
            <h1 className="text-xl font-bold text-neutral-900">Nueva escuela</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Se va a crear la escuela y enviar una invitación por email para que configuren su acceso
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nombre de la escuela
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Escuela Primaria Nº 123"
                required
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Localidad
                </label>
                <input
                  type="text"
                  value={localidad}
                  onChange={e => setLocalidad(e.target.value)}
                  placeholder="Córdoba Capital"
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="351-000-0000"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                placeholder="Av. Colón 1234"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email de contacto
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="escuela123@ejemplo.com"
                required
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-neutral-400 mt-1">
                A este email le va a llegar la invitación para acceder al sistema
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creando escuela...' : 'Crear escuela y enviar invitación'}
            </button>

          </form>
        </div>
      </div>
    </main>
  )
}