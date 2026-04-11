import { NextResponse } from 'next/server'

/** En producción no devolvemos detalles internos al cliente. */
export function jsonInternalError(e: unknown): NextResponse {
  const dev = process.env.NODE_ENV !== 'production'
  const message = dev && e instanceof Error ? e.message : 'Error interno'
  return NextResponse.json({ error: message }, { status: 500 })
}
