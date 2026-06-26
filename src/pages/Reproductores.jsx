import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const TIPOS = ["Pie de Cría", "Semental"];
const ESTADOS = ["Activo", "Disponible", "Cubierta", "Gestación", "Parida", "Desecho"];

function Reproductores({ usuario }) {
  const [tab, setTab] = useState("reproductores");
  const [reproductores, setReproductores] = useState([]);
  const [montas, setMontas] = useState([]);
  const [corrales, setCorrales] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const cargar = () => {
    api.get("/reproductores").then((r) => setReproductores(r.data));
    api.get("/reproductores/montas").then((r) => setMontas(r.data));
    api.get("/configuracion/corrales").then((r) => setCorrales(r.data));
  };

  useEffect(() => {
    cargar();
  }, []);

  const pieCria = useMemo(
    () => reproductores.filter((r) => r.tipo === "Pie de Cría"),
    [reproductores],
  );

  const sementales = useMemo(
    () => reproductores.filter((r) => r.tipo === "Semental"),
    [reproductores],
  );

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ margin: "0 0 14px" }}>🐷 Reproductores</h2>

      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        <button
          onClick={() => setTab("reproductores")}
          style={tabBtn(tab === "reproductores")}
        >
          🐖 Aretes
        </button>
        <button
          onClick={() => setTab("montas")}
          style={tabBtn(tab === "montas")}
        >
          🧬 Montas
        </button>
      </div>

      {mensaje && (
        <div
          style={{
            background: "#f1f8e9",
            border: "1px solid #c5e1a5",
            borderRadius: "8px",
            padding: "10px",
            marginBottom: "12px",
            color: "#2E7D32",
            fontWeight: "700",
          }}
        >
          {mensaje}
        </div>
      )}

      {tab === "reproductores" && (
        <>
          <NuevoReproductor
            corrales={corrales}
            onRefresh={cargar}
            setMensaje={setMensaje}
          />
          <ListaReproductores
  reproductores={reproductores}
  usuario={usuario}
  corrales={corrales}
  onRefresh={cargar}
  setMensaje={setMensaje}
/>
        </>
      )}

      {tab === "montas" && (
        <>
          <NuevaMonta
            pieCria={pieCria}
            sementales={sementales}
            onRefresh={cargar}
            setMensaje={setMensaje}
          />
          <ListaMontas montas={montas} />
        </>
      )}
    </div>
  );
}

