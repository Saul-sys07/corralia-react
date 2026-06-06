import { useState, useEffect } from "react";
import api from "../services/api";

function Apartados({ usuario }) {
  const [apartados, setApartados] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    api.get("/apartados").then((r) => {
      setApartados(r.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    cargar();
  }, []);

  const liquidar = async (id) => {
    if (!confirm("¿Confirmar liquidación del apartado?")) return;
    await api.post(`/apartados/${id}/liquidar`);
    cargar();
  };

  const cancelar = async (id) => {
    if (!confirm("¿Cancelar este apartado?")) return;
    await api.post(`/apartados/${id}/cancelar`);
    cargar();
  };

  if (loading)
    return <p style={{ padding: "16px", color: "#888" }}>Cargando...</p>;

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ margin: "0 0 4px" }}>📋 Apartados Activos</h2>
      <p style={{ color: "#888", fontSize: "13px", margin: "0 0 20px" }}>
        {apartados.length} apartado{apartados.length !== 1 ? "s" : ""} activo
        {apartados.length !== 1 ? "s" : ""}
      </p>

      {apartados.length === 0 && (
        <div
          style={{
            background: "#f5f5f5",
            borderRadius: "10px",
            padding: "24px",
            textAlign: "center",
            color: "#888",
          }}
        >
          Sin apartados activos
        </div>
      )}

      {apartados.map((a, i) => {
        const fechaCompromiso = new Date(a.fecha_compromiso + "T12:00:00");
        const hoy = new Date();
        const vencido = fechaCompromiso < hoy;
        return (
          <div
            key={i}
            style={{
              border: `2px solid ${vencido ? "#C62828" : "#E65100"}`,
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "10px",
              background: vencido ? "#ffebee" : "#fff3e0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <strong style={{ fontSize: "16px" }}>{a.cliente_nombre}</strong>
              {vencido && (
                <span
                  style={{
                    background: "#C62828",
                    color: "white",
                    borderRadius: "6px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}
                >
                  VENCIDO
                </span>
              )}
            </div>
            <div
              style={{ fontSize: "13px", color: "#555", marginBottom: "4px" }}
            >
              🐷 {a.cantidad} {a.tipo_animal} · Corral {a.corral_nombre}
            </div>
            <div
              style={{ fontSize: "13px", color: "#555", marginBottom: "4px" }}
            >
              💵 Anticipo:{" "}
              <strong>
                $
                {parseFloat(a.anticipo).toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>
            <div
              style={{
                fontSize: "13px",
                color: vencido ? "#C62828" : "#E65100",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              📅 Compromiso:{" "}
              {fechaCompromiso.toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            {a.notas && (
              <div
                style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}
              >
                📝 {a.notas}
              </div>
            )}
            <div
              style={{ fontSize: "11px", color: "#aaa", marginBottom: "10px" }}
            >
              Registrado por: {a.usuario_id} ·{" "}
              {new Date(a.fecha_apartado).toLocaleDateString("es-MX")}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => liquidar(a.id)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#2E7D32",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "14px",
                }}
              >
                💰 Liquidar
              </button>
              <button
                onClick={() => cancelar(a.id)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#f0f0f0",
                  color: "#C62828",
                  border: "1px solid #C62828",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "14px",
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Apartados;
