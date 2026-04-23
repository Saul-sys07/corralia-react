import { useState } from 'react'
import api from '../services/api'

const TIPOS_ANIMAL = [
  'Semental', 'Pie de Cría', 'Crías', 'Destete',
  'Desarrollo', 'Engorda', 'Herniados', 'Desecho'
]

const SUSTITUTOS = ['Desarrollo', 'Engorda']

function getEtapasDestino(tipoActual) {
  const idx = TIPOS_ANIMAL.indexOf(tipoActual)
  const siguientes = idx >= 0 ? TIPOS_ANIMAL.slice(idx + 1) : []
  if (SUSTITUTOS.includes(tipoActual)) {
    return ['Semental', 'Pie de Cría', ...siguientes]
  }
  return siguientes
}

function Etapa({ corral, usuario, onVolver }) {
  const tipos = corral.tipo_animal?.split(' / ').map(t => t.trim()).filter(t => t !== 'VACIO') || []
  const [tipoAnimal, setTipoAnimal] = useState(tipos[0] || '')
  const [nuevaEtapa, setNuevaEtapa] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const disponible = corral.poblacion_actual || 0
  const etapasDestino = getEtapasDestino(tipoAnimal)

  const handleConfirmar = async () => {
    if (!nuevaEtapa || cantidad < 1) return
    setLoading(true)
    setError('')
    try {
      await api.post('/etapa', {
        id_chiquero: corral.id,
        tipo_animal: tipoAnimal,
        nueva_etapa: nuevaEtapa,
        cantidad
      })
      onVolver(true)
    } catch (e) {
      setError('Error al cambiar etapa')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <button onClick={() => onVolver(false)} style={{
        background: 'none', border: 'none', color: '#1976D2',
        fontSize: '16px', cursor: 'pointer', marginBottom: '16px'
      }}>← Regresar</button>

      <h2 style={{ margin: '0 0 4px' }}>📦 Cambiar Etapa</h2>
      <p style={{ color: '#888', margin: '0 0 4px' }}>{corral.nombre} · {corral.zona}</p>
      <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 20px' }}>
        El animal se queda en el mismo corral, solo cambia su etapa
      </p>

      {/* Tipo animal */}
      {tipos.length > 1 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Etapa actual:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tipos.map(t => (
              <button key={t} onClick={() => { setTipoAnimal(t); setNuevaEtapa('') }}
                style={chipStyle(tipoAnimal === t, '#6A1B9A')}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nueva etapa */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Nueva etapa:</label>
        {etapasDestino.length === 0 ? (
          <p style={{ color: '#C62828' }}>No hay etapas disponibles para {tipoAnimal}</p>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {etapasDestino.map(e => (
              <button key={e} onClick={() => setNuevaEtapa(e)}
                style={chipStyle(nuevaEtapa === e, '#6A1B9A')}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cantidad */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Cantidad (máx {disponible}):</label>
        <input type="number" min={1} max={disponible} value={cantidad}
          onChange={e => setCantidad(Number(e.target.value))}
          style={inputStyle} />
      </div>

      {error && <p style={{ color: '#C62828', marginBottom: '12px' }}>{error}</p>}

      <button onClick={handleConfirmar}
        disabled={loading || !nuevaEtapa || cantidad < 1 || cantidad > disponible}
        style={{
          width: '100%', padding: '14px',
          background: loading || !nuevaEtapa ? '#ccc' : '#6A1B9A',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Cambiando...' : `Cambiar ${cantidad} ${tipoAnimal} → ${nuevaEtapa || '...'}`}
      </button>
    </div>
  )
}

const labelStyle = { display: 'block', fontWeight: '600', marginBottom: '8px', color: '#444' }
const inputStyle = { width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }
const chipStyle = (activo, color) => ({
  padding: '8px 14px', borderRadius: '20px', cursor: 'pointer',
  border: activo ? `2px solid ${color}` : '2px solid #ddd',
  background: activo ? `${color}15` : 'white',
  color: activo ? color : '#666',
  fontWeight: activo ? '700' : '400', fontSize: '13px'
})

export default Etapa