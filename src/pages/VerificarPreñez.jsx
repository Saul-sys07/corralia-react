import { useState } from 'react'
import api from '../services/api'

function VerificarPreñez({ corral, usuario, onVolver }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async (confirmaPreñez) => {
    if (!corral.lote_id) {
      setError('No se encontró el lote')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/monta/verificar', {
        lote_id: corral.lote_id,
        confirma_preñez: confirmaPreñez
      })
      onVolver(true)
    } catch (e) {
      setError('Error al registrar verificación')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <button onClick={() => onVolver(false)} style={{
        background: 'none', border: 'none', color: '#1976D2',
        fontSize: '16px', cursor: 'pointer', marginBottom: '16px'
      }}>← Regresar</button>

      <h2 style={{ margin: '0 0 4px' }}>🔍 Verificar Preñez</h2>
      <p style={{ color: '#888', margin: '0 0 8px' }}>{corral.nombre} · {corral.zona}</p>
      <p style={{ color: '#E65100', marginBottom: '24px', fontWeight: '600' }}>
        Han pasado 21 días desde la monta — ¿la puerca confirmó preñez?
      </p>

      {corral.foto_pie_cria && (
        <img src={corral.foto_pie_cria} alt="puerca"
          style={{ width: '100%', borderRadius: '10px', maxHeight: '200px', objectFit: 'cover', marginBottom: '20px' }} />
      )}

      {error && <p style={{ color: '#C62828', marginBottom: '12px' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={() => confirmar(true)} disabled={loading}
          style={{
            width: '100%', padding: '16px',
            background: loading ? '#ccc' : '#2E7D32',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: '700', cursor: 'pointer'
          }}>
          ✅ No regresó a calor — continúa gestación
        </button>
        <button onClick={() => confirmar(false)} disabled={loading}
          style={{
            width: '100%', padding: '16px',
            background: loading ? '#ccc' : '#C62828',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: '700', cursor: 'pointer'
          }}>
          ❌ Regresó a calor — volver a Disponible
        </button>
      </div>
    </div>
  )
}

export default VerificarPreñez