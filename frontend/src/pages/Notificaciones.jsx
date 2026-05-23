import { useState, useEffect } from "react";
import api from "../api";

const ICONS = {
  rechazo: { icon: "X", color: "#dc2626", bg: "#fee2e2", label: "Rechazo" },
  alerta: { icon: "!", color: "#d97706", bg: "#fef3c7", label: "Alerta" },
  pedido: { icon: "O", color: "#2563eb", bg: "#dbeafe", label: "Pedido" },
  sistema: { icon: "i", color: "#6b7280", bg: "#f3f4f6", label: "Sistema" },
};

export default function Notificaciones() {
  const [data, setData] = useState([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    api.get("notificaciones/", { params: { ordering: "-creada_en", page_size: 100 } }).then(({ data: d }) => setData(d.results ?? d));
  }, []);

  const marcarLeida = async (id) => {
    await api.patch(`notificaciones/${id}/`, { leida: true });
    setData((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  };

  const filtered = filtro ? data.filter((n) => n.tipo === filtro) : data;
  const noLeidas = data.filter((n) => !n.leida).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Notificaciones</h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 2 }}>
            {noLeidas > 0
              ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>{noLeidas} sin leer</span>
              : "Todas leidas"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["", "rechazo", "alerta", "pedido", "sistema"].map((f) => (
            <button key={f} className={`btn ${filtro === f ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "6px 14px", fontSize: "0.75rem" }} onClick={() => setFiltro(f)}>
              {f === "" ? "Todas" : (ICONS[f]?.label || f)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>---</div>
          <p>No hay notificaciones</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 720 }}>
          {filtered.map((n) => {
            const style = ICONS[n.tipo] || ICONS.sistema;
            return (
              <div
                key={n.id}
                onClick={() => !n.leida && marcarLeida(n.id)}
                style={{
                  display: "flex", gap: 14, alignItems: "flex-start",
                  padding: "16px 18px",
                  background: n.leida ? "#ffffff" : "#f8faff",
                  border: `1px solid ${n.leida ? "var(--border)" : style.bg}`,
                  borderRadius: 12,
                  borderLeft: `4px solid ${n.leida ? "transparent" : style.color}`,
                  boxShadow: n.leida ? "var(--shadow)" : "0 2px 8px rgba(0,0,0,0.05)",
                  cursor: n.leida ? "default" : "pointer",
                  transition: "all 0.2s",
                  opacity: n.leida ? 0.75 : 1,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: style.bg, color: style.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
                }}>
                  {style.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{n.titulo}</span>
                    {!n.leida && (
                      <span style={{
                        background: style.color, color: "white", borderRadius: 999,
                        padding: "0 8px", fontSize: "0.6rem", fontWeight: 700,
                        lineHeight: "16px", textTransform: "uppercase",
                      }}>Nuevo</span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    {n.mensaje}
                  </p>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    <span>{n.sucursal_nombre}</span>
                    <span>{new Date(n.creada_en).toLocaleString("es-CL")}</span>
                  </div>
                </div>

                {/* Read status */}
                {n.leida && (
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    Leida
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
