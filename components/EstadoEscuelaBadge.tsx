export default function EstadoEscuelaBadge({
  problemasAbiertos,
  ultima,
  diasSinActualizar,
}: {
  problemasAbiertos: number
  ultima: { estado: string } | null | undefined
  diasSinActualizar: number | null
}) {
  if (problemasAbiertos > 0) {
    return (
      <span className="badge-problema whitespace-nowrap">
        ⚠️ {problemasAbiertos} problema{problemasAbiertos > 1 ? 's' : ''}
      </span>
    )
  }
  if (!ultima || diasSinActualizar === null || diasSinActualizar > 7) {
    return <span className="badge-regular">Sin actualizar</span>
  }
  if (ultima.estado === 'bien') return <span className="badge-bien">Al día ✓</span>
  if (ultima.estado === 'regular') return <span className="badge-regular">Regular</span>
  return <span className="badge-mal">Necesita atención</span>
}
