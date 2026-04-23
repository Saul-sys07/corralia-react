import { useState } from 'react'
import api from '../services/api'

const CAUSAS = [
  'Hernia', 'Aplastamiento', 'Diarrea', 'Neumonía',
  'Desnutrición', 'Causa desconocida', 'Otra'
]

function Muerte({ corral, usuario, onVolver }) {
  const tipos = corral.tipo_animal?.split(' / ').map(t => t.trim()) || []
  const [tipoAnimal, setTipoAnimal] = useState(tipos[0] || '')
  const [cantidad, setCantidad] = useState(1)
  const [causa, setCausa] = useState(CAUSAS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const disponible = corral.poblacion_actual || 0

  const handleConfirmar = async () => {
    if (cantidad < 1 || cantidad > disponible) return
    setLoading(true)
    setError('')
    try {
      await api.post('/muerte', {
        id_chiquero: corral.id,
        tipo_animal: tipoAnimal,
        cantidad,
        causa
      })
      onVolver(true) // true = recargar mapa
    } catch (e) {
      setError('Error al registrar muerte')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <button onClick={() => onVolver(false)} style={{
        background: 'none', border: 'none', color: '#1976D2',
        fontSize: '16px', cursor: 'pointer', marginBottom: '16px'
      }}>← Regresar</button>

      <h2 style={{ margin: '0 0 4px' }}>💀 Registrar Muerte</h2>
      <p style={{ color: '#888', margin: '0 0 20px' }}>
        {corral.nombre} · {corral.zona}
      </p>

      {/* Tipo de animal */}
      {tipos.length > 1 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Tipo de animal:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tipos.map(t => (
              <button key={t} onClick={() => setTipoAnimal(t)}
                style={chipStyle(tipoAnimal === t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cantidad */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Cantidad (máx {disponible}):</label>
        <input
          type="number" min={1} max={disponible}
          value={cantidad}
          onChange={e => setCantidad(Number(e.target.value))}
          style={inputStyle}
        />
      </div>

      {/* Causa */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Causa:</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CAUSAS.map(c => (
            <button key={c} onClick={() => setCausa(c)}
              style={chipStyle(causa === c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && <p style={{ color: '#C62828', marginBottom: '12px' }}>{error}</p>}

      <button
        onClick={handleConfirmar}
        disabled={loading || cantidad < 1 || cantidad > disponible}
        style={{
          width: '100%', padding: '14px',
          background: loading ? '#ccc' : '#C62828',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}
      >
        {loading ? 'Registrando...' : `Confirmar muerte de ${cantidad} ${tipoAnimal}`}
      </button>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontWeight: '600',
  marginBottom: '8px', color: '#444'
}

const inputStyle = {
  width: '100%', padding: '12px', fontSize: '16px',
  border: '1px solid #ddd', borderRadius: '8px',
  boxSizing: 'border-box'
}

const chipStyle = (activo) => ({
  padding: '8px 14px', borderRadius: '20px', cursor: 'pointer',
  border: activo ? '2px solid #C62828' : '2px solid #ddd',
  background: activo ? '#ffebee' : 'white',
  color: activo ? '#C62828' : '#666',
  fontWeight: activo ? '700' : '400',
  fontSize: '13px'
})

export default Muerte