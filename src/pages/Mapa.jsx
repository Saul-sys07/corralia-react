import { useState, useEffect } from 'react'
import api from '../services/api'

const ZONAS = ['Parideras', 'Gestacion', 'Crecimiento']

const ZONA_ICONOS = {
  Parideras: '🐷',
  Gestacion: '🔄',
  Crecimiento: '📈'
}

function getSemaforo(row) {
  const pob = row.poblacion_actual
  const cap = row.capacidad_max || 1
  const pct = pob / cap
  const esExclusivo = row.tipo_animal?.includes('Semental') || row.tipo_animal?.includes('Pie de Cr')

  if (pob === 0) return { color: '#9E9E9E', fondo: '#f5f5f5', emoji: '⚫', estado: 'VACÍO' }
  if (esExclusivo && pob <= cap) return { color: '#2E7D32', fondo: '#f1f8e9', emoji: '🟢', estado: 'OCUPADO' }
  if (pct >= 1.0) return { color: '#C62828', fondo: '#ffebee', emoji: '🔴', estado: 'EXCEDIDO' }
  if (pct >= 0.9) return { color: '#F57F17', fondo: '#fff8e1', emoji: '🟡', estado: 'AL LÍMITE' }
  return { color: '#2E7D32', fondo: '#f1f8e9', emoji: '🟢', estado: 'OK' }
}

function TarjetaCorral({ row, onAccion }) {
  const [expandida, setExpandida] = useState(false)
  const sem = getSemaforo(row)
  const pct = Math.min((row.poblacion_actual / (row.capacidad_max || 1)) * 100, 100)

  const TIPOS_VENDIBLES = ['Destete', 'Engorda', 'Desecho']
  const tipos = row.tipo_animal?.split(' / ').map(t => t.trim()) || []
  const tieneVendibles = tipos.some(t => TIPOS_VENDIBLES.includes(t))
  const tienePieCria = row.tipo_animal?.includes('Pie de Cr')
  const esZonaPavideras = row.zona === 'Parideras'

  return (
    <div style={{ marginBottom: '8px' }}>
      {/* Header clickeable */}
      <div
        onClick={() => setExpandida(!expandida)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 12px', background: sem.fondo,
          border: `2px solid ${sem.color}`, borderRadius: expandida ? '10px 10px 0 0' : '10px',
          cursor: 'pointer', userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '18px' }}>{sem.emoji}</span>
        <span style={{ fontWeight: '600', flex: 1 }}>{row.nombre}</span>
        <span style={{ fontSize: '13px', color: '#666' }}>
          {row.poblacion_actual}/{row.capacidad_max}
        </span>
        {row.poblacion_actual > 0 && (
          <span style={{
            fontSize: '11px', background: sem.color,
            color: 'white', padding: '2px 6px', borderRadius: '10px'
          }}>
            {row.tipo_animal}
          </span>
        )}
        <span style={{ color: '#aaa' }}>{expandida ? '▲' : '▼'}</span>
      </div>

      {/* Contenido expandido */}
      {expandida && (
        <div style={{
          border: `2px solid ${sem.color}`, borderTop: 'none',
          borderRadius: '0 0 10px 10px', padding: '12px',
          background: 'white'
        }}>
          {/* Barra de capacidad */}
          <div style={{
            background: '#e0e0e0', borderRadius: '20px',
            height: '8px', overflow: 'hidden', marginBottom: '8px'
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: sem.color, borderRadius: '20px',
              transition: 'width 0.3s'
            }} />
          </div>

          <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
            {row.area_m2?.toFixed(1)} m² · {sem.estado}
            {row.estado_pie_cria && ` · ${row.estado_pie_cria}`}
          </div>

          {/* Botones de acción */}
          {row.poblacion_actual > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button onClick={() => onAccion('traspaso', row)}
                style={btnStyle('#1976D2')}>🔄 Traslado</button>
              <button onClick={() => onAccion('muerte', row)}
                style={btnStyle('#C62828')}>💀 Muerte</button>
              <button onClick={() => onAccion('etapa', row)}
                style={btnStyle('#6A1B9A')}>📦 Etapa</button>
              {tieneVendibles && (
                <button onClick={() => onAccion('venta', row)}
                  style={btnStyle('#2E7D32')}>💰 Venta</button>
              )}
              {esZonaPavideras && tienePieCria && (
                <button onClick={() => onAccion('parto', row)}
                  style={btnStyle('#E65100')}>🍼 Parto</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function btnStyle(color) {
  return {
    padding: '10px', background: color, color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontWeight: '600', fontSize: '13px'
  }
}

function Mapa({ usuario, onAccion }) {
  const [corrales, setCorrales] = useState([])
  const [loading, setLoading] = useState(true)

  const cargarMapa = async () => {
    setLoading(true)
    try {
      const res = await api.get('/mapa')
      setCorrales(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarMapa() }, [])

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando mapa...</div>

  const zonasFiltradas = usuario.rol === 'admin' || usuario.rol === 'encargado_general'
    ? ZONAS
    : ZONAS.filter(z => z.toLowerCase() === usuario.rol)

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>🗺️ Mapa de Corrales</h2>
        <button onClick={cargarMapa} style={btnStyle('#555')}>🔄 Actualizar</button>
      </div>

      {zonasFiltradas.map(zona => {
        const corralesZona = corrales.filter(c => c.zona === zona)
        const ocupados = corralesZona.filter(c => c.poblacion_actual > 0).length
        const totalAnim = corralesZona.reduce((s, c) => s + c.poblacion_actual, 0)

        return (
          <div key={zona} style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px', color: '#444' }}>
              {ZONA_ICONOS[zona]} {zona} — {ocupados}/{corralesZona.length} ocupados · {totalAnim} animales
            </h3>
            {corralesZona.map(c => (
              <TarjetaCorral key={c.id} row={c} onAccion={onAccion} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default Mapa