import { useState } from 'react'
import api from '../services/api'

export default function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const obtenerUbicacion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS no soportado'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          })
        },
        (err) => reject(err),
        {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 60000
        }
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

        console.log('GPS OK:', ubicacion)

        lat = ubicacion.lat
        lng = ubicacion.lng
      } catch (gpsError) {
        console.log('GPS ERROR:', gpsError)
        setError('No se pudo obtener ubicación')
      }

      console.log('ENVIANDO:', { pin, lat, lng })

      const res = await api.post('/login', {
        pin,
        lat,
        lng
      })

      console.log(res.data)

      localStorage.setItem('token', res.data.token)
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario))

      onLogin(res.data.usuario)
    } catch (e) {
      console.log(e)
      setError('PIN incorrecto')
    } finally {
      setLoading(false)
    }
  }

  const probarGPS = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        alert(
          `LAT: ${pos.coords.latitude}\nLNG: ${pos.coords.longitude}`
        )
      },
      (err) => {
        alert('ERROR GPS: ' + JSON.stringify(err))
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000
      }
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          width: '320px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>
          🐖
        </div>

        <h2>Corralia v4</h2>

        <p
          style={{
            color: '#888',
            fontSize: '14px',
            marginBottom: '20px'
          }}
        >
          Rancho Yáñez — Atlacomulco
        </p>

        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
        />

        {error && (
          <p style={{ color: 'red', fontSize: '14px' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#2E7D32',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Cargando...' : 'Ingresar'}
        </button>

        <button
          onClick={probarGPS}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            background: '#fafafa',
            cursor: 'pointer'
          }}
        >
          🧪 Probar GPS
        </button>
      </div>
    </div>
  )
}