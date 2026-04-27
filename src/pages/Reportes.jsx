import { useState, useEffect } from 'react'
import api from '../services/api'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function Reportes() {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [reporte, setReporte] = useState(null)
  const [ica, setIca] = useState([])
  const [loading, setLoading] = useState(false)
  const [icaInicio, setIcaInicio] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [icaFin, setIcaFin] = useState(() => new Date().toISOString().split('T')[0])

  const cargar = async () => {
    setLoading(true)
    try {
      const r = await api.get(`/reportes/mensual?mes=${mes}&anio=${anio}`)
      setReporte(r.data)
    } finally {
      setLoading(false)
    }
  }

  const cargarIca = async () => {
    const r = await api.get(`/reportes/ica?fecha_inicio=${icaInicio}&fecha_fin=${icaFin}`)
    setIca(r.data)
  }

  useEffect(() => { cargar() }, [mes, anio])
  useEffect(() => { cargarIca() }, [icaInicio, icaFin])

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 16px' }}>📊 Reporte Mensual</h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <select value={mes} onChange={e => setMes(Number(e.target.value))}
          style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}>
          {MESES.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <input type="number" value={anio} onChange={e => setAnio(Number(e.target.value))}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }} />
      </div>

      {loading && <p style={{ color: '#888', textAlign: 'center' }}>Cargando...</p>}

      {reporte && !loading && (
        <div>
          <h3 style={{ color: '#2E7D32', margin: '0 0 4px' }}>
            🐖 Rancho Yáñez — {MESES[mes-1]} {anio}
          </h3>
          <p style={{ color: '#888', margin: '0 0 16px', fontSize: '13px' }}>Atlacomulco, Estado de México</p>

          {/* Inventario */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px', color: '#444' }}>📦 Inventario actual</h4>
            {reporte.inventario.map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 12px', background: '#f9f9f9',
                borderRadius: '8px', marginBottom: '4px'
              }}>
                <span>{r.tipo_animal}</span>
                <strong>{r.total} animales</strong>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 12px', background: '#2E7D32',
              borderRadius: '8px', color: 'white', fontWeight: '700'
            }}>
              <span>Total en rancho</span>
              <span>{reporte.inventario.reduce((s, r) => s + r.total, 0)} animales</span>
            </div>
          </div>

          {/* Movimientos */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px', color: '#444' }}>📊 Movimientos del mes</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                ['🍼 Nacidos', reporte.movimientos['PARTO'] || 0, '#2E7D32'],
                ['💀 Muertes', reporte.movimientos['MUERTE'] || 0, '#C62828'],
                ['💰 Vendidos', reporte.movimientos['VENTA'] || 0, '#1976D2'],
                ['🔄 Traspasos', reporte.movimientos['TRASPASO'] || 0, '#6A1B9A'],
              ].map(([label, valor, color]) => (
                <div key={label} style={{
                  textAlign: 'center', padding: '12px',
                  background: '#f9f9f9', borderRadius: '8px',
                  borderTop: `4px solid ${color}`
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color }}>{valor}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Finanzas */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px', color: '#444' }}>💵 Finanzas del mes</h4>
            {[
              ['Depósitos recibidos', reporte.finanzas.depositos, '#1976D2', false],
              ['Ventas del mes', reporte.finanzas.ventas, '#2E7D32', false],
              ['Alimento e insumos', reporte.finanzas.almacen, '#C62828', true],
              ['Sueldos', reporte.finanzas.sueldos, '#C62828', true],
            ].map(([label, valor, color, negativo]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 12px', background: '#f9f9f9',
                borderRadius: '8px', marginBottom: '4px'
              }}>
                <span>{label}</span>
                <strong style={{ color }}>
                  {negativo ? '-' : ''}${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            ))}
            <div style={{
              background: reporte.finanzas.utilidad >= 0 ? '#f1f8e9' : '#ffebee',
              border: `2px solid ${reporte.finanzas.utilidad >= 0 ? '#2E7D32' : '#C62828'}`,
              borderRadius: '10px', padding: '14px', marginTop: '8px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#666' }}>Utilidad bruta del mes</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: reporte.finanzas.utilidad >= 0 ? '#2E7D32' : '#C62828' }}>
                ${reporte.finanzas.utilidad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Comparativa */}
          {(reporte.anterior.ventas > 0 || reporte.anterior.almacen > 0) && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 8px', color: '#444' }}>
                📈 vs {MESES[mes === 1 ? 11 : mes - 2]} {mes === 1 ? anio - 1 : anio}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  ['Ventas', reporte.finanzas.ventas, reporte.anterior.ventas, true],
                  ['Gasto alimento', reporte.finanzas.almacen, reporte.anterior.almacen, false],
                  ['Muertes', reporte.movimientos['MUERTE'] || 0, reporte.anterior.muertes, false],
                ].map(([label, actual, anterior, masEsMejor]) => {
                  const diff = actual - anterior
                  const esMejor = masEsMejor ? diff >= 0 : diff <= 0
                  return (
                    <div key={label} style={{
                      padding: '10px 12px', background: '#f9f9f9',
                      borderRadius: '8px', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontWeight: '700', fontSize: '16px' }}>
                        {typeof actual === 'number' && actual > 100
                          ? `$${actual.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
                          : actual}
                      </div>
                      {diff !== 0 && (
                        <div style={{ fontSize: '12px', color: esMejor ? '#2E7D32' : '#C62828', fontWeight: '600' }}>
                          {diff > 0 ? '▲' : '▼'} {typeof diff === 'number' && Math.abs(diff) > 100
                            ? `$${Math.abs(diff).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
                            : Math.abs(diff)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ICA zona Crecimiento — fuera del bloque del reporte mensual */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 4px', color: '#444' }}>🌽 ICA zona Crecimiento</h4>
        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 8px' }}>
          Índice de Conversión Alimenticia. Estándar: 2.5 o menos. Define el período de una camada.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Desde:</label>
            <input type="date" value={icaInicio} onChange={e => setIcaInicio(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Hasta:</label>
            <input type="date" value={icaFin} onChange={e => setIcaFin(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>
        </div>
        {ica.length === 0 && <p style={{ color: '#888', fontSize: '13px' }}>Sin datos en este período.</p>}
        {ica.map((r, i) => {
          const bueno = r.ica !== null && r.ica <= 2.5
          const sinVentas = r.ica === null
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: '#f9f9f9',
              borderRadius: '8px', marginBottom: '4px',
              borderLeft: `4px solid ${sinVentas ? '#9E9E9E' : bueno ? '#2E7D32' : '#C62828'}`
            }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{r.corral}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {r.kg_alimento.toFixed(1)} kg alimento · {r.kg_vendidos.toFixed(1)} kg vendidos · {r.num_ventas} ventas
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {sinVentas ? (
                  <span style={{ fontSize: '13px', color: '#9E9E9E' }}>Sin ventas</span>
                ) : (
                  <>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: bueno ? '#2E7D32' : '#C62828' }}>
                      {r.ica}
                    </div>
                    <div style={{ fontSize: '11px', color: bueno ? '#2E7D32' : '#C62828' }}>
                      {bueno ? '✅ Bien' : '⚠️ Alto'}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Reportes