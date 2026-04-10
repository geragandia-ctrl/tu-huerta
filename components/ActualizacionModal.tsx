'use client'

export type ActualizacionModalData = {
  created_at: string
  estado: string
  descripcion: string
  fotos?: { id: string; url: string }[]
}

export default function ActualizacionModal({
  actualizacion,
  onClose,
}: {
  actualizacion: ActualizacionModalData | null
  onClose: () => void
}) {
  if (!actualizacion) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-hover max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="actualizacion-modal-title"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="min-w-0">
              <p id="actualizacion-modal-title" className="text-xs text-neutral-400">
                {new Date(actualizacion.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <span
                className={`mt-1 inline-block ${
                  actualizacion.estado === 'bien'
                    ? 'badge-bien'
                    : actualizacion.estado === 'regular'
                      ? 'badge-regular'
                      : 'badge-mal'
                }`}
              >
                {actualizacion.estado === 'bien'
                  ? '😊 Bien'
                  : actualizacion.estado === 'regular'
                    ? '😐 Regular'
                    : '😟 Mal'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 text-2xl leading-none shrink-0"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-neutral-700 mb-4 break-words">{actualizacion.descripcion}</p>
          {actualizacion.fotos && actualizacion.fotos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-500 mb-2">FOTOS</p>
              <div className="grid grid-cols-2 gap-2">
                {actualizacion.fotos.map((foto) => (
                  <a key={foto.id} href={foto.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={foto.url}
                      alt="foto huerta"
                      className="w-full h-36 object-cover rounded-xl hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
