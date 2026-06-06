import { useState, useEffect } from "react";
import api from "../services/api";

function Semana({ usuario }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fechaBase, setFechaBase] = useState(
    new Date().toISOString().split("T")[0],
  );

  const cargar = async (fecha) => {
    setLoading(true);
    try {
      const r = await api.get(`/finanzas/semana?fecha=${fecha}`);
      setDatos(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar(fechaBase);
  }, [fechaBase]);

  const semanaAnterior = () => {
    const d = new Date(fechaBase);
    d.setDate(d.getDate() - 7);
    setFechaBase(d.toISOString().split("T")[0]);
  };

  const semanaSiguiente = () => {
    const d = new Date(fechaBase);
    d.setDate(d.getDate() + 7);
    setFechaBase(d.toISOString().split("T")[0]);
  };

  if (loading)
    return <p style={{ padding: "16px", color: "#888" }}>Cargando...</p>;
  if (!datos) return null;

  const { semana, ingresos, gastos, sobrante } = datos;

  const fmt = (n) =>
    Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
  const fmtFecha = (f) =>
    new Date(f + "T12:00:00").toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ margin: "0 0 16px" }}>📅 Resumen Semanal</h2>

      {/* Navegación semana */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#2E7D32",
          color: "white",
          borderRadius: "10px",
          padding: "12px 16px",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={semanaAnterior}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "white",
            borderRadius: "6px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ←
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "700", fontSize: "16px" }}>
            {fmtFecha(semana.inicio)} — {fmtFecha(semana.fin)}
          </div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>semana</div>
        </div>
        <button
          onClick={semanaSiguiente}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "white",
            borderRadius: "6px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          →
        </button>
      </div>

      {/* Sobrante */}
      <div
        style={{
          background: sobrante >= 0 ? "#f1f8e9" : "#ffebee",
          border: `2px solid ${sobrante >= 0 ? "#2E7D32" : "#C62828"}`,
          borderRadius: "10px",
          padding: "14px",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "13px", color: "#666" }}>
          {sobrante >= 0
            ? "✅ Sobrante de la semana"
            : "⚠️ Déficit de la semana"}
        </div>
        <div
          style={{
            fontSize: "28px",
            fontWeight: "800",
            color: sobrante >= 0 ? "#2E7D32" : "#C62828",
          }}
        >
          ${fmt(sobrante)}
        </div>
      </div>

      {/* Dos columnas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {/* Ingresos */}
        <div
          style={{
            background: "#f1f8e9",
            border: "1px solid #c5e1a5",
            borderRadius: "10px",
            padding: "12px",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: "#2E7D32",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            💰 Ingresos
          </div>
          <div style={{ fontSize: "13px", marginBottom: "4px" }}>
            Depósitos: <strong>${fmt(ingresos.total_depositos)}</strong>
          </div>
          <div style={{ fontSize: "13px", marginBottom: "8px" }}>
            Ventas: <strong>${fmt(ingresos.total_ventas)}</strong>
          </div>
          <div
            style={{
              borderTop: "1px solid #c5e1a5",
              paddingTop: "6px",
              fontWeight: "700",
              color: "#2E7D32",
            }}
          >
            Total: ${fmt(ingresos.total)}
          </div>
        </div>

        {/* Gastos */}
        <div
          style={{
            background: "#ffebee",
            border: "1px solid #EF9A9A",
            borderRadius: "10px",
            padding: "12px",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: "#C62828",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            📤 Gastos
          </div>
          <div style={{ fontSize: "13px", marginBottom: "4px" }}>
            Nómina: <strong>${fmt(gastos.total_nomina)}</strong>
          </div>
          <div style={{ fontSize: "13px", marginBottom: "4px" }}>
            Alimento: <strong>${fmt(gastos.total_compras)}</strong>
          </div>
          <div style={{ fontSize: "13px", marginBottom: "8px" }}>
            Otros: <strong>${fmt(gastos.total_otros)}</strong>
          </div>
          <div
            style={{
              borderTop: "1px solid #EF9A9A",
              paddingTop: "6px",
              fontWeight: "700",
              color: "#C62828",
            }}
          >
            Total: ${fmt(gastos.total)}
          </div>
        </div>
      </div>

      {/* Detalle ingresos */}
      {ingresos.depositos.length > 0 && (
        <SeccionDetalle titulo="💵 Depósitos" color="#2E7D32" bg="#f1f8e9">
          {ingresos.depositos.map((d, i) => (
            <ItemDetalle
              key={i}
              titulo={d.notas || "Depósito"}
              monto={`+$${fmt(d.monto)}`}
              fecha={d.fecha}
              colorMonto="#2E7D32"
            />
          ))}
        </SeccionDetalle>
      )}

      {ingresos.ventas.length > 0 && (
        <SeccionDetalle titulo="🐷 Ventas" color="#1B5E20" bg="#e8f5e9">
          {ingresos.ventas.map((v, i) => (
            <ItemDetalle
              key={i}
              titulo={`${v.cantidad} ${v.tipo_animal} — ${v.cliente}`}
              monto={`+$${fmt(v.total_rancho)}`}
              fecha={v.fecha}
              colorMonto="#1B5E20"
            />
          ))}
        </SeccionDetalle>
      )}

      {/* Detalle gastos */}
      {gastos.nomina.length > 0 && (
        <SeccionDetalle titulo="👥 Nómina" color="#C62828" bg="#ffebee">
          {gastos.nomina.map((n, i) => (
            <ItemDetalle
              key={i}
              titulo={n.concepto}
              monto={`-$${fmt(n.monto)}`}
              fecha={n.fecha}
              colorMonto="#C62828"
            />
          ))}
        </SeccionDetalle>
      )}

      {gastos.compras_alimento.length > 0 && (
        <SeccionDetalle
          titulo="🌽 Compras alimento"
          color="#E65100"
          bg="#fff3e0"
        >
          {gastos.compras_alimento.map((c, i) => (
            <ItemDetalle
              key={i}
              titulo={`${c.producto} — ${c.cantidad} ${c.unidad}`}
              monto={`-$${fmt(c.costo)}`}
              fecha={c.fecha}
              colorMonto="#E65100"
            />
          ))}
        </SeccionDetalle>
      )}

      {gastos.otros.length > 0 && (
        <SeccionDetalle titulo="📋 Otros gastos" color="#F57F17" bg="#fff8e1">
          {gastos.otros.map((g, i) => (
            <ItemDetalle
              key={i}
              titulo={g.producto}
              monto={`-$${fmt(g.costo)}`}
              fecha={g.fecha}
              colorMonto="#F57F17"
            />
          ))}
        </SeccionDetalle>
      )}
    </div>
  );
}

function SeccionDetalle({ titulo, color, bg, children }) {
  const [expandido, setExpandido] = useState(false);
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        onClick={() => setExpandido(!expandido)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: bg,
          border: `1px solid ${color}`,
          borderRadius: expandido ? "8px 8px 0 0" : "8px",
          padding: "10px 14px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontWeight: "700", color, fontSize: "14px" }}>
          {titulo}
        </span>
        <span style={{ color, fontSize: "12px" }}>
          {expandido ? "▲" : "▼ ver detalle"}
        </span>
      </div>
      {expandido && (
        <div
          style={{
            border: `1px solid ${color}`,
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            background: "white",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ItemDetalle({ titulo, monto, fecha, colorMonto }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 14px",
        borderBottom: "1px solid #f0f0f0",
        fontSize: "13px",
      }}
    >
      <div>
        <div>{titulo}</div>
        <div style={{ fontSize: "11px", color: "#aaa" }}>
          {fecha ? new Date(fecha).toLocaleDateString("es-MX") : ""}
        </div>
      </div>
      <strong style={{ color: colorMonto }}>{monto}</strong>
    </div>
  );
}

export default Semana;
