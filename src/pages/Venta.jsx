import { useState, useEffect } from 'react'
import api from '../services/api'

const COMISIONES = {
  'Nuevo': 3.00,
  'Retenido': 1.50,
  'Recuperado': 2.00,
  'Sin comision': 0.00
}

function Venta({ corral, usuario, onVolver }) {
  const tipos = corral.tipo_animal?.split(' / ').map(t => t.trim())
    .filter(t => ['Destete', 'Engorda', 'Desecho'].includes(t)) || []

  const [clientes, setClientes] = useState([])
  const [precioSistema, setPrecioSistema] = useState(48)
  const [cliente, setCliente] = useState(null)
  const [tipoAnimal, setTipoAnimal] = useState(tipos[0] || '')
  const [carrito, setCarrito] = useState([])
  const [pesoActual, setPesoActual] = useState('')
  const [precioKg, setPrecioKg] = useState(0)
  const [precioCabeza, setPrecioCabeza] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const esDestete = tipoAnimal === 'Destete'
  const esAdmin = usuario.rol === 'admin'
  const comisionKg = COMISIONES[cliente?.tipo] || 0
  const disponible = corral.poblacion_actual || 0

  useEffect(() => {
    api.get('/clientes').then(r => setClientes(r.data))
    api.get('/precio-dia').then(r => {
      setPrecioSistema(r.data.precio)
      setPrecioKg(r.data.precio)
    })
  }, [])

  // Calculos por item del carrito
  const calcularItem = (peso, precio) => {
    const total = esDestete ? Number(precioCabeza) : peso * precio
    const comision = esDestete ? comisionKg : comisionKg * peso
    return { total, comision, rancho: total - comision }
  }

  // Totales del carrito
  const totalVenta = carrito.reduce((s, i) => s + i.total, 0)
  const totalComision = carrito.reduce((s, i) => s + i.comision, 0)
  const totalRancho = carrito.reduce((s, i) => s + i.rancho, 0)

  const agregarAlCarrito = () => {
    if (esDestete) {
      if (!precioCabeza) return
      const item = calcularItem(0, 0)
      setCarrito([...carrito, {
        num: carrito.length + 1,
        peso: 0,
        precio: Number(precioCabeza),
        ...item
      }])
      setPrecioCabeza('')
    } else {
      if (!pesoActual) return
      const item = calcularItem(Number(pesoActual), precioKg)
      setCarrito([...carrito, {
        num: carrito.length + 1,
        peso: Number(pesoActual),
        precio: precioKg,
        ...item
      }])
      setPesoActual('')
    }
  }

  const quitarDelCarrito = (idx) => {
    setCarrito(carrito.filter((_, i) => i !== idx))
  }

  const handleConfirmar = async () => {
    if (!cliente || carrito.length === 0) return
    setLoading(true)
    setError('')
    try {
      await api.post('/venta', {
        cliente_id: cliente.id,
        id_chiquero: corral.id,
        tipo_animal: tipoAnimal,
        cantidad: carrito.length,
        peso_kg: carrito.reduce((s, i) => s + i.peso, 0),
        precio_kg: esDestete ? 0 : precioKg,
        precio_cabeza: esDestete ? Number(carrito[0]?.precio || 0) : 0,
        comision_kg: comisionKg,
        total_rancho: totalRancho,
        total_comision: totalComision,
        es_destete: esDestete
      })
      onVolver(true)
    } catch (e) {
      setError('Error al registrar venta')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <button onClick={() => onVolver(false)} style={{
        background: 'none', border: 'none', color: '#1976D2',
        fontSize: '16px', cursor: 'pointer', marginBottom: '16px'
      }}>← Regresar</button>

      <h2 style={{ margin: '0 0 4px' }}>💰 Registrar Venta</h2>
      <p style={{ color: '#888', margin: '0 0 20px' }}>{corral.nombre} · {corral.zona}</p>

      {/* Tipo animal */}
      {tipos.length > 1 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Tipo:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tipos.map(t => (
              <button key={t} onClick={() => { setTipoAnimal(t); setCarrito([]) }}
                style={chipStyle(tipoAnimal === t, '#2E7D32')}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cliente */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Cliente:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {clientes.map(c => (
            <button key={c.id} onClick={() => setCliente(c)}
              style={{
                padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                border: cliente?.id === c.id ? '2px solid #2E7D32' : '2px solid #ddd',
                background: cliente?.id === c.id ? '#f1f8e9' : 'white',
                textAlign: 'left', fontSize: '14px'
              }}>
              <strong>{c.nombre}</strong> — {c.tipo}
              <span style={{ color: '#888', fontSize: '12px' }}> · ${COMISIONES[c.tipo]}/kg comisión</span>
            </button>
          ))}
        </div>
      </div>

      {/* Precio kg — solo admin puede cambiar */}
      {!esDestete && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Precio por kg ($):</label>
          {esAdmin ? (
            <input type="number" min={0} step={0.5} value={precioKg}
              onChange={e => setPrecioKg(Number(e.target.value))}
              style={inputStyle} />
          ) : (
            <div style={{
              padding: '12px', background: '#f5f5f5',
              borderRadius: '8px', fontWeight: '700', fontSize: '16px'
            }}>
              ${precioSistema}/kg
            </div>
          )}
        </div>
      )}

      {/* Agregar animal */}
      {carrito.length < disponible && (
        <div style={{
          background: '#f9f9f9', border: '1px solid #ddd',
          borderRadius: '8px', padding: '12px', marginBottom: '16px'
        }}>
          <label style={labelStyle}>
            {esDestete ? `Cerdo ${carrito.length + 1} — Precio por cabeza ($):` : `Cerdo ${carrito.length + 1} — Peso (kg):`}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number" min={0} step={esDestete ? 50 : 0.5}
              value={esDestete ? precioCabeza : pesoActual}
              onChange={e => esDestete ? setPrecioCabeza(e.target.value) : setPesoActual(e.target.value)}
              placeholder={esDestete ? 'Precio cabeza' : 'Peso en kg'}
              style={{ ...inputStyle, marginBottom: 0 }}
            />
            <button onClick={agregarAlCarrito}
              style={{
                padding: '12px 16px', background: '#2E7D32', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontWeight: '700', whiteSpace: 'nowrap'
              }}>
              ➕ Agregar
            </button>
          </div>
          {!esDestete && pesoActual && (
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
              = ${(Number(pesoActual) * precioKg).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Carrito */}
      {carrito.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Carrito ({carrito.length} cerdos):</label>
          {carrito.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', background: '#f5f5f5', borderRadius: '8px',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '14px' }}>
                Cerdo {item.num} — {esDestete ? `$${item.precio}/cab` : `${item.peso}kg`}
              </span>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#2E7D32' }}>
                  ${item.rancho.toFixed(2)}
                </span>
                <button onClick={() => quitarDelCarrito(idx)}
                  style={{
                    background: 'none', border: 'none', color: '#C62828',
                    cursor: 'pointer', fontSize: '16px'
                  }}>🗑️</button>
              </div>
            </div>
          ))}

          {/* Total */}
          <div style={{
            background: '#f1f8e9', border: '1px solid #c5e1a5',
            borderRadius: '8px', padding: '12px', marginTop: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Total venta:</span>
              <strong>${totalVenta.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Comisión:</span>
              <span style={{ color: '#C62828' }}>-${totalComision.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px' }}>
              <span>Al rancho:</span>
              <span style={{ color: '#2E7D32' }}>${totalRancho.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {error && <p style={{ color: '#C62828', marginBottom: '12px' }}>{error}</p>}

      <button onClick={handleConfirmar}
        disabled={loading || !cliente || carrito.length === 0}
        style={{
          width: '100%', padding: '14px',
          background: loading || !cliente || carrito.length === 0 ? '#ccc' : '#2E7D32',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Registrando...' : `Confirmar venta de ${carrito.length} cerdos — $${totalRancho.toFixed(2)}`}
      </button>
    </div>
  )
}

const labelStyle = { display: 'block', fontWeight: '600', marginBottom: '8px', color: '#444' }
const inputStyle = { width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', marginBottom: '0' }
const chipStyle = (activo, color) => ({
  padding: '8px 14px', borderRadius: '20px', cursor: 'pointer',
  border: activo ? `2px solid ${color}` : '2px solid #ddd',
  background: activo ? `${color}15` : 'white',
  color: activo ? color : '#666',
  fontWeight: activo ? '700' : '400', fontSize: '13px'
})

export default Venta