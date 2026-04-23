import { useState } from 'react'
import api from '../services/api'

function Parto({ corral, usuario, onVolver }) {
  const [criasVivas, setCriasVivas] = useState(0)
  const [noLogradas, setNoLogradas] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalNacidos = criasVivas + noLogradas

  const handleConfirmar = async () => {
    if (totalNacidos === 0) {
      setError('Registra al menos una cría')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/parto', {
        id_chiquero: corral.id,
        crias_vivas: criasVivas,
        no_logradas: noLogradas
      })
      onVolver(true)
    } catch (e) {
      setError('Error al registrar parto')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <button onClick={() => onVolver(false)} style={{
        background: 'none', border: 'none', color: '#1976D2',
        fontSize: '16px', cursor: 'pointer', marginBottom: '16px'
      }}>← Regresar</button>

      <h2 style={{ margin: '0 0 4px' }}>🍼 Registrar Parto</h2>
      <p style={{ color: '#888', margin: '0 0 20px' }}>{corral.nombre} · {corral.zona}</p>

      {/* Crías vivas */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Crías nacidas vivas:</label>
        <input type="number" min={0} value={criasVivas}
          onChange={e => setCriasVivas(Number(e.target.value))}
          style={inputStyle} />
      </div>

      {/* No logradas */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>No logradas:</label>
        <input type="number" min={0} value={noLogradas}
          onChange={e => setNoLogradas(Number(e.target.value))}
          style={inputStyle} />
      </div>

      {/* Resumen */}
      {totalNacidos > 0 && (
        <div style={{
          background: '#f1f8e9', border: '1px solid #c5e1a5',
          borderRadius: '8px', padding: '12px', marginBottom: '20px'
        }}>
          <p style={{ margin: '0 0 4px', fontWeight: '600' }}>Resumen del parto:</p>
          <p style={{ margin: '0', color: '#2E7D32' }}>✅ {criasVivas} crías vivas</p>
          {noLogradas > 0 && (
            <p style={{ margin: '4px 0 0', color: '#C62828' }}>❌ {noLogradas} no logradas</p>
          )}
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
            Total nacidos: {totalNacidos}
          </p>
        </div>
      )}

      {error && <p style={{ color: '#C62828', marginBottom: '12px' }}>{error}</p>}

      <button onClick={handleConfirmar}
        disabled={loading || totalNacidos === 0}
        style={{
          width: '100%', padding: '14px',
          background: loading || totalNacidos === 0 ? '#ccc' : '#E65100',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Registrando...' : 'Confirmar parto'}
      </button>
    </div>
  )
}

const labelStyle = { display: 'block', fontWeight: '600', marginBottom: '8px', color: '#444' }
const inputStyle = { width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }

export default Parto