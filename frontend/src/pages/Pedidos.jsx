import { useState, useEffect } from "react";
import api from "../api";

const badges = {
  pendiente: "badge-warning", aprobado: "badge-info", preparacion: "badge-info",
  enviado: "badge-info", recibido: "badge-success", cancelado: "badge-danger",
};

const FLUJO = ["pendiente", "aprobado", "preparacion", "enviado", "recibido"];

export default function Pedidos() {
  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState({});

  const load = () => {
    api.get("pedidos/", { params: { ordering: "-creado_en", page_size: 50 } })
      .then(({ data: d }) => setData(d.results ?? d));
  };

  useEffect(load, []);

  const accion = async (id, action, extra = {}) => {
    setLoading((p) => ({ ...p, [id]: action }));
    try {
      await api.post(`pedidos/${id}/${action}/`, extra);
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Error");
    }
    setLoading((p) => ({ ...p, [id]: null }));
  };

  const nextEstado = (estado) => {
    const idx = FLUJO.indexOf(estado);
    return idx >= 0 && idx < FLUJO.length - 1 ? FLUJO[idx + 1] : null;
  };

  const usuario = localStorage.getItem("resto_usuario") || "Sistema";

  return (
    <div>
      <h1 className="page-title">Pedidos</h1>
      <p className="page-subtitle">{data.length} pedidos | {data.filter((p) => p.estado === "pendiente").length} pendientes</p>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">Total</div><div className="stat-value">{data.length}</div></div>
        <div className="stat-card warning"><div className="stat-icon">Pendientes</div><div className="stat-value">{data.filter((p) => p.estado === "pendiente").length}</div></div>
        <div className="stat-card success"><div className="stat-icon">Recibidos</div><div className="stat-value">{data.filter((p) => p.estado === "recibido").length}</div></div>
        <div className="stat-card info"><div className="stat-icon">En transito</div><div className="stat-value">{data.filter((p) => ["aprobado", "preparacion", "enviado"].includes(p.estado)).length}</div></div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>#</th><th>Sucursal</th><th>Estado</th><th>Items</th><th>Creado por</th><th>Fecha</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <>
                  <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                    <td style={{ fontWeight: 600 }}>#{p.id}</td>
                    <td>{p.sucursal_nombre}</td>
                    <td><span className={`badge ${badges[p.estado] || "badge-default"}`}>{p.estado}</span></td>
                    <td>{p.items_count || 0}</td>
                    <td>{p.creado_por || "--"}</td>
                    <td style={{ fontSize: "0.8rem" }}>{new Date(p.creado_en).toLocaleDateString("es-CL")}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        {p.estado === "pendiente" && (
                          <>
                            <button className="btn btn-success" style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                              onClick={() => accion(p.id, "aprobar", { aprobado_por: usuario })}
                              disabled={loading[p.id] === "aprobar"}>
                              {loading[p.id] === "aprobar" ? "..." : "Aprobar"}
                            </button>
                            <button className="btn btn-danger" style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                              onClick={() => {
                                const motivo = prompt("Motivo de rechazo:");
                                if (motivo) accion(p.id, "rechazar", { motivo });
                              }}
                              disabled={loading[p.id] === "rechazar"}>
                              Rechazar
                            </button>
                          </>
                        )}
                        {nextEstado(p.estado) && (
                          <button className="btn btn-primary" style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                            onClick={() => accion(p.id, "avanzar")}
                            disabled={loading[p.id] === "avanzar"}>
                            {loading[p.id] === "avanzar" ? "..." : `→ ${nextEstado(p.estado)}`}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === p.id && (
                    <tr key={`${p.id}-detail`}>
                      <td colSpan={7} style={{ padding: "16px 24px", background: "#f9fafb" }}>
                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                          {/* Tracking timeline */}
                          <div style={{ minWidth: 200 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>Tracking</div>
                            {FLUJO.map((est, i) => {
                              const idx = FLUJO.indexOf(p.estado);
                              const done = i <= idx;
                              const current = i === idx;
                              return (
                                <div key={est} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, opacity: done ? 1 : 0.4 }}>
                                  <div style={{
                                    width: 20, height: 20, borderRadius: "50%",
                                    background: current ? "var(--accent)" : done ? "var(--success)" : "#d1d5db",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "white", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0,
                                  }}>{i + 1}</div>
                                  <span style={{ fontSize: "0.85rem" }}>{est}</span>
                                  {current && <span className="badge badge-info">Actual</span>}
                                </div>
                              );
                            })}
                          </div>
                          {/* Details */}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>Detalles</div>
                            {p.aprobado_por && <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>Aprobado por: {p.aprobado_por}</div>}
                            {p.rechazado_motivo && <div style={{ fontSize: "0.85rem", marginBottom: 4, color: "var(--danger)" }}>Rechazado: {p.rechazado_motivo}</div>}
                            {p.observaciones && <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>Obs: {p.observaciones}</div>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {data.length === 0 && <tr><td colSpan={7} className="empty-state">Sin pedidos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
