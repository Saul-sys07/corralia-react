import { useState } from 'react'
import api from '../services/api'

function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const obtenerUbicacion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({ code: 0 })
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }

  const handleLogin = async () => {
    if (!pin) return
    setLoading(true)
    setError('')
    try {
      let lat = null
      let lng = null
      try {
        const ubicacion = await obtenerUbicacion()
        lat = ubicacion.lat
        lng = ubicacion.lng
      } catch (e) {
        if (e.code === 1) {
          setError('Debes permitir la ubicación para acceder')
          setLoading(false)
          return
        }
      }
      const res = await api.post('/login', { pin, lat, lng })
      if (res.data.usuario.primer_acceso) {
        onLogin(res.data.usuario, res.data.token)
      } else {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario))
        onLogin(res.data.usuario)
      }
    } catch (e) {
      setError('PIN incorrecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        background: 'white', padding: '40px',
        borderRadius: '12px', width: '320px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐖</div>
        <h2 style={{ margin: '0 0 4px' }}>Corralia v4</h2>
        <p style={{ color: '#888', margin: '0 0 24px', fontSize: '14px' }}>
          Rancho Yáñez — Atlacomulco
        </p>

        <input
          type="password"
          placeholder="PIN de acceso"
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6)
            setPin(val)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%', padding: '12px',
            borderRadius: '8px', border: '1px solid #ddd',
            fontSize: '16px', marginBottom: '12px',
            boxSizing: 'border-box', textAlign: 'center',
            letterSpacing: '4px'
          }}
          autoFocus
        />

        {error && (
          <p style={{ color: '#c62828', fontSize: '14px', margin: '0 0 12px' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !pin}
          style={{
            width: '100%', padding: '12px',
            backgroundColor: loading ? '#ccc' : '#2E7D32',
            color: 'white', border: 'none',
            borderRadius: '8px', fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          {loading ? 'Verificando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}

export default Login