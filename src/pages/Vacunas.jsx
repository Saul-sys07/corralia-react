import { useState, useEffect } from 'react'
import api from '../services/api'

const VACUNAS_PARIDERAS = {
  'Crías': [
    'Hierro — 1ra dosis (día 3)',
    'Hierro — 2da dosis (día 8)',
    'Hierro — 3ra dosis (día 20)',
    'Complejo B vitamina (al mes)',
    'Complejo B vitamina — refuerzo',
    'Vitamina + Parmisole (al destetar)',
    'Emicina — diarrea',
    'Castración (días 15-20)',
  ],
  'Pie de Cría': [
    'Parvovirus + Leptospirosis + Erisipela (dosis 1)',
    'Parvovirus + Leptospirosis + Erisipela (dosis 2)',
    'Refuerzo PPL + Rinitis Atrófica (antes del parto)',
    'Peste Porcina Clásica',
  ],
  'Semental': [
    'Parvovirus + Leptospirosis + Erisipela (semestral)',
    'Peste Porcina Clásica (semestral)',
  ],
}

const VACUNAS_GENERAL = {
  'Crías': ['Se inyectó'],
  'Destete': ['Se inyectó'],
  'Desarrollo': ['Se inyectó'],
  'Engorda': ['Se inyectó'],
  'Pie de Cría': ['Se inyectó'],
  'Semental': ['Se inyectó'],
}

function Vacunas({ usuario, onVolver }) {
  const [tab, setTab] = useState('registrar')
  const [corrales, setCorrales] = useState([])
  const [historial, setHistorial] = useState([])

  const cargarDatos = async () => {
    const [map, hist] = await Promise.all([
      api.get('/mapa'),
      api.get('/vacunas/historial')
    ])
    setCorrales(map.data.filter(c => c.poblacion_actual > 0))
    setHistorial(hist.data)
  }

  useEffect(() => { cargarDatos() }, [])

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 16px' }}>💉 Vacunas y Castraciones</h2>

{onVolver && (
  <button onClick={onVolver} style={{
    background: 'none', border: 'none', color: '#1976D2',
    fontSize: '14px', cursor: 'pointer', marginBottom: '12px', padding: 0
  }}>← Regresar al mapa</button>
)}

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[['registrar', '📝 Registrar'], ['historial', '📋 Historial']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
            background: tab === key ? '#1976D2' : '#f0f0f0',
            color: tab === key ? 'white' : '#555',
            fontWeight: tab === key ? '700' : '400',
            cursor: 'pointer', fontSize: '14px'
          }}>{label}</button>
        ))}
      </div>

      {tab === 'registrar' && <RegistrarVacuna corrales={corrales} usuario={usuario} onExito={cargarDatos} />}
      {tab === 'historial' && <Historial historial={historial} />}
    </div>
  )
}

function RegistrarVacuna({ corrales, usuario, onExito }) {
  const ZONA_MAP = { gestacion: 'Gestacion', parideras: 'Parideras', crecimiento: 'Crecimiento' }
  const zonaRol = ZONA_MAP[usuario.rol]
  const corralesFiltrados = zonaRol ? corrales.filter(c => c.zona === zonaRol) : corrales

  const [corral, setCorral] = useState(null)
  const [tipoAnimal, setTipoAnimal] = useState('')
  const [vacuna, setVacuna] = useState('')
  const [nombreComercial, setNombreComercial] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)

  const tipos = corral?.tipo_animal?.split(' / ').map(t => t.trim()).filter(t => t !== 'VACIO') || []
  const esParideras = ['parideras', 'encargado_general', 'admin'].includes(usuario.rol)
