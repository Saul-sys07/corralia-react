import { useState, useEffect } from 'react'
import api from '../services/api'

function Checador({ usuario }) {
  const [estado, setEstado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const cargarEstado = async () => {
    const r = await api.get('/checador/estado')
    setEstado(r.data)
  }

  useEffect(() => { cargarEstado() }, [])

  const registrarEntrada = async () => {
    setLoading(true)
    try {
      await api.post('/checador/entrada')
      setMensaje('✅ Entrada registrada')
      cargarEstado()
    } finally {
      setLoading(false)
    }
  }

  const registrarSalida = async () => {
    setLoading(true)
    try {
      await api.post('/checador/salida')
      setMensaje('✅ Salida registrada')
      cargarEstado()
    } finally {
      setLoading(false)
    }
  }

  if (!estado) return <p style={{ padding: '16px', color: '#888' }}>Cargando...</p>

  const ahora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '8px' }}>🐖</div>
      <h2 style={{ margin: '0 0 4px' }}>Corralia</h2>
      <p style={{ color: '#888', margin: '0 0 8px' }}>Rancho Yáñez — Atlacomulco</p>
      <p style={{ color: '#444', fontWeight: '600', margin: '0 0 24px' }}>
        {usuario.nombre} · {ahora}
      </p>

      {mensaje && (
        <div style={{
          background: '#f1f8e9', border: '1px solid #c5e1a5',
          borderRadius: '10px', padding: '12px', marginBottom: '20px',
          fontWeight: '600', color: '#2E7D32'
        }}>
          {mensaje}
        </div>
      )}

      {!estado.checo_entrada && (
        <div>
          <p style={{ color: '#888', marginBottom: '16px' }}>
            No has registrado tu entrada hoy
          </p>
          <button onClick={registrarEntrada} disabled={loading}
            style={{
              width: '100%', padding: '20px',
              background: loading ? '#ccc' : '#2E7D32',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '18px', fontWeight: '700', cursor: 'pointer'
            }}>
            {loading ? 'Registrando...' : '✅ Registrar Entrada'}
          </button>
        </div>
      )}

      {estado.checo_entrada && !estado.checo_salida && (
        <div>
          <div style={{
            background: '#f1f8e9', border: '2px solid #2E7D32',
            borderRadius: '10px', padding: '12px', marginBottom: '20px'
          }}>
            <p style={{ margin: 0, color: '#2E7D32', fontWeight: '600' }}>
              ✅ Entrada registrada hoy
            </p>
          </div>
          <button onClick={registrarSalida} disabled={loading}
            style={{
              width: '100%', padding: '20px',
              background: loading ? '#ccc' : '#C62828',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '18px', fontWeight: '700', cursor: 'pointer'
            }}>
            {loading ? 'Registrando...' : '🕐 Registrar Salida'}
          </button>
        </div>
      )}

      {estado.checo_entrada && estado.checo_salida && (
        <div style={{
          background: '#f1f8e9', border: '2px solid #2E7D32',
          borderRadius: '10px', padding: '20px'
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '24px' }}>✅</p>
          <p style={{ margin: 0, color: '#2E7D32', fontWeight: '700', fontSize: '16px' }}>
            Entrada y salida registradas hoy
          </p>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
            Hasta mañana {usuario.nombre}
          </p>
        </div>
      )}
    </div>
  )
}

export default Checador