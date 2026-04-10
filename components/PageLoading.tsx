export default function PageLoading({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
      <div className="text-center">
        <span className="text-4xl block mb-3">🌱</span>
        <p className="text-neutral-500 text-sm">{message}</p>
      </div>
    </div>
  )
}
