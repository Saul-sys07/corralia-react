import { useState } from 'react'
import api from '../services/api'

function PrimerAcceso({ usuario, tokenTemporal, onActivar }) {
  const [pin, setPin] = useState('')
  const [confirma, setConfirma] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const activar = async () => {
    if (pin.length < 4) { setError('El PIN debe tener al menos 4 dígitos'); return }
    if (pin !== confirma) { setError('Los PINes no coinciden'); return }
    setLoading(true)
    setError('')
    try {
      const respActivar = await fetch('https://web-production-7c992.up.railway.app/usuarios/activar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id, nuevo_pin: pin })
      })

      if (!respActivar.ok) {
        const err = await respActivar.json()
        setError(err.detail || 'Error al activar')
        setLoading(false)
        return
      }

      const res = await api.post('/login', { pin })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario))
      onActivar(res.data.usuario)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al activar')
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100vh', background: '#f5f5f5'
    }}>
      <div style={{
        background: 'white', padding: '40px', borderRadius: '12px',
        width: '320px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐖</div>
        <h2 style={{ margin: '0 0 4px' }}>Bienvenido {usuario.nombre}</h2>
        <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px' }}>
          Es tu primer acceso — crea tu PIN personal
        </p>

        <input type="password" placeholder="Crea tu PIN (mín. 4 dígitos)"
          value={pin} onChange={e => setPin(e.target.value)}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            border: '1px solid #ddd', fontSize: '16px',
            marginBottom: '12px', boxSizing: 'border-box',
            textAlign: 'center', letterSpacing: '4px'
          }} />

        <input type="password" placeholder="Confirma tu PIN"
          value={confirma} onChange={e => setConfirma(e.target.value)}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            border: '1px solid #ddd', fontSize: '16px',
            marginBottom: '12px', boxSizing: 'border-box',
            textAlign: 'center', letterSpacing: '4px'
          }} />

        {error && <p style={{ color: '#C62828', fontSize: '14px', margin: '0 0 12px' }}>{error}</p>}

        <button onClick={activar} disabled={loading || !pin || !confirma}
          style={{
            width: '100%', padding: '12px',
            background: loading || !pin || !confirma ? '#ccc' : '#2E7D32',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '16px', fontWeight: '700', cursor: 'pointer'
          }}>
          {loading ? 'Activando...' : 'Activar mi acceso'}
        </button>
      </div>
    </div>
  )
}

export default PrimerAcceso