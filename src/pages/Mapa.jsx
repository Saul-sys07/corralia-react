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
  const esZonaParideras = row.zona === 'Parideras'
  const esZonaGestacion = row.zona === 'Gestacion'

  return (
    <div style={{ marginBottom: '8px' }}>
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
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>{row.nombre}</div>
          {row.poblacion_actual > 0 && (
            <div style={{ fontSize: '12px', color: '#666' }}>{row.tipo_animal}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: '700', color: sem.color }}>{row.poblacion_actual}/{row.capacidad_max}</div>
          <div style={{ fontSize: '11px', color: '#aaa' }}>{expandida ? '▲ cerrar' : '▼ ver'}</div>
        </div>
      </div>

      {expandida && (
        <div style={{
          border: `2px solid ${sem.color}`, borderTop: 'none',
          borderRadius: '0 0 10px 10px', padding: '12px',
          background: 'white'
        }}>
          {/* Barra de capacidad */}
          <div style={{
            background: '#e0e0e0', borderRadius: '20px',
            height: '6px', overflow: 'hidden', marginBottom: '8px'
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: sem.color, borderRadius: '20px',
              transition: 'width 0.3s'
            }} />
          </div>

          <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
            {row.area_m2 ? `${parseFloat(row.area_m2).toFixed(1)} m² · ` : ''}{sem.estado}
            {row.estado_pie_cria && ` · ${row.estado_pie_cria}`}
            {row.fecha_parto && (
              <span style={{ color: '#E65100', marginLeft: '4px' }}>
                · Parto: {new Date(row.fecha_parto).toLocaleDateString('es-MX')}
              </span>
            )}
          </div>

          {/* Botones de acción */}
          {row.poblacion_actual > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button onClick={() => onAccion('traspaso', row)} style={btnAccion('#1565C0', '#E3F2FD')}>
                🔄 Traslado
              </button>
              <button onClick={() => onAccion('muerte', row)} style={btnAccion('#C62828', '#FFEBEE')}>
                💀 Muerte
              </button>
              <button onClick={() => onAccion('etapa', row)} style={btnAccion('#4A148C', '#F3E5F5')}>
                📦 Etapa
              </button>
              {tieneVendibles && (
                <button onClick={() => onAccion('venta', row)} style={btnAccion('#1B5E20', '#E8F5E9')}>
                  💰 Venta
                </button>
              )}
              {esZonaParideras && tienePieCria && (
                <button onClick={() => onAccion('parto', row)} style={btnAccion('#BF360C', '#FBE9E7')}>
                  🍼 Parto
                </button>
              )}
              {esZonaGestacion && tienePieCria && row.estado_pie_cria === 'Disponible' && (
                <button onClick={() => onAccion('monta', row)} style={btnAccion('#00695C', '#E0F2F1')}>
                  🐷 Monta
                </button>
              )}
              {esZonaGestacion && tienePieCria && row.estado_pie_cria === 'Montada' && (
                <button onClick={() => onAccion('verificar_preñez', row)} style={btnAccion('#E65100', '#FFF3E0')}>
                  🔍 Verificar preñez
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function btnAccion(colorTexto, colorFondo) {
  return {
    padding: '10px', background: colorFondo, color: colorTexto,
    border: `1px solid ${colorTexto}`, borderRadius: '8px', cursor: 'pointer',
    fontWeight: '700', fontSize: '13px'
  }
}

function SeccionZona({ zona, corrales, onAccion }) {
  const [colapsada, setColapsada] = useState(false)
  const ocupados = corrales.filter(c => c.poblacion_actual > 0).length
  const totalAnim = corrales.reduce((s, c) => s + c.poblacion_actual, 0)
  const rojos = corrales.filter(c => getSemaforo(c).estado === 'EXCEDIDO').length
  const amarillos = corrales.filter(c => getSemaforo(c).estado === 'AL LÍMITE').length

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Header de zona clickeable */}
      <div
        onClick={() => setColapsada(!colapsada)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: '#2E7D32', color: 'white',
          borderRadius: colapsada ? '10px' : '10px 10px 0 0',
          cursor: 'pointer', userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{ZONA_ICONOS[zona]}</span>
          <span style={{ fontWeight: '700', fontSize: '16px' }}>{zona}</span>
          <span style={{ fontSize: '13px', opacity: 0.8 }}>
            {ocupados}/{corrales.length} · {totalAnim} animales
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {rojos > 0 && <span style={{ background: '#C62828', borderRadius: '10px', padding: '2px 8px', fontSize: '12px' }}>🔴 {rojos}</span>}
          {amarillos > 0 && <span style={{ background: '#F57F17', borderRadius: '10px', padding: '2px 8px', fontSize: '12px' }}>🟡 {amarillos}</span>}
          <span style={{ fontSize: '18px' }}>{colapsada ? '▶' : '▼'}</span>
        </div>
      </div>

      {/* Corrales de la zona */}
      {!colapsada && (
        <div style={{
          border: '2px solid #2E7D32', borderTop: 'none',
          borderRadius: '0 0 10px 10px', padding: '10px',
          background: '#fafafa'
        }}>
          {corrales.map(c => (
            <TarjetaCorral key={c.id} row={c} onAccion={onAccion} />
          ))}
        </div>
      )}
    </div>
  )
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

  const totalAnimales = corrales.reduce((s, c) => s + c.poblacion_actual, 0)

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>🗺️ Mapa</h2>
        <button onClick={cargarMapa} style={{
          padding: '6px 12px', background: '#555', color: 'white',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'
        }}>🔄</button>
      </div>

      <div style={{
        background: '#f1f8e9', border: '1px solid #c5e1a5',
        borderRadius: '8px', padding: '8px 12px', marginBottom: '16px',
        fontSize: '13px', color: '#2E7D32', fontWeight: '600'
      }}>
        🐖 Total en rancho: {totalAnimales} animales
      </div>

      {zonasFiltradas.map(zona => {
        const corralesZona = corrales.filter(c => c.zona === zona)
        return (
          <SeccionZona
            key={zona}
            zona={zona}
            corrales={corralesZona}
            onAccion={onAccion}
          />
        )
      })}
    </div>
  )
}

export default Mapa