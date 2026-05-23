import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function DashboardBodeguero() {
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [sucId, setSucId] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("sucursales/").then(({ data: d }) => {
      const list = d.results ?? d;
      setSucursales(list);
      const stored = localStorage.getItem("resto_sucursal_id");
      setSucId(stored ? Number(stored) : list[0]?.id);
    });
  }, []);

  useEffect(() => {
    if (!sucId) return;
    setData(null);
    api.get(`dashboard/bodeguero/${sucId}/`).then(({ data: d }) => setData(d));
  }, [sucId]);

  const ubiColors = {
    "Nivel Superior — listos para consumo": { bg: "#dbeafe", dot: "#2563eb" },
    "Nivel Medio — frutas/verduras": { bg: "#d1fae5", dot: "#059669" },
    "Nivel Inferior — carnes crudas": { bg: "#fef3c7", dot: "#d97706" },
    "Zona de Secos": { bg: "#f3f4f6", dot: "#6b7280" },
  };

  return (
    <div>
      <h1 className="page-title">Dashboard Bodeguero</h1>
      <p className="page-subtitle">Operaciones de bodega</p>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <div className="form-group" style={{ margin: 0, minWidth: 250 }}>
          <select className="form-select" value={sucId || ""} onChange={(e) => setSucId(Number(e.target.value))}>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <button className="btn btn-success" onClick={() => navigate("/movimiento")}>
          Nuevo Ingreso
        </button>
        <button className="btn btn-danger" onClick={() => navigate("/movimiento")}>
          Nueva Salida
        </button>
      </div>

      {!data ? <div className="loading">Cargando...</div> : (
        <>
          <div className="stats-grid">
            <div className="stat-card info">
              <div className="stat-icon">Productos</div>
              <div className="stat-value">{data.total_productos}</div>
              <div className="stat-label">Distintos en bodega</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">Stock total</div>
              <div className="stat-value">{data.total_stock}</div>
              <div className="stat-label">Unidades en inventario</div>
            </div>
            <div className={`stat-card ${data.alertas_criticas > 0 ? "danger" : "success"}`}>
              <div className="stat-icon">Alertas criticas</div>
              <div className="stat-value">{data.alertas_criticas}</div>
              <div className="stat-label">{data.alertas_criticas > 0 ? "Requiere atencion" : "Sin novedad"}</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header"><h3>Stock por Ubicacion</h3></div>
              {data.stock_por_ubicacion.length === 0 ? (
                <div className="empty-state">Sin datos</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.stock_por_ubicacion.map((u) => {
                    const colors = ubiColors[u.ubicacion] || { bg: "#f3f4f6", dot: "#6b7280" };
                    return (
                      <div key={u.ubicacion} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", background: colors.bg, borderRadius: 8,
                      }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 500 }}>{u.ubicacion}</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{u.total}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header"><h3>Movimientos de Hoy</h3></div>
              {data.movimientos_hoy.length === 0 ? (
                <div className="empty-state">Sin movimientos hoy</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead><tr><th>Hora</th><th>Tipo</th><th>SKU</th><th>Tipo SKU</th><th>Metodo</th><th>Responsable</th></tr></thead>
                    <tbody>
                      {data.movimientos_hoy.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontSize: "0.8rem" }}>{m.hora}</td>
                          <td><span className={`badge ${m.tipo === "entrada" ? "badge-success" : "badge-danger"}`}>{m.tipo}</span></td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{m.sku}</td>
                          <td><span className="badge badge-default">{m.tipo_sku}</span></td>
                          <td><span className="badge badge-info">{m.metodo}</span></td>
                          <td>{m.responsable}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
