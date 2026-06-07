import { useEffect, useState } from "react";
import api from "../services/api";
import { obtenerErrorApi } from "../utils/errores";

const TIPOS = ["Engorda", "Destete", "Desecho"];

function NuevoApartado({ usuario, onVolver }) {
  const [clientes, setClientes] = useState([]);
  const [corrales, setCorrales] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [idChiquero, setIdChiquero] = useState("");
  const [tipoAnimal, setTipoAnimal] = useState("Engorda");
  const [cantidad, setCantidad] = useState(1);
  const [anticipo, setAnticipo] = useState("");
  const [fechaCompromiso, setFechaCompromiso] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api.get("/clientes").then((r) => setClientes(r.data));
    api.get("/mapa").then((r) => setCorrales(r.data));
  }, []);

  const corralesFiltrados = corrales.filter((c) =>
    c.tipo_animal
      ?.split(" / ")
      .map((t) => t.trim())
      .includes(tipoAnimal)
  );

  const guardar = async () => {
    if (
      !clienteId ||
      !idChiquero ||
      !tipoAnimal ||
      !cantidad ||
      !anticipo ||
      !fechaCompromiso
    ) {
      setError("Completa cliente, corral, tipo, cantidad, anticipo y fecha");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/apartados", {
        cliente_id: Number(clienteId),
        id_chiquero: Number(idChiquero),
        tipo_animal: tipoAnimal,
        cantidad: Number(cantidad),
        anticipo: Number(anticipo),
        fecha_compromiso: fechaCompromiso,
        notas,
      });

      onVolver(true);
    } catch (e) {
      setError(obtenerErrorApi(e, "Error al crear apartado"));
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <button
        onClick={() => onVolver(false)}
        style={{
          background: "none",
          border: "none",
          color: "#1976D2",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "16px",
        }}
      >
        ← Regresar
      </button>

      <h2 style={{ margin: "0 0 4px" }}>📋 Nuevo apartado</h2>
      <p style={{ color: "#888", fontSize: "13px", margin: "0 0 20px" }}>
        Reserva animales con anticipo. No descuenta población hasta liquidar.
      </p>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Cliente:</label>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          style={inputStyle}
        >
          <option value="">— Selecciona cliente —</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Tipo animal:</label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {TIPOS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTipoAnimal(t);
                setIdChiquero("");
                setError("");
              }}
              style={chipStyle(tipoAnimal === t, "#E65100")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Corral:</label>
        <select
          value={idChiquero}
          onChange={(e) => setIdChiquero(e.target.value)}
          style={inputStyle}
        >
          <option value="">— Selecciona corral —</option>
          {corralesFiltrados.map((c) => (
            <option key={c.id} value={c.id}>
              {c.zona} {c.nombre} — {c.poblacion_actual} animales
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Cantidad:</label>
        <input
          type="number"
          min={1}
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Anticipo recibido ($):</label>
        <input
          type="number"
          min={0}
          value={anticipo}
          onChange={(e) => setAnticipo(e.target.value)}
          style={inputStyle}
          placeholder="Ej: 2000"
        />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Fecha compromiso:</label>
        <input
         type="date"
         min={hoy}
         value={fechaCompromiso}
          onChange={(e) => setFechaCompromiso(e.target.value)}
          style={inputStyle}
          />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Notas:</label>
        <input
          type="text"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej: quiere uno grande, pasa el sábado"
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ color: "#C62828", marginBottom: "12px", fontWeight: "600" }}>
          {error}
        </p>
      )}

      <button
        onClick={guardar}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          background: loading ? "#ccc" : "#E65100",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          fontWeight: "700",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Guardando..." : "📋 Guardar apartado"}
      </button>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontWeight: "600",
  marginBottom: "8px",
  color: "#444",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  fontSize: "16px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  boxSizing: "border-box",
  background: "white",
};

const chipStyle = (activo, color) => ({
  padding: "8px 14px",
  borderRadius: "20px",
  cursor: "pointer",
  border: activo ? `2px solid ${color}` : "2px solid #ddd",
  background: activo ? `${color}15` : "white",
  color: activo ? color : "#666",
  fontWeight: activo ? "700" : "400",
  fontSize: "13px",
});

export default NuevoApartado;