const catalogo = esParideras ? VACUNAS_PARIDERAS : VACUNAS_GENERAL
const vacunasSugeridas = catalogo[tipoAnimal] || ['Se inyectó']

  const confirmar = async () => {
    if (!corral || !tipoAnimal || !vacuna) return
    setLoading(true)
    try {
      await api.post('/vacunas', {
        id_chiquero: corral.id,
        tipo_animal: tipoAnimal,
        vacuna,
        nombre_comercial: nombreComercial,
        cantidad,
        notas
      })
      setCorral(null)
      setTipoAnimal('')
      setVacuna('')
      setNombreComercial('')
      setCantidad(1)
      setNotas('')
      onExito()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Corral */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Corral:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {corralesFiltrados.map(c => (
            <button key={c.id} onClick={() => { setCorral(c); setTipoAnimal(''); setVacuna('') }}
              style={{
                padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                border: corral?.id === c.id ? '2px solid #1976D2' : '2px solid #ddd',
                background: corral?.id === c.id ? '#e3f2fd' : 'white',
                textAlign: 'left', fontSize: '14px'
              }}>
              <strong>{c.nombre}</strong> — {c.tipo_animal} ({c.poblacion_actual} animales)
            </button>
          ))}
        </div>
      </div>

      {/* Tipo animal */}
      {corral && tipos.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Tipo de animal:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tipos.map(t => (
              <button key={t} onClick={() => { setTipoAnimal(t); setVacuna('') }}
                style={chipStyle(tipoAnimal === t, '#1976D2')}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vacuna */}
      {tipoAnimal && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Vacuna / Procedimiento:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[...vacunasSugeridas, 'Otra'].map(v => (
              <button key={v} onClick={() => setVacuna(v)}
                style={{
                  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                  border: vacuna === v ? '2px solid #1976D2' : '2px solid #ddd',
                  background: vacuna === v ? '#e3f2fd' : 'white',
                  textAlign: 'left', fontSize: '14px'
                }}>
                {v}
              </button>
            ))}
          </div>
          {vacuna === 'Otra' && (
            <input type="text" placeholder="Especifica la vacuna"
              onChange={e => setVacuna(e.target.value)}
              style={{ ...inputStyle, marginTop: '8px' }} />
          )}
        </div>
      )}

      {/* Nombre comercial */}
      {vacuna && vacuna !== 'Otra' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Nombre comercial (opcional):</label>
          <input type="text" value={nombreComercial}
            onChange={e => setNombreComercial(e.target.value)}
            placeholder="Ej: Porcilis PCV, Calvenza..."
            style={inputStyle} />
        </div>
      )}

      {/* Cantidad */}
      {vacuna && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Animales tratados (máx {corral?.poblacion_actual}):</label>
          <input type="number" min={1} max={corral?.poblacion_actual} value={cantidad}
            onChange={e => setCantidad(Number(e.target.value))}
            style={inputStyle} />
        </div>
      )}

      {/* Notas */}
      {vacuna && (
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Notas (opcional):</label>
          <input type="text" value={notas}
            onChange={e => setNotas(e.target.value)}
            style={inputStyle} />
        </div>
      )}

      <button onClick={confirmar}
        disabled={loading || !corral || !tipoAnimal || !vacuna}
        style={{
          width: '100%', padding: '14px',
          background: loading || !corral || !tipoAnimal || !vacuna ? '#ccc' : '#1976D2',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Registrando...' : 'Confirmar'}
      </button>
    </div>
  )
}

function Historial({ historial }) {
  if (historial.length === 0) return <p style={{ color: '#888' }}>Sin vacunaciones registradas.</p>

  return (
    <div>
      {historial.map((r, i) => (
        <div key={i} style={{
          borderLeft: '4px solid #1976D2', padding: '8px 12px',
          background: '#f9f9f9', borderRadius: '3px', marginBottom: '6px'
        }}>
          <small style={{ color: '#888' }}>
            {r.fecha ? new Date(r.fecha).toLocaleDateString('es-MX') : '?'} — {r.usuario_id} — {r.corral}
          </small>
          <br />
          <strong>{r.vacuna}</strong>
          {r.nombre_comercial && <span style={{ color: '#666' }}> ({r.nombre_comercial})</span>}
          <br />
          <span style={{ fontSize: '13px', color: '#555' }}>{r.cantidad} {r.tipo_animal}</span>
          {r.notas && <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{r.notas}</div>}
        </div>
      ))}
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

export default Vacunas