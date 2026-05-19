import { useState, useEffect } from 'react'
import api from '../services/api'

function Nomina({ usuario }) {
  const [trabajadores, setTrabajadores] = useState([])
  const [montos, setMontos] = useState({})
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const hoy = new Date()
  const domingo = new Date(hoy)
  domingo.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7 + 1) % 7)
  const semanaStr = domingo.toLocaleDateString('es-MX')

  const cargar = () => {
    api.get('/finanzas/nomina').then(r => {
      setTrabajadores(r.data)
      const init = {}
      r.data.forEach(t => {
        init[t.id] = (parseFloat(t.sueldo_diario) * parseInt(t.dias_trabajados)).toFixed(2)
      })
      setMontos(init)
    })
  }

  useEffect(() => { cargar() }, [])

  const total = Object.values(montos).reduce((s, v) => s + Number(v), 0)

  const confirmar = async () => {
    setLoading(true)
    try {
      await api.post('/finanzas/nomina', {
        items: trabajadores.map(t => ({
          nombre: t.nombre,
          monto: Number(montos[t.id] || 0),
          dias: t.dias_trabajados
        })),
        semana: semanaStr
      })
      setMensaje('✅ Nómina registrada correctamente')
      setTimeout(() => setMensaje(''), 3000)
      cargar()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 4px' }}>👥 Nómina</h2>
      <p style={{ color: '#888', fontSize: '13px', margin: '0 0 20px' }}>
        Semana del {semanaStr} — basado en asistencias del checador
      </p>

      {mensaje && (
        <div style={{
          background: '#f1f8e9', border: '1px solid #c5e1a5',
          borderRadius: '8px', padding: '10px', marginBottom: '16px',
          color: '#2E7D32', fontWeight: '600'
        }}>{mensaje}</div>
      )}

      {trabajadores.map(t => (
        <div key={t.id} style={{
          padding: '10px 12px', background: '#f9f9f9',
          borderRadius: '8px', marginBottom: '8px',
          border: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <strong>{t.nombre}</strong>
            <span style={{ color: '#888', fontSize: '13px' }}>
              {t.dias_trabajados} días × ${parseFloat(t.sueldo_diario).toFixed(2)}/día
            </span>
          </div>
          {usuario.rol === 'admin' ? (
            <input type="number" min={0} value={montos[t.id] || 0}
              onChange={e => setMontos({ ...montos, [t.id]: e.target.value })}
              style={inputStyle} />
          ) : (
            <div style={{
              padding: '10px', background: '#f0f0f0',
              borderRadius: '8px', fontWeight: '700', fontSize: '15px'
            }}>
              ${Number(montos[t.id] || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>
      ))}

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontWeight: '700', fontSize: '18px',
        padding: '12px', marginBottom: '12px',
        background: '#ffebee', borderRadius: '8px'
      }}>
        <span>Total nómina:</span>
        <span style={{ color: '#C62828' }}>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
      </div>

      <button onClick={confirmar} disabled={loading}
        style={{
          width: '100%', padding: '14px',
          background: loading ? '#ccc' : '#C62828',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Registrando...' : `✅ Confirmar nómina — $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
      </button>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }

export default Nomina