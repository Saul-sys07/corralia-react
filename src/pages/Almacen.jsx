import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

const INGREDIENTES = ['Maíz molido', 'Salvado', 'Soya', 'Sal/Omega/Minerales', 'Melaza']
const PELLETS = ['Pellet Destete/Crecimiento', 'Pellet Finalizador (Engorda)', 'Pellet Otro']
const OTROS = ['Gasolina camioneta', 'Gasolina bomba', 'Medicamento/Vacuna', 'Material construcción', 'Otro']
const TODOS_PRODUCTOS = [...INGREDIENTES, ...PELLETS, ...OTROS]

const UNIDADES = {
  'Maíz molido': 'bulto', 'Salvado': 'bulto', 'Soya': 'bulto',
  'Sal/Omega/Minerales': 'kg', 'Melaza': 'litro',
  'Pellet Destete/Crecimiento': 'bulto', 'Pellet Finalizador (Engorda)': 'bulto', 'Pellet Otro': 'bulto',
  'Gasolina camioneta': 'litro', 'Gasolina bomba': 'litro',
  'Medicamento/Vacuna': 'pieza', 'Material construcción': 'pieza', 'Otro': 'pieza'
}

const KG_BULTO = { 'Maíz molido': 40, 'Salvado': 25, 'Soya': 40, 'Pellet Destete/Crecimiento': 40, 'Pellet Finalizador (Engorda)': 40, 'Pellet Otro': 40 }

function Almacen({ usuario }) {
  const [tab, setTab] = useState('inventario')
  const [inventario, setInventario] = useState([])
  const [saldo, setSaldo] = useState(0)
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [inv, sal] = await Promise.all([
        api.get('/almacen/inventario'),
        api.get('/almacen/saldo')
      ])
      setInventario(inv.data)
      setSaldo(sal.data.saldo)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 8px' }}>🏚️ Almacén</h2>

      <div style={{
        background: saldo >= 0 ? '#f1f8e9' : '#ffebee',
        border: `2px solid ${saldo >= 0 ? '#2E7D32' : '#C62828'}`,
        borderRadius: '10px', padding: '12px', marginBottom: '16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '13px', color: '#666' }}>💵 Disponible para compras</div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: saldo >= 0 ? '#2E7D32' : '#C62828' }}>
          ${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[['inventario', '📦 Inventario'], ['compra', '🛒 Compra'], ['revoltura', '🔄 Revoltura'], ['tickets', '🧾 Tickets']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
            background: tab === key ? '#2E7D32' : '#f0f0f0',
            color: tab === key ? 'white' : '#555',
            fontWeight: tab === key ? '700' : '400',
            cursor: 'pointer', fontSize: '13px'
          }}>{label}</button>
        ))}
      </div>

      {tab === 'inventario' && <Inventario inventario={inventario} loading={loading} onRefresh={cargarDatos} />}
      {tab === 'compra' && <Compra onExito={cargarDatos} />}
      {tab === 'revoltura' && <Revoltura inventario={inventario} onExito={cargarDatos} />}
    </div>
  )
}

