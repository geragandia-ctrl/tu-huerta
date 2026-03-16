// app/page.tsx
// Landing pública del sistema Tu Huerta
// Página principal visible para todos — sin login requerido

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 font-sans">

      {/* ── NAVBAR ── */}
      <nav className="w-full px-6 py-4 flex items-center justify-between bg-white shadow-soft">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="font-bold text-primary-600 text-xl tracking-tight">Tu Huerta</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login/escuela" className="btn-secondary text-sm py-2 px-4">
            Ingresar como Escuela
          </Link>
          <Link href="/login/admin" className="btn-primary text-sm py-2 px-4">
            Ingresar como Admin
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12">
        
        {/* Texto principal */}
        <div className="flex-1 text-center lg:text-left">
          <span className="inline-block bg-primary-100 text-primary-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            Ministerio de Ambiente y Economía Circular · Córdoba
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight mb-6">
            Programa <span className="text-primary-600">Tu Huerta</span>
          </h1>
          <p className="text-lg text-neutral-600 mb-8 max-w-xl">
            Sistema de seguimiento de huertas agroecológicas escolares. 
            Registrá el avance de tu huerta, reportá problemas y accedé 
            a recursos técnicos desde cualquier dispositivo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link href="/login/escuela" className="btn-primary text-center">
              Acceso Escuelas
            </Link>
            <Link href="/login/admin" className="btn-secondary text-center">
              Acceso Administradores
            </Link>
          </div>
        </div>

        {/* Preview del sistema */}
        <div className="flex-1 w-full max-w-lg">
          <div className="card border border-neutral-100 overflow-hidden">
            
            {/* Barra superior simulada */}
            <div className="bg-primary-600 px-4 py-3 flex items-center gap-2 -mx-6 -mt-6 mb-6">
              <div className="w-3 h-3 rounded-full bg-white opacity-40"></div>
              <div className="w-3 h-3 rounded-full bg-white opacity-40"></div>
              <div className="w-3 h-3 rounded-full bg-white opacity-40"></div>
              <span className="text-white text-sm font-medium ml-2 opacity-80">
                Panel de seguimiento
              </span>
            </div>

            {/* Contenido simulado del dashboard */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-700">
                  Escuelas activas
                </span>
                <span className="badge-bien">247 activas</span>
              </div>

              {/* Lista simulada de escuelas */}
              {[
                { nombre: 'Escuela Nº 123 — Alta Córdoba', estado: 'bien' },
                { nombre: 'Escuela Nº 87 — Villa María', estado: 'regular' },
                { nombre: 'Escuela Nº 204 — Río Cuarto', estado: 'bien' },
              ].map((escuela, i) => (
                <div key={i} className="flex items-center justify-between bg-neutral-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🌿</span>
                    <span className="text-sm text-neutral-700">{escuela.nombre}</span>
                  </div>
                  <span className={escuela.estado === 'bien' ? 'badge-bien' : 'badge-regular'}>
                    {escuela.estado === 'bien' ? 'Al día' : 'Sin actualizar'}
                  </span>
                </div>
              ))}

              {/* Barra de progreso simulada */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>Escuelas con huerta activa</span>
                  <span>82%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-neutral-200 bg-white py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-neutral-400">
          <span>Programa Tu Huerta · Ministerio de Ambiente y Economía Circular · Córdoba</span>
          <span>Desarrollado por <a href="https://ggdesarrollos.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">GG Desarrollos</a></span>
        </div>
      </footer>

    </main>
  )
}