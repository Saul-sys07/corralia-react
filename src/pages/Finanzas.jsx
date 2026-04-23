import { useState, useEffect } from 'react'
import api from '../services/api'

function Finanzas({ usuario }) {
  const [tab, setTab] = useState('resumen')
  const [resumen, setResumen] = useState(null)

  const cargarResumen = async () => {
    const r = await api.get('/finanzas/resumen')
    setResumen(r.data)
  }

  useEffect(() => { cargarResumen() }, [])

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 16px' }}>💵 Finanzas</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          ['resumen', '📊 Resumen'],
          ['depositos', '💰 Depósitos'],
          ['nomina', '👷 Nómina'],
          ['sueldos', '⚙️ Sueldos'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px 6px', border: 'none', borderRadius: '8px',
            background: tab === key ? '#1976D2' : '#f0f0f0',
            color: tab === key ? 'white' : '#555',
            fontWeight: tab === key ? '700' : '400',
            cursor: 'pointer', fontSize: '12px'
          }}>{label}</button>
        ))}
      </div>

      {tab === 'resumen' && <Resumen resumen={resumen} />}
      {tab === 'depositos' && <Depositos onExito={cargarResumen} />}
      {tab === 'nomina' && <Nomina onExito={cargarResumen} />}
      {tab === 'sueldos' && <ConfigSueldos />}
    </div>
  )
}

function Resumen({ resumen }) {
  if (!resumen) return <p style={{ color: '#888' }}>Cargando...</p>

  const items = [
    { label: 'Depósitos del papá', valor: resumen.depositos, color: '#1976D2' },
    { label: 'Ventas del rancho', valor: resumen.ventas, color: '#2E7D32' },
    { label: 'Almacén / Insumos', valor: -resumen.almacen, color: '#C62828' },
    { label: 'Sueldos', valor: -resumen.sueldos, color: '#C62828' },
  ]

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '12px', background: '#f9f9f9',
          borderRadius: '8px', marginBottom: '6px'
        }}>
          <span>{item.label}</span>
          <strong style={{ color: item.color }}>
            {item.valor < 0 ? '-' : ''}${Math.abs(item.valor).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </strong>
        </div>
      ))}

      <div style={{
        background: resumen.saldo >= 0 ? '#f1f8e9' : '#ffebee',
        border: `2px solid ${resumen.saldo >= 0 ? '#2E7D32' : '#C62828'}`,
        borderRadius: '10px', padding: '16px', marginTop: '12px', textAlign: 'center'
      }}>
        <div style={{ fontSize: '13px', color: '#666' }}>Saldo disponible con Beyin</div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: resumen.saldo >= 0 ? '#2E7D32' : '#C62828' }}>
          ${resumen.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div style={{
        background: resumen.utilidad >= 0 ? '#e3f2fd' : '#ffebee',
        border: `2px solid ${resumen.utilidad >= 0 ? '#1976D2' : '#C62828'}`,
        borderRadius: '10px', padding: '16px', marginTop: '8px', textAlign: 'center'
      }}>
        <div style={{ fontSize: '13px', color: '#666' }}>Utilidad bruta</div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: resumen.utilidad >= 0 ? '#1976D2' : '#C62828' }}>
          ${resumen.utilidad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  )
}