function NuevoReproductor({ corrales, onRefresh, setMensaje }) {
  const [identificador, setIdentificador] = useState("");
  const [arete, setArete] = useState("");
  const [tipo, setTipo] = useState("Pie de Cría");
  const [razaLinea, setRazaLinea] = useState("");
  const [idChiquero, setIdChiquero] = useState("");
  const [estado, setEstado] = useState("Activo");
  const [origen, setOrigen] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmar = async () => {
    if (!identificador || !tipo || !idChiquero) return;

    setLoading(true);
    setError("");

    try {
      await api.post("/reproductores", {
        identificador,
        arete: arete || null,
        tipo,
        raza_linea: razaLinea || null,
        id_chiquero: Number(idChiquero),
        estado,
        fecha_nacimiento: null,
        origen: origen || null,
        notas: notas || null,
      });

      setIdentificador("");
      setArete("");
      setRazaLinea("");
      setOrigen("");
      setNotas("");
      setMensaje("✅ Reproductor registrado");
      setTimeout(() => setMensaje(""), 3000);
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al registrar reproductor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 10px" }}>➕ Registrar reproductor</h3>

      <p style={{ color: "#666", fontSize: "13px", marginTop: 0 }}>
        El arete es opcional por ahora. Usa un identificador temporal si todavía
        no tiene arete.
      </p>

      <label style={labelStyle}>Identificador temporal:</label>
      <input
        value={identificador}
        onChange={(e) => setIdentificador(e.target.value)}
        placeholder="Ej: Puerca negra gestación 3"
        style={inputStyle}
      />

      <label style={labelStyle}>Arete opcional:</label>
      <input
        value={arete}
        onChange={(e) => setArete(e.target.value)}
        placeholder="Ej: H-027"
        style={inputStyle}
      />

      <label style={labelStyle}>Tipo:</label>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {TIPOS.map((t) => (
          <button key={t} onClick={() => setTipo(t)} style={chipStyle(tipo === t)}>
            {t}
          </button>
        ))}
      </div>

      <label style={labelStyle}>Raza / línea:</label>
      <input
        value={razaLinea}
        onChange={(e) => setRazaLinea(e.target.value)}
        placeholder="Ej: Duroc, Yorkshire, Landrace, F1, desconocida"
        style={inputStyle}
      />

      <label style={labelStyle}>Corral actual:</label>
      <select
        value={idChiquero}
        onChange={(e) => setIdChiquero(e.target.value)}
        style={inputStyle}
      >
        <option value="">Selecciona corral</option>
        {corrales.map((c) => (
          <option key={c.id} value={c.id}>
            {c.zona} — {c.nombre} ({c.tipo})
          </option>
        ))}
      </select>

      <label style={labelStyle}>Estado:</label>
      <select
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
        style={inputStyle}
      >
        {ESTADOS.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Origen:</label>
      <input
        value={origen}
        onChange={(e) => setOrigen(e.target.value)}
        placeholder="Ej: comprado, nacido en rancho, desconocido"
        style={inputStyle}
      />

      <label style={labelStyle}>Notas:</label>
      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Color, señas, observaciones..."
        style={{ ...inputStyle, minHeight: "70px" }}
      />

      {error && <p style={{ color: "#C62828" }}>{error}</p>}

      <button
        onClick={confirmar}
        disabled={loading || !identificador || !idChiquero}
        style={{
          width: "100%",
          padding: "12px",
          background: loading || !identificador || !idChiquero ? "#ccc" : "#2E7D32",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontWeight: "700",
          cursor: "pointer",
        }}
      >
        {loading ? "Guardando..." : "Registrar reproductor"}
      </button>
    </div>
  );
}

function ListaReproductores({ reproductores, usuario, corrales, onRefresh, setMensaje }) {
  const esAdmin = usuario?.rol === "admin";
  const [editando, setEditando] = useState(null);

  const baja = async (id) => {
    if (!confirm("¿Dar de baja este reproductor?")) return;
    await api.post(`/reproductores/${id}/baja`);
    setMensaje("✅ Reproductor dado de baja");
    setTimeout(() => setMensaje(""), 3000);
    onRefresh();
  };

  if (editando) {
    return (
      <EditarReproductor
        reproductor={editando}
        corrales={corrales}
        onCancelar={() => setEditando(null)}
        onGuardado={() => {
          setEditando(null);
          setMensaje("✅ Reproductor actualizado");
          setTimeout(() => setMensaje(""), 3000);
          onRefresh();
        }}
      />
    );
  }

  return (
    <div>
      <h3 style={{ margin: "18px 0 10px" }}>
        Lista de reproductores ({reproductores.length})
      </h3>

      {reproductores.length === 0 && (
        <p style={{ color: "#888" }}>Todavía no hay reproductores registrados.</p>
      )}

      {reproductores.map((r) => (
        <div key={r.id} style={itemStyle}>
          <div>
            <strong>{r.arete || r.identificador}</strong>
            <span style={{ color: "#666" }}> — {r.tipo}</span>

            <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
              {r.arete ? `ID temporal: ${r.identificador}` : "Sin arete todavía"}
            </div>

            <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
              {r.raza_linea || "Raza desconocida"} · {r.zona} {r.corral} ·{" "}
              {r.estado}
            </div>
          </div>

          {esAdmin && (
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setEditando(r)}
                style={{
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#1976D2",
                  color: "white",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                ✏️ Editar
              </button>

              <button
                onClick={() => baja(r.id)}
                style={{
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #C62828",
                  background: "#ffebee",
                  color: "#C62828",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Baja
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EditarReproductor({ reproductor, corrales, onCancelar, onGuardado }) {
  const [identificador, setIdentificador] = useState(reproductor.identificador || "");
  const [arete, setArete] = useState(reproductor.arete || "");
  const [tipo, setTipo] = useState(reproductor.tipo || "Pie de Cría");
  const [razaLinea, setRazaLinea] = useState(reproductor.raza_linea || "");
  const [idChiquero, setIdChiquero] = useState(reproductor.id_chiquero || "");
  const [estado, setEstado] = useState(reproductor.estado || "Activo");
  const [origen, setOrigen] = useState(reproductor.origen || "");
  const [notas, setNotas] = useState(reproductor.notas || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    if (!identificador || !tipo || !idChiquero) return;

    setLoading(true);
    setError("");

    try {
      await api.put(`/reproductores/${reproductor.id}`, {
        identificador,
        arete: arete || null,
        tipo,
        raza_linea: razaLinea || null,
        id_chiquero: Number(idChiquero),
        estado,
        fecha_nacimiento: null,
        origen: origen || null,
        notas: notas || null,
      });

      onGuardado();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al actualizar reproductor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 10px" }}>✏️ Editar reproductor</h3>

      <label style={labelStyle}>Identificador temporal:</label>
      <input
        value={identificador}
        onChange={(e) => setIdentificador(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Arete:</label>
      <input
        value={arete}
        onChange={(e) => setArete(e.target.value)}
        placeholder="Ej: H-027"
        style={inputStyle}
      />

      <label style={labelStyle}>Tipo:</label>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {TIPOS.map((t) => (
          <button key={t} onClick={() => setTipo(t)} style={chipStyle(tipo === t)}>
            {t}
          </button>
        ))}
      </div>

      <label style={labelStyle}>Raza / línea:</label>
      <input
        value={razaLinea}
        onChange={(e) => setRazaLinea(e.target.value)}
        placeholder="Ej: Duroc, Yorkshire, Landrace, F1, desconocida"
        style={inputStyle}
      />

      <label style={labelStyle}>Corral actual:</label>
      <select
        value={idChiquero}
        onChange={(e) => setIdChiquero(e.target.value)}
        style={inputStyle}
      >
        <option value="">Selecciona corral</option>
        {corrales.map((c) => (
          <option key={c.id} value={c.id}>
            {c.zona} — {c.nombre} ({c.tipo})
          </option>
        ))}
      </select>

      <label style={labelStyle}>Estado:</label>
      <select
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
        style={inputStyle}
      >
        {ESTADOS.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Origen:</label>
      <input
        value={origen}
        onChange={(e) => setOrigen(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Notas:</label>
      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        style={{ ...inputStyle, minHeight: "70px" }}
      />

      {error && <p style={{ color: "#C62828" }}>{error}</p>}

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={guardar}
          disabled={loading || !identificador || !idChiquero}
          style={{
            flex: 1,
            padding: "12px",
            background: loading || !identificador || !idChiquero ? "#ccc" : "#2E7D32",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>

        <button
          onClick={onCancelar}
          style={{
            flex: 1,
            padding: "12px",
            background: "#f0f0f0",
            color: "#555",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function NuevaMonta({ pieCria, sementales, onRefresh, setMensaje }) {
  const [reproductoraId, setReproductoraId] = useState("");
  const [sementalId, setSementalId] = useState("");
  const [fechaMonta, setFechaMonta] = useState(new Date().toISOString().split("T")[0]);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmar = async () => {
    if (!reproductoraId || !sementalId || !fechaMonta) return;

    setLoading(true);
    setError("");

    try {
      const r = await api.post("/reproductores/montas", {
        reproductora_id: Number(reproductoraId),
        semental_id: Number(sementalId),
        fecha_monta: fechaMonta,
        notas: notas || null,
      });

      setNotas("");
      setMensaje(`✅ Monta registrada. Parto estimado: ${r.data.fecha_parto_estimada}`);
      setTimeout(() => setMensaje(""), 4000);
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al registrar monta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 10px" }}>🧬 Registrar monta</h3>

      <label style={labelStyle}>Pie de Cría:</label>
      <select
        value={reproductoraId}
        onChange={(e) => setReproductoraId(e.target.value)}
        style={inputStyle}
      >
        <option value="">Selecciona puerca</option>
        {pieCria.map((p) => (
          <option key={p.id} value={p.id}>
            {p.arete || p.identificador} — {p.raza_linea || "Raza desconocida"}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Semental:</label>
      <select
        value={sementalId}
        onChange={(e) => setSementalId(e.target.value)}
        style={inputStyle}
      >
        <option value="">Selecciona semental</option>
        {sementales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.arete || s.identificador} — {s.raza_linea || "Raza desconocida"}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Fecha de monta:</label>
      <input
        type="date"
        value={fechaMonta}
        onChange={(e) => setFechaMonta(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Notas:</label>
      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Observaciones de la monta..."
        style={{ ...inputStyle, minHeight: "70px" }}
      />

      {error && <p style={{ color: "#C62828" }}>{error}</p>}

      <button
        onClick={confirmar}
        disabled={loading || !reproductoraId || !sementalId || !fechaMonta}
        style={{
          width: "100%",
          padding: "12px",
          background:
            loading || !reproductoraId || !sementalId || !fechaMonta
              ? "#ccc"
              : "#2E7D32",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontWeight: "700",
          cursor: "pointer",
        }}
      >
        {loading ? "Registrando..." : "Registrar monta"}
      </button>
    </div>
  );
}

function ListaMontas({ montas }) {
  return (
    <div>
      <h3 style={{ margin: "18px 0 10px" }}>Historial de montas</h3>

      {montas.length === 0 && (
        <p style={{ color: "#888" }}>Todavía no hay montas registradas.</p>
      )}

      {montas.map((m) => (
        <div key={m.id} style={itemStyle}>
          <div>
            <strong>
              {m.puerca_arete || m.puerca_identificador} ×{" "}
              {m.semental_arete || m.semental_identificador}
            </strong>

            <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
              {m.puerca_raza || "Desconocida"} ×{" "}
              {m.semental_raza || "Desconocida"}
            </div>

            <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
              Monta: {m.fecha_monta} · Parto estimado:{" "}
              {m.fecha_parto_estimada} · {m.estado}
            </div>

            {m.resultado && (
              <div style={{ fontSize: "12px", color: "#2E7D32", marginTop: "2px" }}>
                Resultado: {m.resultado} · Vivos: {m.nacidos_vivos || 0} ·
                Muertos: {m.nacidos_muertos || 0} · Destetados:{" "}
                {m.destetados || 0}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const cardStyle = {
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "14px",
  marginBottom: "14px",
};

const itemStyle = {
  background: "#f9f9f9",
  border: "1px solid #eee",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "8px",
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
};

const labelStyle = {
  display: "block",
  fontWeight: "700",
  marginBottom: "6px",
  color: "#444",
  fontSize: "13px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  marginBottom: "12px",
  boxSizing: "border-box",
};

const chipStyle = (activo) => ({
  padding: "8px 12px",
  borderRadius: "20px",
  cursor: "pointer",
  border: activo ? "2px solid #2E7D32" : "2px solid #ddd",
  background: activo ? "#f1f8e9" : "white",
  color: activo ? "#2E7D32" : "#666",
  fontWeight: activo ? "700" : "400",
});

const tabBtn = (activo) => ({
  flex: 1,
  padding: "10px",
  borderRadius: "10px",
  border: "none",
  background: activo ? "#2E7D32" : "#f0f0f0",
  color: activo ? "white" : "#555",
  fontWeight: "700",
  cursor: "pointer",
});

export default Reproductores;