function Inventario({ inventario, loading, onRefresh }) {
  if (loading) return <p style={{ color: '#888' }}>Cargando...</p>
  if (inventario.length === 0) return <p style={{ color: '#888' }}>Sin movimientos registrados.</p>

  return (
    <div>
      <button onClick={onRefresh} style={{
        marginBottom: '12px', padding: '8px 16px', background: '#555',
        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
      }}>🔄 Actualizar</button>
      {inventario.map((r, i) => {
        const kg = KG_BULTO[r.producto]
        const kgStr = kg && r.unidad === 'bulto' ? ` = ${(r.stock * kg).toFixed(0)}kg` : ''
        const esRevoltura = r.producto === 'Revoltura lista'
        return (
          <div key={i} style={{
            borderLeft: `4px solid ${esRevoltura ? '#1976D2' : '#2E7D32'}`,
            padding: '8px 12px', background: '#f9f9f9',
            borderRadius: '3px', marginBottom: '6px'
          }}>
            <strong>{r.producto}</strong>: {parseFloat(r.stock).toFixed(1)} {r.unidad}{kgStr}
            <br />
            <small style={{ color: '#888' }}>Invertido: ${parseFloat(r.total_invertido).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</small>
          </div>
        )
      })}
    </div>
  )
}

function Compra({ onExito }) {
  const [producto, setProducto] = useState(TODOS_PRODUCTOS[0])
  const [cantidad, setCantidad] = useState('')
  const [costo, setCosto] = useState('')
  const [nota, setNota] = useState('')
  const [carrito, setCarrito] = useState([])
  const [descuento, setDescuento] = useState(0)
  const [ticketUrl, setTicketUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  const unidad = UNIDADES[producto] || 'pieza'
  const kgBulto = KG_BULTO[producto]
  const subtotal = carrito.reduce((s, i) => s + i.costo, 0)
  const total = subtotal - descuento

  const agregar = () => {
    if (!cantidad || !costo) return
    if (producto === 'Otro' && !nota) return
    const categoria = INGREDIENTES.includes(producto) ? 'Ingredientes revoltura'
      : PELLETS.includes(producto) ? 'Pellet' : 'Otro'
    const nombreFinal = producto === 'Otro' ? `Otro: ${nota}` : producto
    setCarrito([...carrito, { producto: nombreFinal, cantidad: Number(cantidad), unidad, costo: Number(costo), categoria }])
    setCantidad('')
    setCosto('')
    setNota('')
  }

  const confirmar = async () => {
    if (carrito.length === 0) return
    setLoading(true)
    try {
      await api.post('/almacen/compra', { items: carrito, descuento })
      setCarrito([])
      setDescuento(0)
      setTicketUrl(null)
      onExito()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Producto:</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TODOS_PRODUCTOS.map(p => (
            <button key={p} onClick={() => { setProducto(p); setNota('') }}
              style={chipStyle(producto === p, '#1976D2')}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Cantidad ({unidad}):</label>
          <input type="number" min={0} value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            style={inputStyle} />
          {kgBulto && cantidad && (
            <small style={{ color: '#666' }}>= {cantidad * kgBulto}kg</small>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Costo ($):</label>
          <input type="number" min={0} value={costo}
            onChange={e => setCosto(e.target.value)}
            style={inputStyle} />
        </div>
      </div>

      {producto === 'Otro' && (
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>¿Qué es? (obligatorio):</label>
          <input type="text" value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Ej: medicina para la tos, herramienta..."
            style={inputStyle} />
        </div>
      )}

      <button onClick={agregar}
        disabled={!cantidad || !costo || (producto === 'Otro' && !nota)}
        style={{
          width: '100%', padding: '10px',
          background: !cantidad || !costo || (producto === 'Otro' && !nota) ? '#ccc' : '#1976D2',
          color: 'white', border: 'none', borderRadius: '8px',
          cursor: 'pointer', fontWeight: '700', marginBottom: '16px'
        }}>➕ Agregar al carrito</button>

      {carrito.length > 0 && (
        <div>
          <label style={labelStyle}>Carrito:</label>
          {carrito.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 12px', background: '#f5f5f5',
              borderRadius: '8px', marginBottom: '4px'
            }}>
              <span style={{ fontSize: '13px' }}>{item.producto} — {item.cantidad} {item.unidad}</span>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <strong>${item.costo.toFixed(2)}</strong>
                <button onClick={() => setCarrito(carrito.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', color: '#C62828', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Subtotal:</span><strong>${subtotal.toFixed(2)}</strong>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={labelStyle}>Descuento ($):</label>
              <input type="number" min={0} value={descuento}
                onChange={e => setDescuento(Number(e.target.value))}
                style={inputStyle} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px', marginBottom: '12px' }}>
              <span>Total:</span><span style={{ color: '#2E7D32' }}>${total.toFixed(2)}</span>
            </div>

            <FotoTicket onFotoSubida={(url) => setTicketUrl(url)} />

            <button onClick={confirmar} disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#ccc' : '#2E7D32',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '16px', fontWeight: '700', cursor: 'pointer'
              }}>
              {loading ? 'Registrando...' : `Confirmar compra — $${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FotoTicket({ onFotoSubida }) {
  const [mostrarCamara, setMostrarCamara] = useState(false)
  const [fotoUrl, setFotoUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

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

  const tomarFoto = async () => {
    setLoading(true)
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1]
    streamRef.current?.getTracks().forEach(t => t.stop())
    setMostrarCamara(false)
    try {
      const r = await api.post('/almacen/foto-ticket', { foto_base64: base64 })
      setFotoUrl(r.data.url)
      onFotoSubida(r.data.url)
    } finally {
      setLoading(false)
    }
  }

  const cancelar = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setMostrarCamara(false)
  }

  if (mostrarCamara) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <video ref={videoRef} autoPlay playsInline
          style={{ width: '100%', borderRadius: '8px', marginBottom: '8px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={tomarFoto} disabled={loading} style={{
            flex: 1, padding: '10px', background: '#1976D2', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700'
          }}>📸 Tomar foto</button>
          <button onClick={cancelar} style={{
            flex: 1, padding: '10px', background: '#f0f0f0', color: '#555',
            border: 'none', borderRadius: '8px', cursor: 'pointer'
          }}>Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '12px' }}>
      {fotoUrl ? (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', color: '#2E7D32', fontWeight: '600', marginBottom: '4px' }}>
            ✅ Ticket adjunto
          </div>
          <img src={fotoUrl} alt="ticket"
            style={{ width: '100%', borderRadius: '8px', maxHeight: '150px', objectFit: 'cover' }} />
          <button onClick={() => { setFotoUrl(null); onFotoSubida(null) }}
            style={{ marginTop: '4px', background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', fontSize: '13px' }}>
            🗑️ Quitar foto
          </button>
        </div>
      ) : (
        <button onClick={abrirCamara} style={{
          width: '100%', padding: '10px', background: '#f5f5f5',
          border: '2px dashed #ddd', borderRadius: '8px',
          cursor: 'pointer', color: '#666', fontSize: '14px', marginBottom: '12px'
        }}>
          📷 Adjuntar foto del ticket (opcional)
        </button>
      )}
    </div>
  )
}

function Revoltura({ inventario, onExito }) {
  const getStock = (prod) => {
    const r = inventario.find(i => i.producto === prod)
    return r ? parseFloat(r.stock) : 0
  }

  const [maiz, setMaiz] = useState(6)
  const [salvado, setSalvado] = useState(6)
  const [soya, setSoya] = useState(1)
  const [sal, setSal] = useState(2)
  const [melaza, setMelaza] = useState(30)
  const [loading, setLoading] = useState(false)

  const kgRevoltura = (maiz * 40) + (salvado * 25) + (soya * 40) + sal

  const confirmar = async () => {
    setLoading(true)
    try {
      await api.post('/almacen/revoltura', { maiz, salvado, soya, sal, melaza })
      onExito()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p style={{ color: '#888', fontSize: '13px', margin: '0 0 16px' }}>
        Los bultos se transforman en revoltura lista 🐷
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          ['Maíz', getStock('Maíz molido'), 'bts'],
          ['Salvado', getStock('Salvado'), 'bts'],
          ['Soya', getStock('Soya'), 'bts'],
          ['Sal', getStock('Sal/Omega/Minerales'), 'kg'],
          ['Melaza', getStock('Melaza'), 'L'],
        ].map(([nombre, stock, unid]) => (
          <div key={nombre} style={{
            flex: 1, minWidth: '60px', textAlign: 'center',
            background: '#f5f5f5', borderRadius: '8px', padding: '8px'
          }}>
            <div style={{ fontSize: '11px', color: '#888' }}>{nombre}</div>
            <div style={{ fontWeight: '700' }}>{stock.toFixed(0)} {unid}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {[
          ['Maíz (bultos)', maiz, setMaiz, getStock('Maíz molido')],
          ['Salvado (bultos)', salvado, setSalvado, getStock('Salvado')],
          ['Soya (bultos)', soya, setSoya, getStock('Soya')],
          ['Sal/Min (kg)', sal, setSal, getStock('Sal/Omega/Minerales')],
          ['Melaza (litros)', melaza, setMelaza, getStock('Melaza')],
        ].map(([label, val, setter, max]) => (
          <div key={label}>
            <label style={labelStyle}>{label}:</label>
            <input type="number" min={0} max={max} value={val}
              onChange={e => setter(Number(e.target.value))}
              style={inputStyle} />
          </div>
        ))}
      </div>

      <div style={{
        background: '#e3f2fd', border: '1px solid #90caf9',
        borderRadius: '8px', padding: '12px', marginBottom: '16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '13px', color: '#666' }}>Revoltura resultante</div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1976D2' }}>{kgRevoltura} kg</div>
      </div>

      <button onClick={confirmar} disabled={loading}
        style={{
          width: '100%', padding: '14px',
          background: loading ? '#ccc' : '#1976D2',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Procesando...' : `Hacer revoltura — ${kgRevoltura}kg`}
      </button>
    </div>
  )
}

const labelStyle = { display: 'block', fontWeight: '600', marginBottom: '6px', color: '#444' }
const inputStyle = { width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }
const chipStyle = (activo, color) => ({
  padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
  border: activo ? `2px solid ${color}` : '2px solid #ddd',
  background: activo ? `${color}15` : 'white',
  color: activo ? color : '#666',
  fontWeight: activo ? '700' : '400', fontSize: '12px'
})

{tab === 'tickets' && <Tickets />}

function Tickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/almacen/tickets').then(r => {
      setTickets(r.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#888' }}>Cargando...</p>
  if (tickets.length === 0) return <p style={{ color: '#888' }}>Sin tickets registrados.</p>

  return (
    <div>
      <p style={{ color: '#666', fontSize: '13px', margin: '0 0 16px' }}>
        Fotos de tickets de compra para cotejo
      </p>
      {tickets.map((t, i) => (
        <div key={i} style={{
          border: '1px solid #ddd', borderRadius: '10px',
          padding: '12px', marginBottom: '8px', background: 'white'
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
            {t.usuario_id} — {t.fecha ? new Date(t.fecha).toLocaleString('es-MX') : '?'}
          </div>
          <img src={t.url} alt="ticket"
            style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  )
}

export default Almacen