// app/layout.tsx
// Layout raíz — envuelve todas las páginas de la aplicación

import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Tu Huerta — Programa de Huertas Escolares',
  description:
    'Sistema de seguimiento del Programa Tu Huerta. Ministerio de Ambiente y Economía Circular de Córdoba.',
}

export const viewport: Viewport = {
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}