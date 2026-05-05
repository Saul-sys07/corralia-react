import { useState, useRef } from 'react'
import api from '../services/api'

function Monta({ corral, usuario, onVolver }) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [fotoBase64, setFotoBase64] = useState(null)
  const [mostrarCamara, setMostrarCamara] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const lote = corral.lote_id

  const abrirCamara = async () => {
    setMostrarCamara(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (e) {
      setMostrarCamara(false)
    }
  }

  const tomarFoto = () => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1]
    streamRef.current?.getTracks().forEach(t => t.stop())
    setMostrarCamara(false)
    setFotoBase64(base64)
  }

  const cancelarFoto = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setMostrarCamara(false)
  }

  const confirmar = async () => {
    if (!corral.lote_id) {
      setError('No se encontró el lote de pie de cría')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/monta', {
        lote_id: corral.lote_id,
        fecha_monta: fecha,
        foto_base64: fotoBase64 || null
      })
      onVolver(true)
    } catch (e) {
      setError('Error al registrar monta')
      setLoading(false)
    }
  }

  if (mostrarCamara) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 12px' }}>📸 Foto de la puerca</h3>
        <video ref={videoRef} autoPlay playsInline
          style={{ width: '100%', borderRadius: '12px', marginBottom: '12px', maxHeight: '400px', objectFit: 'cover' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={tomarFoto} style={{
            flex: 1, padding: '14px', background: '#2E7D32',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: '700', cursor: 'pointer'
          }}>📸 Tomar foto</button>
          <button onClick={cancelarFoto} style={{
            flex: 1, padding: '14px', background: '#f0f0f0',
            color: '#555', border: 'none', borderRadius: '10px',
            fontSize: '16px', cursor: 'pointer'
          }}>Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <button onClick={() => onVolver(false)} style={{
        background: 'none', border: 'none', color: '#1976D2',
        fontSize: '16px', cursor: 'pointer', marginBottom: '16px'
      }}>← Regresar</button>

      <h2 style={{ margin: '0 0 4px' }}>🐷 Registrar Monta</h2>
      <p style={{ color: '#888', margin: '0 0 20px' }}>{corral.nombre} · {corral.zona}</p>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Fecha de monta:</label>
        <input type="date" value={fecha}
          onChange={e => setFecha(e.target.value)}
          style={inputStyle} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Foto de la puerca (opcional):</label>
        {fotoBase64 ? (
          <div>
            <img src={`data:image/jpeg;base64,${fotoBase64}`} alt="puerca"
              style={{ width: '100%', borderRadius: '10px', maxHeight: '200px', objectFit: 'cover', marginBottom: '8px' }} />
            <button onClick={() => setFotoBase64(null)} style={{
              background: 'none', border: '1px solid #ddd', borderRadius: '8px',
              padding: '6px 12px', cursor: 'pointer', fontSize: '13px', color: '#666'
            }}>🗑️ Quitar foto</button>
          </div>
        ) : (
          <button onClick={abrirCamara} style={{
            width: '100%', padding: '14px', background: '#f5f5f5',
            border: '2px dashed #ddd', borderRadius: '10px',
            cursor: 'pointer', fontSize: '14px', color: '#666'
          }}>📷 Tomar foto</button>
        )}
      </div>

      {error && <p style={{ color: '#C62828', marginBottom: '12px' }}>{error}</p>}

      <button onClick={confirmar} disabled={loading}
        style={{
          width: '100%', padding: '14px',
          background: loading ? '#ccc' : '#00695C',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Registrando...' : '🐷 Confirmar Monta'}
      </button>
    </div>
  )
}

const labelStyle = { display: 'block', fontWeight: '600', marginBottom: '8px', color: '#444' }
const inputStyle = { width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }

export default Monta