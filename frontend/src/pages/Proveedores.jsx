import { useState, useEffect } from "react";
import api from "../api";

export default function Proveedores() {
  const [data, setData] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get("proveedores/").then(({ data: d }) => setData(d.results ?? d));
    api.get("productos-proveedor/", { params: { page_size: 500 } }).then(({ data: d }) => setPrecios(d.results ?? d));
  }, []);

  // Agrupar precios por proveedor
  const preciosPorProv = {};
  for (const pp of precios) {
    if (!preciosPorProv[pp.proveedor]) preciosPorProv[pp.proveedor] = [];
    preciosPorProv[pp.proveedor].push(pp);
  }

  return (
    <div>
      <h1 className="page-title">Proveedores</h1>
      <p className="page-subtitle">{data.length} proveedores registrados</p>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">Proveedores</div><div className="stat-value">{data.length}</div></div>
        <div className="stat-card"><div className="stat-icon">Productos asignados</div><div className="stat-value">{precios.length}</div><div className="stat-label">En total</div></div>
      </div>

      {(data || []).map((prov) => {
        const prods = preciosPorProv[prov.id] || [];
        return (
          <div key={prov.id} className="caja-card">
            <div className="caja-card-header" onClick={() => setExpanded(expanded === prov.id ? null : prov.id)}>
              <div>
                <h4>{prov.nombre}</h4>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  {prov.rut} | {prov.contacto} | {prov.telefono}
                </span>
              </div>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                {prods.length} productos
              </span>
            </div>
            {expanded === prov.id && (
              <div className="caja-card-body">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Producto</th><th>SKU</th><th>Sucursal</th><th>Precio Compra</th></tr>
                    </thead>
                    <tbody>
                      {prods.map((pp) => (
                        <tr key={pp.id}>
                          <td>{pp.producto_nombre}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{pp.producto_sku}</td>
                          <td>{pp.sucursal_nombre}</td>
                          <td style={{ fontWeight: 600 }}>${Number(pp.precio_compra).toLocaleString()}</td>
                        </tr>
                      ))}
                      {prods.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-secondary)", padding: 20 }}>Sin productos asignados</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
