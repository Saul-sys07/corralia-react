import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

function Checador({ usuario, onChecado }) {
  const esAdmin = usuario.rol === 'admin'
  if (esAdmin) return <HistorialAdmin />
  return <CheckerTrabajador usuario={usuario} onChecado={onChecado} />
}

function CheckerTrabajador({ usuario, onChecado }) {
  const [estado, setEstado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mostrarCamara, setMostrarCamara] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const cargarEstado = async () => {
    const r = await api.get('/checador/estado')
    console.log('Estado checador:', r.data)
    setEstado(r.data)
    return r.data
  }

  useEffect(() => { cargarEstado() }, [])

  const abrirCamara = async (accion) => {
    if (procesando || loading) return
    setProcesando(true)
    setAccionPendiente(accion)
    setMostrarCamara(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (e) {
      setMostrarCamara(false)
      setProcesando(false)
      await registrar(accion, null)
    }
  }

  const tomarFoto = async () => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1]
    streamRef.current?.getTracks().forEach(t => t.stop())
    setMostrarCamara(false)
    await registrar(accionPendiente, base64)
  }

  const cancelarFoto = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setMostrarCamara(false)
    setAccionPendiente(null)
    setProcesando(false)
  }

  const registrar = async (accion, fotoBase64) => {
    setLoading(true)
    try {
      if (accion === 'entrada') {
        await api.post('/checador/entrada')
      } else {
        await api.post('/checador/salida')
      }

      if (fotoBase64) {
        await api.post('/checador/foto', {
          foto_base64: fotoBase64,
          tipo: accion
        })
      }

      setMensaje(`✅ ${accion === 'entrada' ? 'Entrada' : 'Salida'} registrada`)
      await cargarEstado()
      if (accion === 'entrada' && onChecado) onChecado()
    } finally {
      setLoading(false)
      setProcesando(false)
    }
  }

  if (!estado) return <p style={{ padding: '16px', color: '#888' }}>Cargando...</p>

  const ahora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  if (mostrarCamara) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 12px' }}>📸 Toma tu foto</h3>
        <video ref={videoRef} autoPlay playsInline
          style={{ width: '100%', borderRadius: '12px', marginBottom: '12px', maxHeight: '400px', objectFit: 'cover' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={tomarFoto} disabled={loading} style={{
            flex: 1, padding: '14px', background: loading ? '#ccc' : '#2E7D32',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: '700', cursor: 'pointer'
          }}>📸 Tomar foto</button>
          <button onClick={cancelarFoto} disabled={loading} style={{
            flex: 1, padding: '14px', background: '#f0f0f0',
            color: '#555', border: 'none', borderRadius: '10px',
            fontSize: '16px', cursor: 'pointer'
          }}>Cancelar</button>
        </div>
      </div>
    )
  }

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
        }}>{mensaje}</div>
      )}

      {!estado.checo_entrada && (
        <button onClick={() => abrirCamara('entrada')} disabled={loading || procesando}
          style={{
            width: '100%', padding: '20px',
            background: loading || procesando ? '#ccc' : '#2E7D32',
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '18px', fontWeight: '700', cursor: 'pointer'
          }}>
          {loading ? 'Registrando...' : '✅ Registrar Entrada'}
        </button>
      )}

      {estado.checo_entrada && !estado.checo_salida && (
        <div>
          <div style={{
            background: '#f1f8e9', border: '2px solid #2E7D32',
            borderRadius: '10px', padding: '12px', marginBottom: '20px'
          }}>
            <p style={{ margin: 0, color: '#2E7D32', fontWeight: '600' }}>✅ Entrada registrada hoy</p>
          </div>
          <button onClick={() => abrirCamara('salida')} disabled={loading || procesando}
            style={{
              width: '100%', padding: '20px',
              background: loading || procesando ? '#ccc' : '#C62828',
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

function HistorialAdmin() {
  const [asistencias, setAsistencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')

  const cargar = () => {
    api.get('/checador/historial').then(r => {
      setAsistencias(r.data)
      setLoading(false)
    })
  }

  useEffect(() => { cargar() }, [])

  const filtradas = filtro
    ? asistencias.filter(a => a.nombre?.toLowerCase().includes(filtro.toLowerCase()))
    : asistencias

  const resumen = asistencias.reduce((acc, a) => {
    if (!a.nombre) return acc
    if (!acc[a.nombre]) acc[a.nombre] = 0
    acc[a.nombre]++
    return acc
  }, {})

  if (loading) return <p style={{ padding: '16px', color: '#888' }}>Cargando...</p>

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 16px' }}>⏰ Asistencias</h2>

      <button onClick={cargar} style={{
        marginBottom: '12px', padding: '8px 16px', background: '#555',
        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
      }}>🔄 Actualizar</button>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px', color: '#444' }}>Días trabajados:</h4>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.entries(resumen).map(([nombre, dias]) => (
            <div key={nombre} style={{
              background: '#f1f8e9', border: '1px solid #c5e1a5',
              borderRadius: '8px', padding: '8px 12px', textAlign: 'center'
            }}>
              <div style={{ fontWeight: '700', color: '#2E7D32', fontSize: '18px' }}>{dias}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{nombre}</div>
            </div>
          ))}
        </div>
      </div>

      <input type="text" placeholder="Buscar trabajador..."
        value={filtro} onChange={e => setFiltro(e.target.value)}
        style={{
          width: '100%', padding: '10px', fontSize: '15px',
          border: '1px solid #ddd', borderRadius: '8px',
          boxSizing: 'border-box', marginBottom: '16px'
        }} />

      {filtradas.map((a, i) => (
        <div key={i} style={{
          border: '1px solid #ddd', borderRadius: '10px',
          padding: '12px', marginBottom: '8px', background: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <strong>{a.nombre}</strong>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                Entrada: {a.fecha_entrada ? new Date(a.fecha_entrada).toLocaleString('es-MX') : '?'}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Salida: {a.fecha_salida ? new Date(a.fecha_salida).toLocaleString('es-MX') : 'Sin registrar'}
              </div>
            </div>
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%', marginTop: '4px',
              background: a.fecha_salida ? '#2E7D32' : '#F57F17'
            }} />
          </div>

          {(a.foto_entrada || a.foto_salida) && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {a.foto_entrada && (
                <div>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Entrada</div>
                  <img src={a.foto_entrada} alt="entrada"
                    style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => window.open(a.foto_entrada, '_blank')} />
                </div>
              )}
              {a.foto_salida && (
                <div>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Salida</div>
                  <img src={a.foto_salida} alt="salida"
                    style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => window.open(a.foto_salida, '_blank')} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default Checador