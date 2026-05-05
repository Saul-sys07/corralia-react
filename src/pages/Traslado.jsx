import { useState, useEffect } from 'react'
import api from '../services/api'

const TIPOS_ANIMAL = [
  'Semental', 'Pie de Cría', 'Crías', 'Destete',
  'Desarrollo', 'Engorda', 'Herniados', 'Desecho'
]

const SUSTITUTOS = ['Desarrollo', 'Engorda']

function getEtapasDestino(tipoActual) {
  const idx = TIPOS_ANIMAL.indexOf(tipoActual)
  const siguientes = idx >= 0 ? TIPOS_ANIMAL.slice(idx + 1) : []
  if (SUSTITUTOS.includes(tipoActual)) {
    return ['Semental', 'Pie de Cría', ...siguientes]
  }
  return siguientes
}

function Traslado({ corral, usuario, onVolver }) {
  const tipos = corral.tipo_animal?.split(' / ').map(t => t.trim()).filter(t => t !== 'VACIO') || []
  const [tipoAnimal, setTipoAnimal] = useState(tipos[0] || '')
  const [cantidad, setCantidad] = useState(1)
  const [avanzaEtapa, setAvanzaEtapa] = useState(false)
  const [nuevaEtapa, setNuevaEtapa] = useState('')
  const [corralesDestino, setCorralesDestino] = useState([])
  const [destino, setDestino] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingCorrales, setLoadingCorrales] = useState(false)
  const [error, setError] = useState('')

  const disponible = corral.poblacion_actual || 0
  const etapasDestino = getEtapasDestino(tipoAnimal)
  const tipoDestino = avanzaEtapa && nuevaEtapa ? nuevaEtapa : tipoAnimal

  // Candados por zona
  const ZONA_DESTINO = {
    gestacion: 'Parideras',
    parideras: tipoDestino === 'Pie de Cría' ? 'Gestacion' : tipoDestino === 'Crías' ? 'Crecimiento' : null,
    crecimiento: !['Pie de Cría', 'Semental'].includes(tipoDestino) ? 'Crecimiento' : 'Gestacion',
  }
  const zonaFiltro = ZONA_DESTINO[usuario.rol] || null

  useEffect(() => {
    if (!tipoAnimal) return
    setLoadingCorrales(true)
    setDestino(null)
    api.get(`/corrales-destino?tipo_animal=${tipoDestino}&excluir_id=${corral.id}`)
      .then(res => {
        let lista = res.data
        if (zonaFiltro) lista = lista.filter(c => c.zona === zonaFiltro)
        setCorralesDestino(lista)
      })
      .finally(() => setLoadingCorrales(false))
  }, [tipoAnimal, nuevaEtapa, avanzaEtapa])

  const handleConfirmar = async () => {
    if (!destino || cantidad < 1) return
    setLoading(true)
    setError('')
    try {
      await api.post('/traslado', {
        id_origen: corral.id,
        id_destino: destino.id,
        tipo_animal: tipoAnimal,
        cantidad,
        nueva_etapa: avanzaEtapa && nuevaEtapa ? nuevaEtapa : null
      })
      onVolver(true)
    } catch (e) {
      setError('Error al registrar traslado')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <button onClick={() => onVolver(false)} style={{
        background: 'none', border: 'none', color: '#1976D2',
        fontSize: '16px', cursor: 'pointer', marginBottom: '16px'
      }}>← Regresar</button>

      <h2 style={{ margin: '0 0 4px' }}>🔄 Traslado</h2>
      <p style={{ color: '#888', margin: '0 0 20px' }}>{corral.nombre} · {corral.zona}</p>

      {/* Tipo animal */}
      {tipos.length > 1 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Tipo de animal:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tipos.map(t => (
              <button key={t} onClick={() => { setTipoAnimal(t); setNuevaEtapa(''); setAvanzaEtapa(false) }}
                style={chipStyle(tipoAnimal === t, '#1976D2')}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cantidad */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Cantidad (máx {disponible}):</label>
        <input type="number" min={1} max={disponible} value={cantidad}
          onChange={e => setCantidad(Number(e.target.value))}
          style={inputStyle} />
      </div>

      {/* Avanza etapa */}
      {etapasDestino.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>¿Avanzan de etapa?</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setAvanzaEtapa(false); setNuevaEtapa('') }}
              style={chipStyle(!avanzaEtapa, '#555')}>No, misma etapa</button>
            <button onClick={() => setAvanzaEtapa(true)}
              style={chipStyle(avanzaEtapa, '#555')}>Sí, cambian</button>
          </div>
        </div>
      )}

      {avanzaEtapa && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Nueva etapa:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {etapasDestino.map(e => (
              <button key={e} onClick={() => setNuevaEtapa(e)}
                style={chipStyle(nuevaEtapa === e, '#6A1B9A')}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Corrales destino */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Corral destino:</label>
        {loadingCorrales ? (
          <p style={{ color: '#888' }}>Cargando corrales...</p>
        ) : corralesDestino.length === 0 ? (
          <p style={{ color: '#C62828' }}>No hay corrales disponibles</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {corralesDestino.map(c => {
              const pct = c.capacidad_max > 0 ? c.poblacion_actual / c.capacidad_max : 0
              const semaforo = pct === 0 ? { bg: '#f1f8e9', border: '#81C784', texto: '#2E7D32' }
                : pct < 0.5 ? { bg: '#f1f8e9', border: '#81C784', texto: '#2E7D32' }
                  : pct < 0.85 ? { bg: '#fff8e1', border: '#FFD54F', texto: '#F57F17' }
                    : { bg: '#ffebee', border: '#EF9A9A', texto: '#C62828' }
              const seleccionado = destino?.id === c.id
              return (
                <button key={c.id} onClick={() => setDestino(c)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                    border: seleccionado ? '2px solid #1976D2' : `2px solid ${semaforo.border}`,
                    background: seleccionado ? '#e3f2fd' : semaforo.bg,
                    textAlign: 'left', fontSize: '14px', width: '100%'
                  }}>
                  <strong style={{ color: seleccionado ? '#1976D2' : semaforo.texto }}>{c.nombre}</strong>
                  <span style={{ color: '#666', fontSize: '13px' }}> — {c.zona} · {c.poblacion_actual}/{c.capacidad_max}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error && <p style={{ color: '#C62828', marginBottom: '12px' }}>{error}</p>}

      <button onClick={handleConfirmar}
        disabled={loading || !destino || cantidad < 1 || cantidad > disponible}
        style={{
          width: '100%', padding: '14px',
          background: loading || !destino ? '#ccc' : '#1976D2',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Registrando...' : `Trasladar ${cantidad} ${tipoAnimal}${avanzaEtapa && nuevaEtapa ? ` → ${nuevaEtapa}` : ''}`}
      </button>
    </div>
  )
}

const labelStyle = { display: 'block', fontWeight: '600', marginBottom: '8px', color: '#444' }
const inputStyle = { width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }
const chipStyle = (activo, color) => ({
  padding: '8px 14px', borderRadius: '20px', cursor: 'pointer',
  border: activo ? `2px solid ${color}` : '2px solid #ddd',
  background: activo ? `${color}15` : 'white',
  color: activo ? color : '#666',
  fontWeight: activo ? '700' : '400', fontSize: '13px'
})

export default Traslado