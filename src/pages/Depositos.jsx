import { useState, useEffect } from "react";
import api from "../services/api";

function Depositos({ usuario }) {
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");
  const [depositos, setDepositos] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [entrego, setEntrego] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const esAdmin = usuario.rol === "admin";

  const cargar = () => {
    if (esAdmin) {
      api.get("/finanzas/depositos").then((r) => setDepositos(r.data));
      api
        .get("/finanzas/depositos/pendientes")
        .then((r) => setPendientes(r.data));
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const confirmar = async () => {
    if (!monto) return;

    if (!esAdmin && !entrego) {
      setMensaje("⚠️ Captura quién entregó el dinero");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/finanzas/deposito", {
        monto: Number(monto),
        notas,
        entrego,
        metodo,
      });

      setMonto("");
      setNotas("");
      setEntrego("");
      setMetodo("Efectivo");

      setMensaje(
        res.data?.mensaje ||
          (esAdmin
            ? "✅ Depósito registrado"
            : "✅ Dinero recibido registrado")
      );

      setTimeout(() => setMensaje(""), 3000);
      cargar();
    } finally {
      setLoading(false);
    }
  };

  const confirmarPendiente = async (id) => {
    if (!confirm("¿Confirmar este depósito pendiente?")) return;
    await api.post(`/finanzas/depositos/${id}/confirmar`);
    cargar();
  };

  const rechazarPendiente = async (id) => {
    if (!confirm("¿Rechazar este depósito pendiente?")) return;
    await api.post(`/finanzas/depositos/${id}/rechazar`);
    cargar();
  };

  const totalDepositos = depositos.reduce(
    (s, d) => s + parseFloat(d.monto),
    0
  );

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ margin: "0 0 4px" }}>
        {esAdmin ? "💰 Depósitos" : "💵 Dinero recibido"}
      </h2>

      <p style={{ color: "#888", fontSize: "13px", margin: "0 0 20px" }}>
        {esAdmin
          ? "Registra depósitos confirmados y revisa dinero recibido por encargados"
          : "Registra el dinero que recibiste para que admin lo confirme"}
      </p>

      {mensaje && (
        <div
          style={{
            background: mensaje.startsWith("⚠️") ? "#fff3e0" : "#f1f8e9",
            border: mensaje.startsWith("⚠️")
              ? "1px solid #ffcc80"
              : "1px solid #c5e1a5",
            borderRadius: "8px",
            padding: "10px",
            marginBottom: "16px",
            color: mensaje.startsWith("⚠️") ? "#E65100" : "#2E7D32",
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

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Notas (opcional):</label>
        <input
          type="text"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          style={inputStyle}
          placeholder={
            esAdmin ? "Ej: Para compra semana 3" : "Ej: Para alimento"
          }
        />
      </div>

      {!esAdmin && (
        <>
          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>Entregado por:</label>
            <input
              type="text"
              value={entrego}
              onChange={(e) => setEntrego(e.target.value)}
              style={inputStyle}
              placeholder="Ej: Propietario, Administrador, Cliente"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Método:</label>
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              style={inputStyle}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </>
      )}

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
          cursor: loading || !monto ? "not-allowed" : "pointer",
          marginBottom: "16px",
        }}
      >
        {loading
          ? "Registrando..."
          : esAdmin
            ? "Registrar depósito"
            : "Registrar dinero recibido"}
      </button>

      {!esAdmin && (
        <div
          style={{
            background: "#fff3e0",
            border: "1px solid #ffcc80",
            borderRadius: "8px",
            padding: "10px 12px",
            marginBottom: "16px",
            color: "#E65100",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          El dinero registrado quedará pendiente hasta que Saúl/admin lo confirme.
        </div>
      )}

      {esAdmin && pendientes.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 8px", color: "#E65100" }}>
            ⏳ Pendientes por confirmar
          </h3>

          {pendientes.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#fff3e0",
                border: "1px solid #ffcc80",
                borderRadius: "8px",
                padding: "10px 12px",
                marginBottom: "8px",
              }}
            >
              <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                $
                {parseFloat(p.monto).toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#555",
                  marginBottom: "4px",
                }}
              >
                Registrado por: {p.usuario_id}
                {p.entrego && ` · Entregado por: ${p.entrego}`}
                {p.metodo && ` · ${p.metodo}`}
              </div>

              {p.notas && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  📝 {p.notas}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => confirmarPendiente(p.id)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#2E7D32",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  ✅ Confirmar
                </button>

                <button
                  onClick={() => rechazarPendiente(p.id)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#f0f0f0",
                    color: "#C62828",
                    border: "1px solid #C62828",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  ❌ Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {esAdmin && (
        <>
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
              Total depositado confirmado
            </span>
            <strong style={{ color: "#1976D2", fontSize: "18px" }}>
              $
              {totalDepositos.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </strong>
          </div>

          <label style={labelStyle}>Depósitos recientes confirmados:</label>

          {depositos.length === 0 && (
            <p style={{ color: "#888", fontSize: "13px" }}>
              Sin depósitos confirmados.
            </p>
          )}

          {depositos.map((d, i) => (
            <div
              key={d.id || i}
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

              <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
                Registrado por: {d.usuario_id}
                {d.entrego && ` · Entregado por: ${d.entrego}`}
                {d.metodo && ` · ${d.metodo}`}
              </div>

              {d.notas && (
                <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                  {d.notas}
                </div>
              )}
            </div>
          ))}
        </>
      )}
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