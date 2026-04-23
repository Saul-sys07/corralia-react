import { useState, useEffect } from 'react'
import api from '../services/api'

const TIPOS = ['Nuevo', 'Retenido', 'Recuperado', 'Sin comision']
const COMISIONES = { 'Nuevo': 3.00, 'Retenido': 1.50, 'Recuperado': 2.00, 'Sin comision': 0.00 }

const TIPO_COLORES = {
  'Nuevo': '#2E7D32',
  'Retenido': '#1976D2',
  'Recuperado': '#F57F17',
  'Sin comision': '#9E9E9E'
}

function Clientes({ usuario }) {
  const [tab, setTab] = useState('lista')
  const [clientes, setClientes] = useState([])
  const [vendedores, setVendedores] = useState([])

  const cargar = async () => {
    const [cli, vend] = await Promise.all([
      api.get('/clientes/lista'),
      api.get('/finanzas/sueldos')
    ])
    setClientes(cli.data)
    setVendedores(vend.data)
  }

  useEffect(() => {
    api.post('/clientes/actualizar-ciclo')
    cargar()
  }, [])

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 16px' }}>👤 Clientes</h2>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[['lista', '📋 Lista'], ['nuevo', '➕ Nuevo']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
            background: tab === key ? '#2E7D32' : '#f0f0f0',
            color: tab === key ? 'white' : '#555',
            fontWeight: tab === key ? '700' : '400',
            cursor: 'pointer', fontSize: '14px'
          }}>{label}</button>
        ))}
      </div>

      {tab === 'lista' && <ListaClientes clientes={clientes} />}
      {tab === 'nuevo' && <NuevoCliente vendedores={vendedores} onExito={() => { cargar(); setTab('lista') }} />}
    </div>
  )
}

function ListaClientes({ clientes }) {
  if (clientes.length === 0) return <p style={{ color: '#888' }}>Sin clientes registrados.</p>

  return (
    <div>
      {clientes.map((c, i) => (
        <div key={i} style={{
          border: '1px solid #ddd', borderRadius: '10px',
          padding: '12px', marginBottom: '8px', background: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <strong style={{ fontSize: '16px' }}>{c.nombre}</strong>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                📞 {c.telefono}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Vendedor: {c.vendedor}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                background: TIPO_COLORES[c.tipo], color: 'white',
                padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                fontWeight: '700'
              }}>{c.tipo}</span>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                ${COMISIONES[c.tipo]}/kg comisión
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', gap: '16px', marginTop: '10px',
            paddingTop: '10px', borderTop: '1px solid #f0f0f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '700', color: '#2E7D32' }}>{c.num_compras}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>compras</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '700', color: '#1976D2' }}>
                ${parseFloat(c.total_comprado).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>total comprado</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function NuevoCliente({ vendedores, onExito }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [tipo, setTipo] = useState('Nuevo')
  const [vendedorId, setVendedorId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async () => {
    if (!nombre || !telefono || !vendedorId) return
    setLoading(true)
    setError('')
    try {
      await api.post('/clientes', {
        nombre, telefono, tipo, usuario_id: vendedorId
      })
      onExito()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear cliente')
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Nombre:</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Nombre del cliente" style={inputStyle} />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Teléfono:</label>
        <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
          placeholder="10 dígitos" style={inputStyle} />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Tipo de cliente:</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TIPOS.map(t => (
            <button key={t} onClick={() => setTipo(t)}
              style={chipStyle(tipo === t, TIPO_COLORES[t])}>
              {t} (${COMISIONES[t]}/kg)
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Vendedor asignado:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {vendedores.map(v => (
            <button key={v.id} onClick={() => setVendedorId(Number(v.id))}
              style={{
                padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                border: vendedorId === Number(v.id) ? '2px solid #2E7D32' : '2px solid #ddd',
                background: vendedorId === Number(v.id) ? '#f1f8e9' : 'white',
                textAlign: 'left', fontSize: '14px'
              }}>
              {v.nombre} — {v.rol}
            </button>
          ))}
        </div>
      </div>

      {error && <p style={{ color: '#C62828', marginBottom: '12px' }}>{error}</p>}

      <button onClick={confirmar}
        disabled={loading || !nombre || !telefono || !vendedorId}
        style={{
          width: '100%', padding: '14px',
          background: loading || !nombre || !telefono || !vendedorId ? '#ccc' : '#2E7D32',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Creando...' : 'Crear cliente'}
      </button>
    </div>
  )
}

const labelStyle = { display: 'block', fontWeight: '600', marginBottom: '8px', color: '#444' }
const inputStyle = { width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }
const chipStyle = (activo, color) => ({
  padding: '8px 14px', borderRadius: '20px', cursor: 'pointer',
  border: activo ? `2px solid ${color}` : '2px solid #ddd',
  background: activo ? `${color}15` : 'white',
  color: activo ? color : '#666',
  fontWeight: activo ? '700' : '400', fontSize: '13px'
})

export default Clientes