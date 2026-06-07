import { useState } from "react";
import api from "../services/api";
import { obtenerErrorApi } from "../utils/errores";

const COMISIONES = {
  Nuevo: 3.0,
  Retenido: 1.5,
  Recuperado: 2.0,
  "Sin comision": 0.0,
  Disponible: 0.0,
};

function LiquidarApartado({ apartado, usuario, onVolver }) {
  const tipo = apartado.tipo_animal;
  const esEngorda = tipo === "Engorda";
  const ventaPorCabeza = tipo === "Destete" || tipo === "Desecho";

  const [pesoKg, setPesoKg] = useState("");
  const [precioKg, setPrecioKg] = useState(48);
  const [precioCabeza, setPrecioCabeza] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const esBeyin = usuario.nombre?.trim().toLowerCase() === "beyin";
  const precioMinimoBeyin = 45; 
  const precioInvalidoBeyin =
  esBeyin && esEngorda && Number(precioKg) < precioMinimoBeyin;

  const anticipo = Number(apartado.anticipo || 0);
  const cantidad = Number(apartado.cantidad || 1);
  const comisionKg = ventaPorCabeza ? 0 : COMISIONES[apartado.cliente_tipo] || 0;
  const descuentoKg = Number(apartado.descuento_kg || 0);

  const precioNeto = Number(precioKg || 0) - descuentoKg;

  const totalVenta = ventaPorCabeza
    ? Number(precioCabeza || 0) * cantidad
    : Number(pesoKg || 0) * precioNeto;

  const totalComision = ventaPorCabeza ? 0 : Number(pesoKg || 0) * comisionKg;
  const totalRancho = totalVenta - totalComision;
  const restante = totalRancho - anticipo;
  const datosValidos =
  ventaPorCabeza
    ? Number(precioCabeza) > 0
    : Number(pesoKg) > 0 && Number(precioKg) > 0 && !precioInvalidoBeyin;

  const confirmar = async () => {
    setError("");

    if (ventaPorCabeza && (!precioCabeza || Number(precioCabeza) <= 0)) {
      setError("Captura un precio pactado válido");
      return;
    }

    if (esEngorda && (!pesoKg || Number(pesoKg) <= 0)) {
      setError("Captura un peso válido");
      return;
    }

    if (precioInvalidoBeyin) {
        setError(`Beyin no puede vender por debajo de $${precioMinimoBeyin}/kg`);
        return;
    }

    if (esEngorda && (!precioKg || Number(precioKg) <= 0)) {
      setError("Captura un precio por kg válido");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/apartados/${apartado.id}/liquidar-venta`, {
        peso_kg: esEngorda ? Number(pesoKg) : 0,
        precio_kg: esEngorda ? Number(precioKg) : 0,
        precio_cabeza: ventaPorCabeza ? Number(precioCabeza) : 0,
        total_rancho: totalRancho,
        total_comision: totalComision,
        comision_kg: comisionKg,
      });

      onVolver(true);
    } catch (e) {
      setError(obtenerErrorApi(e, "Error al liquidar apartado"));
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

      <h2 style={{ margin: "0 0 4px" }}>💰 Liquidar apartado</h2>
      <p style={{ color: "#888", margin: "0 0 16px" }}>
        {apartado.cliente_nombre} · {apartado.corral_nombre}
      </p>

      <div
        style={{
          background: "#fff3e0",
          border: "1px solid #ffcc80",
          borderRadius: "10px",
          padding: "12px",
          marginBottom: "16px",
        }}
      >
        <div>🐷 {cantidad} {tipo}</div>
        <div>💵 Anticipo: <strong>${anticipo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</strong></div>
        <div>📅 Compromiso: {apartado.fecha_compromiso}</div>
      </div>

      {esEngorda ? (
        <>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Peso total o peso registrado (kg):</label>
                <input
                type="number"
                min={0}
                step={0.5}
                value={pesoKg}
                onChange={(e) => {
                    setPesoKg(e.target.value);
                    setError("");
                }}
                style={inputStyle}
                placeholder="Ej: 115"
                />
          </div>

          <div style={{ marginBottom: "14px" }}>
  <label style={labelStyle}>Precio por kg ($):</label>
  <input
    type="number"
    min={esBeyin ? precioMinimoBeyin : 0}
    step={0.5}
    value={precioKg}
    onChange={(e) => {
      setPrecioKg(e.target.value);
      setError("");
    }}
    style={inputStyle}
  />

  {esBeyin && (
    <p
      style={{
        margin: "6px 0 0",
        color: precioInvalidoBeyin ? "#C62828" : "#888",
        fontSize: "12px",
        fontWeight: precioInvalidoBeyin ? "700" : "400",
      }}
    >
      Precio mínimo permitido para Beyin: ${precioMinimoBeyin}/kg
    </p>
  )}

  {descuentoKg > 0 && (
    <p style={{ margin: "6px 0 0", color: "#666", fontSize: "12px" }}>
      Descuento cliente: ${descuentoKg}/kg · Precio neto: ${precioNeto}/kg
    </p>
  )}
</div>
        </>
      ) : (
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>
            {tipo === "Desecho" ? "Precio pactado ($):" : "Precio por cabeza ($):"}
          </label>
          <input
            type="number"
            min={0}
            step={50}
            value={precioCabeza}
            onChange={(e) => setPrecioCabeza(e.target.value)}
            style={inputStyle}
            placeholder={tipo === "Desecho" ? "Ej: 4000" : "Ej: 1200"}
          />
        </div>
      )}

      {datosValidos && (
  <div
    style={{
      background: "#f1f8e9",
      border: "1px solid #c5e1a5",
      borderRadius: "10px",
      padding: "12px",
      marginBottom: "16px",
    }}
  >
    <div style={rowStyle}>
      <span>Total venta:</span>
      <strong>${totalVenta.toFixed(2)}</strong>
    </div>
    <div style={rowStyle}>
      <span>Comisión:</span>
      <span style={{ color: "#C62828" }}>-${totalComision.toFixed(2)}</span>
    </div>
    <div style={rowStyle}>
      <span>Total rancho:</span>
      <strong>${totalRancho.toFixed(2)}</strong>
    </div>
    <div style={rowStyle}>
      <span>Anticipo:</span>
      <span>-${anticipo.toFixed(2)}</span>
    </div>
    <hr style={{ border: 0, borderTop: "1px solid #c5e1a5" }} />
    <div style={{ ...rowStyle, fontSize: "18px", fontWeight: "700" }}>
      <span>Resta por pagar:</span>
      <span style={{ color: restante < 0 ? "#C62828" : "#2E7D32" }}>
        ${restante.toFixed(2)}
      </span>
    </div>
  </div>
)}

      {error && (
        <p style={{ color: "#C62828", fontWeight: "600", marginBottom: "12px" }}>
          {error}
        </p>
      )}

      <button
        onClick={confirmar}
        disabled={loading || !datosValidos}
        style={{
          width: "100%",
          padding: "14px",
          background: loading || !datosValidos ? "#ccc" : "#2E7D32",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          fontWeight: "700",
          cursor: loading || !datosValidos ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Liquidando..." : "✅ Confirmar liquidación"}
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

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "6px",
};

export default LiquidarApartado;