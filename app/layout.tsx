// app/layout.js
// Layout raíz — envuelve todas las páginas de la aplicación
// Define la fuente, metadata global y estructura base

import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

export const metadata = {
  title: 'Tu Huerta — Programa de Huertas Escolares',
  description: 'Sistema de seguimiento del Programa Tu Huerta. Ministerio de Ambiente y Economía Circular de Córdoba.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}