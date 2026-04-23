import { useState, useEffect } from 'react'
import api from '../services/api'

function Ventas() {
  const [tab, setTab] = useState('historial')
  const [historial, setHistorial] = useState([])
  const [comisiones, setComisiones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/ventas/historial'),
      api.get('/ventas/comisiones')
    ]).then(([hist, com]) => {
      setHistorial(hist.data)
      setComisiones(com.data)
      setLoading(false)
    })
  }, [])

  const totalMes = historial.reduce((s, v) => s + parseFloat(v.total_rancho), 0)
  const totalComisiones = historial.reduce((s, v) => s + parseFloat(v.total_comision), 0)

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 16px' }}>💰 Ventas</h2>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <div style={{
          background: '#f1f8e9', border: '2px solid #2E7D32',
          borderRadius: '10px', padding: '12px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Al rancho</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#2E7D32' }}>
            ${totalMes.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </div>
        </div>
        <div style={{
          background: '#fff8e1', border: '2px solid #F57F17',
          borderRadius: '10px', padding: '12px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#666' }}>En comisiones</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#F57F17' }}>
            ${totalComisiones.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[['historial', '📋 Historial'], ['comisiones', '💵 Comisiones']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
            background: tab === key ? '#2E7D32' : '#f0f0f0',
            color: tab === key ? 'white' : '#555',
            fontWeight: tab === key ? '700' : '400',
            cursor: 'pointer', fontSize: '14px'
          }}>{label}</button>
        ))}
      </div>

      {loading && <p style={{ color: '#888' }}>Cargando...</p>}

      {/* Historial */}
      {tab === 'historial' && !loading && (
        <div>
          {historial.length === 0 ? (
            <p style={{ color: '#888' }}>Sin ventas registradas.</p>
          ) : historial.map((v, i) => (
            <div key={i} style={{
              border: '1px solid #ddd', borderRadius: '10px',
              padding: '12px', marginBottom: '8px', background: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>
                  {v.fecha ? new Date(v.fecha).toLocaleDateString('es-MX') : '?'}
                </span>
                <strong style={{ color: '#2E7D32' }}>
                  ${parseFloat(v.total_rancho).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div style={{ fontSize: '14px' }}>
                <strong>{v.cliente}</strong>
                <span style={{ color: '#888' }}> — {v.tipo_cliente}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
  Registrado por: {v.registrado_por} · Comisión para: {v.vendedor_cliente}
  {' · '}{v.cantidad} {v.tipo_animal}
  {v.peso_kg > 0 && ` · ${v.peso_kg}kg`}
</div>
              {v.total_comision > 0 && (
                <div style={{ fontSize: '12px', color: '#F57F17', marginTop: '2px' }}>
                  Comisión: ${parseFloat(v.total_comision).toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comisiones */}
      {tab === 'comisiones' && !loading && (
        <div>
          {comisiones.length === 0 ? (
            <p style={{ color: '#888' }}>Sin comisiones registradas.</p>
          ) : comisiones.map((c, i) => (
            <div key={i} style={{
              borderLeft: '4px solid #2E7D32', padding: '12px',
              background: '#f9f9f9', borderRadius: '3px', marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{c.vendedor}</strong>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                    {c.num_ventas} ventas · {parseFloat(c.kg_vendidos).toFixed(0)}kg vendidos
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#2E7D32' }}>
                    ${parseFloat(c.total_comision).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>en comisiones</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Ventas