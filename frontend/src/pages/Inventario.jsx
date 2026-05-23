import { useState, useEffect } from "react";
import api from "../api";

export default function Inventario() {
  const [data, setData] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [filterSuc, setFilterSuc] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("sucursales/").then(({ data: d }) => setSucursales(d.results ?? d));
  }, []);

  useEffect(() => {
    const params = { page_size: 500 };
    if (filterSuc) params.sucursal = filterSuc;
    api.get("inventario/", { params }).then(({ data: d }) => setData(d.results ?? d));
  }, [filterSuc]);

  const filtered = search
    ? data.filter((i) => i.producto_nombre?.toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <div>
      <h1 className="page-title">Inventario</h1>
      <p className="page-subtitle">{filtered.length} registros de stock</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ minWidth: 250 }}>
          <select className="form-select" value={filterSuc} onChange={(e) => setFilterSuc(e.target.value)}>
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <input className="form-input" style={{ maxWidth: 300 }} type="text" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Sucursal</th><th>Producto</th><th>SKU</th><th>Stock</th><th>Minimo</th><th>Ubicacion</th><th>Lote</th><th>Vencimiento</th><th>Valor Total</th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const bajo = Number(item.stock_actual) < Number(item.stock_minimo);
                return (
                  <tr key={item.id} className={bajo ? "danger-row" : ""}>
                    <td>{item.sucursal_nombre}</td>
                    <td style={{ fontWeight: 500 }}>{item.producto_nombre}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{item.producto_sku}</td>
                    <td style={{ fontWeight: 600, color: bajo ? "var(--danger)" : "inherit" }}>{item.stock_actual}</td>
                    <td>{item.stock_minimo}</td>
                    <td><span className="badge badge-default">{item.ubicacion}</span></td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{item.lote}</td>
                    <td style={{ fontSize: "0.8rem" }}>{item.fecha_caducidad || "--"}</td>
                    <td style={{ fontWeight: 600 }}>${Number(item.valor_total || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} className="empty-state">Sin datos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
