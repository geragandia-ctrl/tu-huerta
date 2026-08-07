// app/dashboard/admin/escuelas/nueva/page.tsx
// Formulario para que el admin cree una nueva escuela, elija sus programas
// y genere el acceso (usuario + contraseña inicial)

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { escuelaLoginAbsoluteUrl } from '@/lib/site-url'

// Tipo mínimo para los programas que traemos de la base
type Programa = {
  id: string
  nombre: string
  icono: string | null
  orden: number
}

export default function NuevaEscuela() {
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [localidad, setLocalidad] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [passwordInicial, setPasswordInicial] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  // Programas disponibles (traídos de la base) y los seleccionados
  const [programas, setProgramas] = useState<Programa[]>([])
  const [programasSeleccionados, setProgramasSeleccionados] = useState<string[]>([])

  const router = useRouter()

  // Cargar los programas disponibles al montar el componente
  useEffect(() => {
    async function cargarProgramas() {
      const supabase = createClient()
      const { data } = await supabase
        .from('programas')
        .select('id, nombre, icono, orden')
        .order('orden')
      setProgramas(data || [])
    }
    cargarProgramas()
  }, [])

  // Alternar la selección de un programa
  function togglePrograma(id: string) {
    setProgramasSeleccionados(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validación: al menos un programa
    if (programasSeleccionados.length === 0) {
      setError('Seleccioná al menos un programa para la institución.')
      setLoading(false)
      return
    }

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

    // Crear una inscripción por cada programa seleccionado
    const inscripciones = programasSeleccionados.map(programa_id => ({
      escuela_id: escuela.id,
      programa_id,
    }))
    const { error: errorInscripciones } = await supabase
      .from('inscripciones')
      .insert(inscripciones)

    if (errorInscripciones) {
      setError('La institución se creó pero hubo un error al asignar los programas.')
      setLoading(false)
      return
    }

    // Crear el acceso (usuario + contraseña) vía API server-side
    const resAcceso = await fetch('/api/admin/escuela-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email,
        escuelaId: escuela.id,
        password: passwordInicial || email,
      }),
    })
    const jsonAcceso = (await resAcceso.json()) as { error?: string }
    if (!resAcceso.ok) {
      setError(
        `Escuela creada, pero no se pudo crear el acceso (${jsonAcceso.error || resAcceso.statusText}).`
      )
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
          <h1 className="text-xl font-bold text-neutral-900 mb-2">¡Institución creada!</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Usá estas credenciales para que puedan ingresar y cambiar la contraseña en el primer acceso.
          </p>
          <div className="text-left bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-6">
            <p className="text-xs text-neutral-500 mb-2">Credenciales</p>
            <p className="text-sm">
              <span className="font-semibold">Usuario:</span> {email}
            </p>
            <p className="text-sm break-all">
              <span className="font-semibold">Contraseña inicial:</span> {passwordInicial || email}
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Login: <span className="font-medium">{escuelaLoginAbsoluteUrl() || 'https://espaciosverdes.app/login/escuela'}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                setExito(false)
                setNombre('')
                setEmail('')
                setPasswordInicial('')
                setDireccion('')
                setLocalidad('')
                setTelefono('')
                setProgramasSeleccionados([])
              }}
              className="btn-secondary text-sm py-2 w-full sm:w-auto text-center"
            >
              Agregar otra
            </button>
            <Link href="/dashboard/admin" className="btn-primary text-sm py-2 w-full sm:w-auto text-center">
              Volver al panel
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col pb-safe">

      {/* Navbar */}
      <nav className="w-full px-4 sm:px-6 py-4 bg-white shadow-soft sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 min-w-0">
          <Link href="/dashboard/admin" className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-primary-600 text-lg">EspaciosVerdes</span>
          </Link>
          <Link href="/dashboard/admin" className="text-sm text-neutral-500 hover:text-neutral-700">
            ← Volver
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="card shadow-card">

          <div className="mb-6">
            <h1 className="text-xl font-bold text-neutral-900">Nueva institución</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Se va a crear la institución, asignar sus programas y generar un acceso. En el primer ingreso deberán cambiar la contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nombre de la institución
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

            {/* Selector de programas */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Programas de la institución
              </label>
              <p className="text-xs text-neutral-400 mb-3">
                Seleccioná uno o más. Podés modificarlos más adelante.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {programas.map((programa) => {
                  const seleccionado = programasSeleccionados.includes(programa.id)
                  return (
                    <button
                      key={programa.id}
                      type="button"
                      onClick={() => togglePrograma(programa.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        seleccionado
                          ? 'bg-primary-50 border-primary-400'
                          : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-xl">{programa.icono}</span>
                      <span className={`flex-1 text-sm font-medium ${seleccionado ? 'text-primary-700' : 'text-neutral-600'}`}>
                        {programa.nombre}
                      </span>
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        seleccionado ? 'bg-primary-600 text-white' : 'bg-white border border-neutral-300 text-transparent'
                      }`}>
                        ✓
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email de contacto
              </label>
              <input
                type="email"
                value={email}
                onChange={e => {
                  const next = e.target.value
                  setEmail(next)
                  if (!passwordInicial) setPasswordInicial(next)
                }}
                placeholder="escuela123@ejemplo.com"
                required
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-neutral-400 mt-1">
                Usuario para ingresar (también queda guardado como email de contacto)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Contraseña inicial (sugerida)
              </label>
              <input
                type="text"
                value={passwordInicial || email}
                onChange={(e) => setPasswordInicial(e.target.value)}
                placeholder="Por defecto: el mismo email"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-neutral-400 mt-1">
                Recomendación: usá algo simple. La institución deberá cambiarla al primer ingreso.
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
              {loading ? 'Creando institución...' : 'Crear institución y generar acceso'}
            </button>

          </form>
        </div>
      </div>
    </main>
  )
}