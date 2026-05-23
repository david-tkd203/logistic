import { useState, useEffect } from "react";
import api from "../api";

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);

export default function DashboardAdmin() {
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
    api.get(`dashboard/admin/${sucId}/`).then(({ data: d }) => setData(d));
  }, [sucId]);

  return (
    <div>
      <h1 className="page-title">Dashboard Admin Local</h1>
      <p className="page-subtitle">Gestion por sucursal</p>

      <div className="form-group" style={{ maxWidth: 300 }}>
        <select className="form-select" value={sucId || ""} onChange={(e) => setSucId(Number(e.target.value))}>
          {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </div>

      {!data ? <div className="loading">Cargando...</div> : (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon">Stock total</div><div className="stat-value">{data.total_stock}</div></div>
            <div className="stat-card danger"><div className="stat-icon">Alertas</div><div className="stat-value">{data.total_alertas}</div></div>
            <div className="stat-card"><div className="stat-icon">Pedidos</div><div className="stat-value">{data.total_pedidos}</div></div>
            <div className="stat-card success"><div className="stat-icon">Valor inventario</div><div className="stat-value small">{fmt(data.valor_inventario)}</div></div>
            <div className="stat-card info"><div className="stat-icon">Movimientos (30d)</div><div className="stat-value">{data.total_movimientos_mes}</div></div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header"><h3>Stock Bajo</h3></div>
              {data.stock_bajo.length === 0 ? (
                <div className="empty-state">Sin alertas de stock bajo</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead><tr><th>Producto</th><th>SKU</th><th>Stock</th><th>Minimo</th></tr></thead>
                    <tbody>
                      {data.stock_bajo.map((item, i) => (
                        <tr key={i} className="danger-row">
                          <td>{item.producto}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{item.sku}</td>
                          <td>{item.stock}</td>
                          <td>{item.minimo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header"><h3>Ultimos Movimientos</h3></div>
              {data.ultimos_movimientos.length === 0 ? (
                <div className="empty-state">Sin movimientos recientes</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead><tr><th>Tipo</th><th>SKU</th><th>Responsable</th><th>Fecha</th></tr></thead>
                    <tbody>
                      {data.ultimos_movimientos.map((m) => (
                        <tr key={m.id}>
                          <td><span className={`badge ${m.tipo === "entrada" ? "badge-success" : "badge-danger"}`}>{m.tipo}</span></td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{m.sku}</td>
                          <td>{m.responsable}</td>
                          <td style={{ fontSize: "0.8rem" }}>{new Date(m.fecha).toLocaleString("es-CL")}</td>
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
