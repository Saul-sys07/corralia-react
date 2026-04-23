import { useState, useEffect } from 'react'
import api from '../services/api'

const ROLES = [
  { value: 'encargado_general', label: 'Encargado General' },
  { value: 'parideras', label: 'Parideras' },
  { value: 'crecimiento', label: 'Crecimiento' },
  { value: 'gestacion', label: 'Gestación' },
  { value: 'ayudante_general', label: 'Ayudante General' },
]

const ESTADOS_PC = ['Disponible', 'Cubierta', 'Gestación', 'Parida', 'Desecho']

function Configuracion() {
  const [tab, setTab] = useState('precio')
  const [precio, setPrecio] = useState(48)
  const [corrales, setCorrales] = useState([])
  const [mapa, setMapa] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [pieCria, setPieCria] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const cargar = () => {
    api.get('/configuracion/precio').then(r => setPrecio(r.data.precio))
    api.get('/configuracion/corrales').then(r => setCorrales(r.data))
    api.get('/mapa').then(r => setMapa(r.data))
    api.get('/usuarios').then(r => setUsuarios(r.data))
    api.get('/configuracion/pie-de-cria').then(r => setPieCria(r.data))
  }

  useEffect(() => { cargar() }, [])

  const guardarPrecio = async () => {
    setLoading(true)
    await api.post(`/configuracion/precio?precio=${precio}`)
    setMensaje('✅ Precio actualizado')
    setLoading(false)
    setTimeout(() => setMensaje(''), 3000)
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 16px' }}>⚙️ Configuración</h2>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          ['precio', '💲 Precio'],
          ['nuclear', '☢️ Reset'],
          ['piecria', '🐷 Pie de Cría'],
          ['animales', '📦 Animales'],
          ['corrales', '🏠 Corrales'],
          ['usuarios', '👥 Usuarios'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
            background: tab === key ? '#2E7D32' : '#f0f0f0',
            color: tab === key ? 'white' : '#555',
            fontWeight: tab === key ? '700' : '400',
            cursor: 'pointer', fontSize: '11px'
          }}>{label}</button>
        ))}
      </div>

      {mensaje && (
        <div style={{
          background: '#f1f8e9', border: '1px solid #c5e1a5',
          borderRadius: '8px', padding: '10px', marginBottom: '12px',
          color: '#2E7D32', fontWeight: '600'
        }}>{mensaje}</div>
      )}
        {tab === 'nuclear' && <NuclearTab />}
      {tab === 'precio' && (
        <div>
          <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
            Precio del día que ve Beyin al registrar ventas
          </p>
          <label style={labelStyle}>Precio por kg ($):</label>
          <input type="number" min={0} step={0.5} value={precio}
            onChange={e => setPrecio(Number(e.target.value))}
            style={inputStyle} />
          <button onClick={guardarPrecio} disabled={loading}
            style={{
              width: '100%', padding: '14px', marginTop: '12px',
              background: loading ? '#ccc' : '#2E7D32',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer'
            }}>
            {loading ? 'Guardando...' : `Guardar — $${precio}/kg`}
          </button>
        </div>
      )}

      {tab === 'piecria' && (
        <PieCriaTab pieCria={pieCria} onRefresh={cargar} setMensaje={setMensaje} />
      )}

      {tab === 'animales' && (
        <RegistrarAnimales corrales={corrales} mapa={mapa} onRefresh={cargar} setMensaje={setMensaje} />
      )}

      {tab === 'corrales' && (
        <div>
          <p style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>
            {corrales.length} corrales registrados
          </p>
          {['Parideras', 'Gestacion', 'Crecimiento'].map(zona => (
            <div key={zona} style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px', color: '#444' }}>{zona}</h4>
              {corrales.filter(c => c.zona === zona).map((c, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 12px', background: '#f9f9f9',
                  borderRadius: '8px', marginBottom: '4px', fontSize: '14px'
                }}>
                  <span><strong>{c.nombre}</strong> — {c.tipo}</span>
                  <span style={{ color: '#888' }}>
                    Cap: {c.capacidad_max} · {parseFloat(c.area_m2).toFixed(1)}m²
                  </span>
                </div>
              ))}
            </div>
          ))}
          <CrearCorral onRefresh={cargar} setMensaje={setMensaje} />
        </div>
      )}

      {tab === 'usuarios' && (
        <UsuariosTab usuarios={usuarios} onRefresh={cargar} setMensaje={setMensaje} />
      )}
    </div>
  )
}

