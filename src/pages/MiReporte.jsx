import { useState, useEffect } from 'react'
import api from '../services/api'

const COLORES_EVENTO = {
  'MUERTE': { bg: '#ffebee', color: '#C62828', emoji: '💀' },
  'TRASPASO': { bg: '#e3f2fd', color: '#1565C0', emoji: '🔄' },
  'PARTO': { bg: '#f3e5f5', color: '#6A1B9A', emoji: '🍼' },
  'VENTA': { bg: '#e8f5e9', color: '#1B5E20', emoji: '💰' },
  'CAMBIO_ESTADO': { bg: '#fff8e1', color: '#F57F17', emoji: '📦' },
  'ENTRADA': { bg: '#e8f5e9', color: '#2E7D32', emoji: '➕' },
}

function MiReporte() {
  const [movimientos, setMovimientos] = useState([])
  const [filtro, setFiltro] = useState('TODOS')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/historial/movimientos').then(r => {
      setMovimientos(r.data)
      setLoading(false)
    })
  }, [])

  const tipos = ['TODOS', 'MUERTE', 'TRASPASO', 'PARTO', 'VENTA', 'CAMBIO_ESTADO']
  const filtrados = filtro === 'TODOS' ? movimientos : movimientos.filter(m => m.tipo_evento === filtro)

  if (loading) return <p style={{ padding: '16px', color: '#888' }}>Cargando...</p>

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 4px' }}>📊 Mi Reporte</h2>
      <p style={{ color: '#888', fontSize: '13px', margin: '0 0 20px' }}>Rancho Yáñez — Atlacomulco</p>

      <div>
        <h4 style={{ margin: '0 0 8px', color: '#444' }}>📜 Movimientos recientes</h4>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {tipos.map(t => {
            const cfg = COLORES_EVENTO[t] || { bg: '#f0f0f0', color: '#555', emoji: '📋' }
            const activo = filtro === t
            return (
              <button key={t} onClick={() => setFiltro(t)} style={{
                padding: '6px 10px', borderRadius: '20px', cursor: 'pointer',
                border: activo ? `2px solid ${cfg.color}` : '2px solid #ddd',
                background: activo ? cfg.bg : 'white',
                color: activo ? cfg.color : '#666',
                fontWeight: activo ? '700' : '400', fontSize: '11px'
              }}>
                {t === 'TODOS' ? '📋 Todos' : `${cfg.emoji} ${t}`}
              </button>
            )
          })}
        </div>

        {filtrados.length === 0 && <p style={{ color: '#888' }}>Sin movimientos.</p>}

        {filtrados.map((m, i) => {
          const cfg = COLORES_EVENTO[m.tipo_evento] || { bg: '#f5f5f5', color: '#555', emoji: '📋' }
          return (
            <div key={i} style={{
              border: `1px solid ${cfg.color}`, borderLeft: `4px solid ${cfg.color}`,
              borderRadius: '8px', padding: '10px 14px',
              marginBottom: '6px', background: cfg.bg
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: cfg.color, fontSize: '14px' }}>
                  {cfg.emoji} {m.tipo_evento}
                </span>
                <span style={{ fontSize: '12px', color: '#888' }}>
                  {m.fecha ? new Date(m.fecha).toLocaleString('es-MX') : '?'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#444', marginTop: '4px' }}>
                <strong>{m.cantidad} {m.tipo_animal}</strong>
                {m.corral_origen && ` · De: ${m.corral_origen}`}
                {m.corral_destino && ` → ${m.corral_destino}`}
              </div>
              {m.notas && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{m.notas}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MiReporte