function Depositos({ onExito }) {
  const [monto, setMonto] = useState('')
  const [notas, setNotas] = useState('')
  const [depositos, setDepositos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/finanzas/depositos').then(r => setDepositos(r.data))
  }, [])

  const confirmar = async () => {
    if (!monto) return
    setLoading(true)
    try {
      await api.post('/finanzas/deposito', { monto: Number(monto), notas })
      setMonto('')
      setNotas('')
      const r = await api.get('/finanzas/depositos')
      setDepositos(r.data)
      onExito()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Monto ($):</label>
        <input type="number" min={0} value={monto}
          onChange={e => setMonto(e.target.value)}
          style={inputStyle} placeholder="Ej: 30000" />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Notas (opcional):</label>
        <input type="text" value={notas}
          onChange={e => setNotas(e.target.value)}
          style={inputStyle} placeholder="Ej: Para compra semana 3" />
      </div>
      <button onClick={confirmar} disabled={loading || !monto}
        style={{
          width: '100%', padding: '14px',
          background: loading || !monto ? '#ccc' : '#1976D2',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer',
          marginBottom: '20px'
        }}>
        {loading ? 'Registrando...' : 'Registrar depósito'}
      </button>

      <label style={labelStyle}>Depósitos recientes:</label>
      {depositos.map((d, i) => (
        <div key={i} style={{
          borderLeft: '4px solid #1976D2', padding: '8px 12px',
          background: '#f9f9f9', borderRadius: '3px', marginBottom: '6px'
        }}>
          <strong>${parseFloat(d.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
          <span style={{ color: '#888', fontSize: '13px' }}> — {d.fecha ? new Date(d.fecha).toLocaleDateString('es-MX') : '?'}</span>
          {d.notas && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{d.notas}</div>}
        </div>
      ))}
    </div>
  )
}

function Nomina({ onExito }) {
  const [trabajadores, setTrabajadores] = useState([])
  const [montos, setMontos] = useState({})
  const [loading, setLoading] = useState(false)

  const hoy = new Date()
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() - hoy.getDay() + 1)
  const semanaStr = lunes.toLocaleDateString('es-MX')

  useEffect(() => {
    api.get('/finanzas/nomina').then(r => {
      setTrabajadores(r.data)
      const init = {}
      r.data.forEach(t => {
        init[t.id] = (parseFloat(t.sueldo_diario) * parseInt(t.dias_trabajados)).toFixed(2)
      })
      setMontos(init)
    })
  }, [])

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
      onExito()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p style={{ color: '#888', fontSize: '13px', margin: '0 0 16px' }}>
        Semana: {semanaStr} — basado en asistencias del checador
      </p>

      {trabajadores.map(t => (
        <div key={t.id} style={{
          padding: '10px 12px', background: '#f9f9f9',
          borderRadius: '8px', marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <strong>{t.nombre}</strong>
            <span style={{ color: '#888', fontSize: '13px' }}>
              {t.dias_trabajados} días × ${parseFloat(t.sueldo_diario).toFixed(2)}/día
            </span>
          </div>
          <input type="number" min={0} value={montos[t.id] || 0}
            onChange={e => setMontos({ ...montos, [t.id]: e.target.value })}
            style={inputStyle} />
        </div>
      ))}

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontWeight: '700', fontSize: '18px',
        padding: '12px', marginBottom: '12px'
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
        {loading ? 'Registrando...' : `Confirmar nómina — $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
      </button>
    </div>
  )
}

function ConfigSueldos() {
  const [trabajadores, setTrabajadores] = useState([])
  const [sueldos, setSueldos] = useState({})

  useEffect(() => {
    api.get('/finanzas/sueldos').then(r => {
      setTrabajadores(r.data)
      const init = {}
      r.data.forEach(t => { init[t.id] = parseFloat(t.sueldo_diario) })
      setSueldos(init)
    })
  }, [])

  const guardar = async (id) => {
    await api.post('/finanzas/sueldos', { usuario_id: id, sueldo_diario: sueldos[id] })
    alert('Sueldo actualizado')
  }

  return (
    <div>
      <p style={{ color: '#888', fontSize: '13px', margin: '0 0 16px' }}>
        Solo visible para el administrador
      </p>
      {trabajadores.map(t => (
        <div key={t.id} style={{
          padding: '10px 12px', background: '#f9f9f9',
          borderRadius: '8px', marginBottom: '8px'
        }}>
          <div style={{ marginBottom: '6px' }}>
            <strong>{t.nombre}</strong>
            <span style={{ color: '#888', fontSize: '13px' }}> — {t.rol}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="number" min={0} value={sueldos[t.id] || 0}
              onChange={e => setSueldos({ ...sueldos, [t.id]: Number(e.target.value) })}
              style={{ ...inputStyle, marginBottom: 0 }} />
            <button onClick={() => guardar(t.id)} style={{
              padding: '10px 16px', background: '#2E7D32', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700'
            }}>💾</button>
          </div>
        </div>
      ))}
    </div>
  )
}

const labelStyle = { display: 'block', fontWeight: '600', marginBottom: '6px', color: '#444' }
const inputStyle = { width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }

export default Finanzas