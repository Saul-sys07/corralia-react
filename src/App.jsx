import { useState } from 'react'
import Login from './pages/Login'
import Mapa from './pages/Mapa'
import Muerte from './pages/Muerte'
import Traslado from './pages/Traslado'
import Etapa from './pages/Etapa'
import Parto from './pages/Parto'
import Venta from './pages/Venta'
import Almacen from './pages/Almacen'
import Finanzas from './pages/Finanzas'
import Checador from './pages/Checador'
import Vacunas from './pages/Vacunas'
import Reportes from './pages/Reportes'
import Clientes from './pages/Clientes'
import Ventas from './pages/Ventas'
import Configuracion from './pages/Configuracion'
import PrimerAcceso from './pages/PrimerAcceso'

function App() {
  const [usuario, setUsuario] = useState(() => {
    const u = localStorage.getItem('usuario')
    return u ? JSON.parse(u) : null
  })
  const [pagina, setPagina] = useState('mapa')
  const [corralSeleccionado, setCorralSeleccionado] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [tokenTemporal, setTokenTemporal] = useState(null)

  const handleLogin = (u, tokenTemporal) => {
    if (u.primer_acceso) {
      setUsuario(u)
      setTokenTemporal(tokenTemporal)
      setPagina('primer_acceso')
    } else {
      setUsuario(u)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    setPagina('mapa')
  }

  const handleAccion = (accion, corral) => {
    setCorralSeleccionado(corral)
    setPagina(accion)
  }

  const handleVolver = () => {
    setCorralSeleccionado(null)
    setPagina('mapa')
  }

  const irA = (pag) => {
    setPagina(pag)
    setMenuAbierto(false)
  }

  if (!usuario) return <Login onLogin={handleLogin} />

  if (pagina === 'primer_acceso') {
    return <PrimerAcceso usuario={usuario} onActivar={(u) => { setUsuario(u); setPagina('mapa') }} />
  }

  const esAccion = ['muerte', 'traspaso', 'etapa', 'parto', 'venta'].includes(pagina)

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{
        background: '#2E7D32', color: 'white',
        padding: '12px 16px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <span style={{ fontWeight: '700', fontSize: '18px' }}>🐖 Corralia</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px' }}>{usuario.nombre}</span>
          {!esAccion && (
            <button onClick={() => setMenuAbierto(!menuAbierto)} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              color: 'white', padding: '4px 10px', borderRadius: '6px',
              cursor: 'pointer', fontSize: '16px'
            }}>☰</button>
          )}
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            color: 'white', padding: '4px 10px', borderRadius: '6px',
            cursor: 'pointer', fontSize: '12px'
          }}>Salir</button>
        </div>
      </div>

      {/* Menu */}
      {menuAbierto && (
        <div style={{
          background: 'white', border: '1px solid #ddd',
          borderRadius: '0 0 10px 10px', padding: '8px',
          position: 'sticky', top: '50px', zIndex: 99,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {[
            ['mapa', '🗺️ Mapa de Corrales'],
            ...((['admin', 'encargado_general'].includes(usuario.rol)) ? [['almacen', '🏚️ Almacén']] : []),
            ...(usuario.rol === 'admin' ? [['finanzas', '💵 Finanzas']] : []),
            ['checador', '⏰ Checador'],
            ['vacunas', '💉 Vacunas'],
            ...(usuario.rol === 'admin' ? [['reportes', '📊 Reportes']] : []),
            ...(usuario.rol === 'admin' ? [['clientes', '👤 Clientes']] : []),
            ...(usuario.rol === 'admin' ? [['ventas', '💰 Ventas']] : []),
            ...(usuario.rol === 'admin' ? [['configuracion', '⚙️ Configuración']] : []),
          ].map(([pag, label]) => (
            <button key={pag} onClick={() => irA(pag)} style={{
              display: 'block', width: '100%', padding: '12px 16px',
              background: pagina === pag ? '#f1f8e9' : 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              textAlign: 'left', fontWeight: pagina === pag ? '700' : '400',
              color: pagina === pag ? '#2E7D32' : '#333', fontSize: '15px'
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* Contenido */}
      {pagina === 'mapa' && <Mapa usuario={usuario} onAccion={handleAccion} />}
      {pagina === 'almacen' && <Almacen usuario={usuario} />}
      {pagina === 'muerte' && corralSeleccionado && (
        <Muerte corral={corralSeleccionado} usuario={usuario} onVolver={handleVolver} />
      )}
      {pagina === 'traspaso' && corralSeleccionado && (
        <Traslado corral={corralSeleccionado} usuario={usuario} onVolver={handleVolver} />
      )}
      {pagina === 'etapa' && corralSeleccionado && (
        <Etapa corral={corralSeleccionado} usuario={usuario} onVolver={handleVolver} />
      )}
      {pagina === 'parto' && corralSeleccionado && (
        <Parto corral={corralSeleccionado} usuario={usuario} onVolver={handleVolver} />
      )}
      {pagina === 'venta' && corralSeleccionado && (
        <Venta corral={corralSeleccionado} usuario={usuario} onVolver={handleVolver} />
      )}
      {pagina === 'finanzas' && <Finanzas usuario={usuario} />}
      {pagina === 'checador' && <Checador usuario={usuario} />}
      {pagina === 'vacunas' && <Vacunas usuario={usuario} />}
      {pagina === 'reportes' && <Reportes />}
      {pagina === 'clientes' && <Clientes usuario={usuario} />}
      {pagina === 'ventas' && <Ventas />}
      {pagina === 'configuracion' && <Configuracion />}
    </div>
  )
}

export default App