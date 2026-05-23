import { useState, useEffect } from "react";
import api from "../api";

export default function Alertas() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("alertas-stock/", { params: { ordering: "-creada_en", page_size: 100 } }).then(({ data: d }) => setData(d.results ?? d));
  }, []);

  const criticas = data.filter((a) => a.tipo === "critico");
  const bajas = data.filter((a) => a.tipo === "bajo");

  return (
    <div>
      <h1 className="page-title">Alertas de Stock</h1>
      <p className="page-subtitle">{data.length} alertas activas</p>

      <div className="stats-grid">
        <div className="stat-card danger"><div className="stat-icon">Criticas</div><div className="stat-value">{criticas.length}</div><div className="stat-label">Stock agotado</div></div>
        <div className="stat-card warning"><div className="stat-icon">Bajas</div><div className="stat-value">{bajas.length}</div><div className="stat-label">Por debajo del minimo</div></div>
        <div className="stat-card"><div className="stat-icon">Totales</div><div className="stat-value">{data.length}</div></div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Sucursal</th><th>Producto</th><th>Tipo</th><th>Stock Actual</th><th>Stock Minimo</th><th>Estado</th></tr></thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id}>
                  <td>{a.sucursal_nombre}</td>
                  <td style={{ fontWeight: 500 }}>{a.producto_nombre}</td>
                  <td><span className={`badge ${a.tipo === "critico" ? "badge-danger" : "badge-warning"}`}>{a.tipo}</span></td>
                  <td style={{ fontWeight: 600, color: a.tipo === "critico" ? "var(--danger)" : "var(--warning)" }}>{a.stock_actual}</td>
                  <td>{a.stock_minimo}</td>
                  <td><span className={`badge ${a.leida ? "badge-default" : "badge-info"}`}>{a.leida ? "Leida" : "No leida"}</span></td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} className="empty-state">Sin alertas activas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