function PieCriaTab({ pieCria, onRefresh, setMensaje }) {
  const [estados, setEstados] = useState({})
  const [fechas, setFechas] = useState({})

  useEffect(() => {
    const e = {}, f = {}
    pieCria.forEach(p => {
      e[p.id] = p.estado_pie_cria || 'Disponible'
      f[p.id] = p.fecha_monta ? p.fecha_monta.split('T')[0] : ''
    })
    setEstados(e)
    setFechas(f)
  }, [pieCria])

  const guardar = async (lote) => {
    await api.post('/configuracion/pie-de-cria', {
      lote_id: lote.id,
      estado: estados[lote.id],
      fecha_monta: fechas[lote.id] || null
    })
    setMensaje(`✅ ${lote.corral} actualizado`)
    setTimeout(() => setMensaje(''), 3000)
    onRefresh()
  }

  if (pieCria.length === 0) return (
    <p style={{ color: '#888' }}>No hay Pie de Cría registrado.</p>
  )

  return (
    <div>
      <p style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>
        Registra el estado actual de las cerdas — el sistema calculará el parto estimado a 114 días de la monta
      </p>
      {pieCria.map((lote, i) => (
        <div key={i} style={{
          border: '1px solid #ddd', borderRadius: '10px',
          padding: '12px', marginBottom: '12px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>{lote.corral}</strong>
            <span style={{ color: '#888', fontSize: '13px' }}> · {lote.poblacion_actual} Pie de Cría</span>
            {lote.fecha_parto_estimada && (
              <div style={{ fontSize: '12px', color: '#E65100', marginTop: '2px' }}>
                Parto estimado: {new Date(lote.fecha_parto_estimada).toLocaleDateString('es-MX')}
              </div>
            )}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={labelStyle}>Estado:</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ESTADOS_PC.map(e => (
                <button key={e}
                  onClick={() => setEstados({ ...estados, [lote.id]: e })}
                  style={chipStyle(estados[lote.id] === e)}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          {['Cubierta', 'Gestación', 'Parida'].includes(estados[lote.id]) && (
            <div style={{ marginBottom: '8px' }}>
              <label style={labelStyle}>Fecha de monta:</label>
              <input type="date" value={fechas[lote.id] || ''}
                onChange={e => setFechas({ ...fechas, [lote.id]: e.target.value })}
                style={inputStyle} />
              {fechas[lote.id] && (
                <small style={{ color: '#666' }}>
                  Parto estimado: {new Date(new Date(fechas[lote.id]).getTime() + 114 * 86400000).toLocaleDateString('es-MX')}
                </small>
              )}
            </div>
          )}
          <button onClick={() => guardar(lote)} style={{
            width: '100%', padding: '10px',
            background: '#2E7D32', color: 'white',
            border: 'none', borderRadius: '8px',
            fontWeight: '700', cursor: 'pointer'
          }}>
            Guardar {lote.corral}
          </button>
        </div>
      ))}
    </div>
  )
}

function RegistrarAnimales({ corrales, mapa, onRefresh, setMensaje }) {
  const TIPOS = ['Semental', 'Pie de Cría', 'Crías', 'Destete',
                 'Desarrollo', 'Engorda', 'Herniados', 'Desecho']
  const ZONAS = ['Parideras', 'Gestacion', 'Crecimiento']

  const [zona, setZona] = useState('Parideras')
  const [corralId, setCorralId] = useState(null)
  const [tipo, setTipo] = useState('Desarrollo')
  const [cantidad, setCantidad] = useState(1)
  const [loading, setLoading] = useState(false)

  const corralesFiltrados = corrales.filter(c => c.zona === zona)

  // Obtener poblacion actual del mapa
  const getPoblacion = (id) => {
    const c = mapa.find(m => m.id === id)
    return c ? c.poblacion_actual : 0
  }

  const confirmar = async () => {
    if (!corralId) return
    setLoading(true)
    try {
      await api.post('/configuracion/registrar-animales', {
        id_chiquero: corralId,
        tipo_animal: tipo,
        cantidad
      })
      setMensaje(`✅ ${cantidad} ${tipo} registrados`)
      setTimeout(() => setMensaje(''), 3000)
      onRefresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px' }}>
        Registra animales existentes en el rancho
      </p>

      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Zona:</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {ZONAS.map(z => (
            <button key={z} onClick={() => { setZona(z); setCorralId(null) }}
              style={chipStyle(zona === z)}>{z}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Corral:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {corralesFiltrados.map(c => {
            const pob = getPoblacion(c.id)
            const espacio = c.capacidad_max - pob
            const color = espacio <= 0 ? '#C62828' : espacio <= 2 ? '#F57F17' : '#2E7D32'
            return (
              <button key={c.id} onClick={() => setCorralId(c.id)}
                style={{
                  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                  border: corralId === c.id ? '2px solid #2E7D32' : '2px solid #ddd',
                  background: corralId === c.id ? '#f1f8e9' : 'white',
                  textAlign: 'left', fontSize: '14px'
                }}>
                <strong>{c.nombre}</strong>
                <span style={{ color: '#666' }}> — {c.tipo}</span>
                <span style={{ float: 'right', color, fontWeight: '700' }}>
                  {pob}/{c.capacidad_max}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Tipo de animal:</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TIPOS.map(t => (
            <button key={t} onClick={() => setTipo(t)}
              style={chipStyle(tipo === t)}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Cantidad:</label>
        <input type="number" min={1} value={cantidad}
          onChange={e => setCantidad(Number(e.target.value))}
          style={inputStyle} />
      </div>

      <button onClick={confirmar} disabled={loading || !corralId}
        style={{
          width: '100%', padding: '14px',
          background: loading || !corralId ? '#ccc' : '#2E7D32',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Registrando...' : `Registrar ${cantidad} ${tipo}`}
      </button>
    </div>
  )
}

function CrearCorral({ onRefresh, setMensaje }) {
  const TIPOS_CORRAL = ['Paridera', 'Comunal', 'Semental']
  const ZONAS = ['Parideras', 'Gestacion', 'Crecimiento']

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('Comunal')
  const [zona, setZona] = useState('Crecimiento')
  const [largo, setLargo] = useState('')
  const [ancho, setAncho] = useState('')
  const [capacidad, setCapacidad] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const area = largo && ancho ? (largo * ancho).toFixed(2) : 0

  const confirmar = async () => {
    if (!nombre || !largo || !ancho || !capacidad) return
    setLoading(true)
    setError('')
    try {
      await api.post('/configuracion/corrales', {
        nombre, tipo, zona,
        largo: Number(largo), ancho: Number(ancho),
        capacidad_max: Number(capacidad)
      })
      setNombre('')
      setLargo('')
      setAncho('')
      setCapacidad('')
      setMensaje(`✅ Corral ${nombre} creado`)
      setTimeout(() => setMensaje(''), 3000)
      onRefresh()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear corral')
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
      <h4 style={{ margin: '0 0 12px' }}>➕ Nuevo corral</h4>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Nombre:</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Ej: chiquero 9" style={inputStyle} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Tipo:</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {TIPOS_CORRAL.map(t => (
            <button key={t} onClick={() => setTipo(t)}
              style={chipStyle(tipo === t)}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Zona:</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {ZONAS.map(z => (
            <button key={z} onClick={() => setZona(z)}
              style={chipStyle(zona === z)}>{z}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>Largo (m):</label>
          <input type="number" min={0} step={0.1} value={largo}
            onChange={e => setLargo(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Ancho (m):</label>
          <input type="number" min={0} step={0.1} value={ancho}
            onChange={e => setAncho(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Capacidad:</label>
          <input type="number" min={1} value={capacidad}
            onChange={e => setCapacidad(e.target.value)} style={inputStyle} />
        </div>
      </div>
      {area > 0 && (
        <p style={{ color: '#666', fontSize: '13px', margin: '0 0 12px' }}>
          Área: {area} m²
        </p>
      )}
      {error && <p style={{ color: '#C62828', marginBottom: '8px' }}>{error}</p>}
      <button onClick={confirmar}
        disabled={loading || !nombre || !largo || !ancho || !capacidad}
        style={{
          width: '100%', padding: '12px',
          background: loading || !nombre || !largo || !ancho || !capacidad ? '#ccc' : '#1976D2',
          color: 'white', border: 'none', borderRadius: '8px',
          fontWeight: '700', cursor: 'pointer'
        }}>
        {loading ? 'Creando...' : `Crear ${nombre || 'corral'}`}
      </button>
    </div>
  )
}

function UsuariosTab({ usuarios, onRefresh, setMensaje }) {
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('crecimiento')
  const [pin, setPin] = useState('')
  const [resetPins, setResetPins] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleUsuario = async (id) => {
    await api.post(`/usuarios/toggle?usuario_id=${id}`)
    onRefresh()
  }

  const crearUsuario = async () => {
    if (!nombre || !pin) return
    setLoading(true)
    setError('')
    try {
      await api.post('/usuarios', { nombre, rol, pin_temporal: pin })
      setNombre('')
      setPin('')
      setMostrarNuevo(false)
      setMensaje('✅ Usuario creado')
      setTimeout(() => setMensaje(''), 3000)
      onRefresh()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear usuario')
      setLoading(false)
    }
  }

  const resetearPin = async (id) => {
    const nuevoPIN = resetPins[id]
    if (!nuevoPIN || nuevoPIN.length < 4) return
    await api.post('/usuarios/reset-pin', { usuario_id: id, nuevo_pin: nuevoPIN })
    setResetPins({ ...resetPins, [id]: '' })
    setMensaje('✅ PIN restablecido')
    setTimeout(() => setMensaje(''), 3000)
  }

  return (
    <div>
      <button onClick={() => setMostrarNuevo(!mostrarNuevo)} style={{
        width: '100%', padding: '12px', marginBottom: '16px',
        background: mostrarNuevo ? '#f0f0f0' : '#1976D2',
        color: mostrarNuevo ? '#555' : 'white',
        border: 'none', borderRadius: '10px',
        fontSize: '15px', fontWeight: '700', cursor: 'pointer'
      }}>
        {mostrarNuevo ? 'Cancelar' : '➕ Nuevo usuario'}
      </button>

      {mostrarNuevo && (
        <div style={{
          background: '#f9f9f9', border: '1px solid #ddd',
          borderRadius: '10px', padding: '16px', marginBottom: '16px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Nombre:</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              style={inputStyle} placeholder="Nombre del trabajador" />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Rol:</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ROLES.map(r => (
                <button key={r.value} onClick={() => setRol(r.value)}
                  style={chipStyle(rol === r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>PIN temporal:</label>
            <input type="text" value={pin} onChange={e => setPin(e.target.value)}
              style={inputStyle} placeholder="Mínimo 4 dígitos" />
          </div>
          {error && <p style={{ color: '#C62828', marginBottom: '8px' }}>{error}</p>}
          <button onClick={crearUsuario} disabled={loading || !nombre || !pin}
            style={{
              width: '100%', padding: '12px',
              background: loading || !nombre || !pin ? '#ccc' : '#2E7D32',
              color: 'white', border: 'none', borderRadius: '8px',
              fontWeight: '700', cursor: 'pointer'
            }}>
            {loading ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      )}

      {usuarios.map((u, i) => (
        <div key={i} style={{
          border: '1px solid #ddd', borderRadius: '10px',
          padding: '12px', marginBottom: '8px',
          borderLeft: `4px solid ${u.activo ? '#2E7D32' : '#C62828'}`,
          background: u.activo ? 'white' : '#ffebee'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <strong>{u.nombre}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>{u.rol}</div>
            </div>
            <button onClick={() => toggleUsuario(u.id)} style={{
              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
              border: 'none', fontSize: '12px', fontWeight: '600',
              background: u.activo ? '#ffebee' : '#f1f8e9',
              color: u.activo ? '#C62828' : '#2E7D32'
            }}>
              {u.activo ? 'Desactivar' : 'Activar'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="Nuevo PIN"
              value={resetPins[u.id] || ''}
              onChange={e => setResetPins({ ...resetPins, [u.id]: e.target.value })}
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
            <button onClick={() => resetearPin(u.id)}
              disabled={!resetPins[u.id] || resetPins[u.id].length < 4}
              style={{
                padding: '10px 14px', borderRadius: '8px',
                background: !resetPins[u.id] || resetPins[u.id].length < 4 ? '#ccc' : '#F57F17',
                color: 'white', border: 'none', cursor: 'pointer',
                fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap'
              }}>
              🔑 Reset PIN
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const labelStyle = { display: 'block', fontWeight: '600', marginBottom: '6px', color: '#444' }
const inputStyle = { width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }
const chipStyle = (activo) => ({
  padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
  border: activo ? '2px solid #1976D2' : '2px solid #ddd',
  background: activo ? '#e3f2fd' : 'white',
  color: activo ? '#1976D2' : '#666',
  fontWeight: activo ? '700' : '400', fontSize: '12px'
})
function NuclearTab() {
  const [confirmacion, setConfirmacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const ejecutar = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/configuracion/nuclear', { confirmacion })
      setMensaje('✅ Sistema limpiado — listo para datos reales')
      setConfirmacion('')
    } catch (e) {
      console.log('Error nuclear:', e)
      setError(e.response?.data?.detail || e.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{
        background: '#ffebee', border: '2px solid #C62828',
        borderRadius: '10px', padding: '16px', marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 8px', color: '#C62828' }}>☢️ Zona de peligro</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
          Esto borra <strong>todos los datos operativos</strong> — animales, historial, ventas, 
          finanzas, almacén, clientes y asistencias. Solo conserva los corrales y usuarios.
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#C62828', fontWeight: '600' }}>
          Úsalo solo antes de arrancar con datos reales en el rancho.
        </p>
      </div>

      {mensaje ? (
        <div style={{
          background: '#f1f8e9', border: '2px solid #2E7D32',
          borderRadius: '10px', padding: '16px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <p style={{ color: '#2E7D32', fontWeight: '700', margin: 0 }}>{mensaje}</p>
        </div>
      ) : (
        <div>
          <label style={labelStyle}>
            Escribe <strong>BORRAR TODO</strong> para confirmar:
          </label>
          <input type="text" value={confirmacion}
            onChange={e => setConfirmacion(e.target.value)}
            placeholder="BORRAR TODO"
            style={{ ...inputStyle, marginBottom: '12px' }} />

          {error && <p style={{ color: '#C62828', marginBottom: '12px' }}>{error}</p>}

          <button onClick={ejecutar}
            disabled={loading || confirmacion !== 'BORRAR TODO'}
            style={{
              width: '100%', padding: '14px',
              background: confirmacion !== 'BORRAR TODO' ? '#ccc' : '#C62828',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer'
            }}>
            {loading ? 'Borrando...' : '☢️ Ejecutar reset nuclear'}
          </button>
        </div>
      )}
    </div>
  )
}
export default Configuracion