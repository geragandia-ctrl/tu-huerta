// app/layout.tsx
// Layout raíz — envuelve todas las páginas de la aplicación

import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
let metadataBase: URL | undefined
if (siteUrl) {
  try {
    metadataBase = new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`)
  } catch {
    metadataBase = undefined
  }
}

export const metadata = {
  title: 'EspaciosVerdes',
  description: 'Sistema de seguimiento de huertas escolares — Ministerio de Ambiente de Córdoba',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌱</text></svg>',
  },
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