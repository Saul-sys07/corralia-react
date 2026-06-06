import { useState, useEffect } from "react";
import api from "../services/api";

function Depositos({ usuario }) {
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");
  const [depositos, setDepositos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargar = () => {
    api.get("/finanzas/depositos").then((r) => setDepositos(r.data));
  };

  useEffect(() => {
    cargar();
  }, []);

  const confirmar = async () => {
    if (!monto) return;
    setLoading(true);
    try {
      await api.post("/finanzas/deposito", { monto: Number(monto), notas });
      setMonto("");
      setNotas("");
      setMensaje("✅ Depósito registrado");
      setTimeout(() => setMensaje(""), 3000);
      cargar();
    } finally {
      setLoading(false);
    }
  };

  const totalDepositos = depositos.reduce((s, d) => s + parseFloat(d.monto), 0);

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ margin: "0 0 4px" }}>💰 Depósitos</h2>
      <p style={{ color: "#888", fontSize: "13px", margin: "0 0 20px" }}>
        Registra los depósitos que hace tu papá
      </p>

      {mensaje && (
        <div
          style={{
            background: "#f1f8e9",
            border: "1px solid #c5e1a5",
            borderRadius: "8px",
            padding: "10px",
            marginBottom: "16px",
            color: "#2E7D32",
            fontWeight: "600",
          }}
        >
          {mensaje}
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Monto ($):</label>
        <input
          type="number"
          min={0}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          style={inputStyle}
          placeholder="Ej: 30000"
        />
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Notas (opcional):</label>
        <input
          type="text"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          style={inputStyle}
          placeholder="Ej: Para compra semana 3"
        />
      </div>
      <button
        onClick={confirmar}
        disabled={loading || !monto}
        style={{
          width: "100%",
          padding: "14px",
          background: loading || !monto ? "#ccc" : "#1976D2",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          fontWeight: "700",
          cursor: "pointer",
          marginBottom: "24px",
        }}
      >
        {loading ? "Registrando..." : "Registrar depósito"}
      </button>

      <div
        style={{
          background: "#e3f2fd",
          border: "1px solid #90caf9",
          borderRadius: "8px",
          padding: "10px 14px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#1976D2", fontSize: "13px" }}>
          Total depositado
        </span>
        <strong style={{ color: "#1976D2", fontSize: "18px" }}>
          $
          {totalDepositos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
        </strong>
      </div>

      <label style={labelStyle}>Depósitos recientes:</label>
      {depositos.map((d, i) => (
        <div
          key={i}
          style={{
            borderLeft: "4px solid #1976D2",
            padding: "8px 12px",
            background: "#f9f9f9",
            borderRadius: "3px",
            marginBottom: "6px",
          }}
        >
          <strong>
            $
            {parseFloat(d.monto).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </strong>
          <span style={{ color: "#888", fontSize: "13px" }}>
            {" "}
            — {d.fecha ? new Date(d.fecha).toLocaleDateString("es-MX") : "?"}
          </span>
          {d.notas && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
              {d.notas}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontWeight: "600",
  marginBottom: "6px",
  color: "#444",
};
const inputStyle = {
  width: "100%",
  padding: "10px",
  fontSize: "15px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  boxSizing: "border-box",
};

export default Depositos;
