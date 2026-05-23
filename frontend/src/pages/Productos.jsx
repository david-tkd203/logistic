import { useState, useEffect } from "react";
import api from "../api";

export default function Productos() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("productos/", { params: { page_size: 100 } }).then(({ data: d }) => setData(d.results ?? d));
  }, []);

  // Obtener proveedores para cada producto
  const [provMap, setProvMap] = useState({});
  useEffect(() => {
    api.get("productos-proveedor/", { params: { page_size: 500 } }).then(({ data: d }) => {
      const map = {};
      for (const pp of (d.results ?? d)) {
        if (!map[pp.producto]) map[pp.producto] = [];
        map[pp.producto].push(pp.proveedor_nombre);
      }
      setProvMap(map);
    });
  }, []);

  const filtered = search
    ? data.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <div>
      <h1 className="page-title">Productos</h1>
      <p className="page-subtitle">{data.length} SKU registrados</p>

      <input className="form-input" style={{ maxWidth: 350, marginBottom: 16 }} type="text" placeholder="Buscar por nombre o SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>SKU</th><th>Nombre</th><th>Categoria</th><th>Unidad</th><th>Precio Venta</th><th>Conservacion</th><th>Proveedor(es)</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{p.sku}</td>
                  <td>{p.nombre}</td>
                  <td>{p.categoria_nombre}</td>
                  <td>{p.unidad_medida}</td>
                  <td style={{ fontWeight: 600 }}>${Number(p.precio_venta).toLocaleString()}</td>
                  <td><span className={`badge ${p.tipo_conservacion === "refrigerado" ? "badge-info" : p.tipo_conservacion === "congelado" ? "badge-info" : "badge-default"}`}>{p.tipo_conservacion || "seco"}</span></td>
                  <td style={{ fontSize: "0.8rem" }}>
                    {(provMap[p.id] || []).slice(0, 2).join(", ")}
                    {(provMap[p.id] || []).length > 2 && <span className="badge badge-default" style={{ marginLeft: 4 }}>+{(provMap[p.id] || []).length - 2}</span>}
                    {!(provMap[p.id] || []).length && <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td><span className={`badge ${p.activo ? "badge-success" : "badge-danger"}`}>{p.activo ? "Activo" : "Inactivo"}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="empty-state">Sin productos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
