import { useState, useEffect } from "react";
import api from "../api";
import { formatCLP } from "../api";

export default function Solicitud() {
  const [data, setData] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [sucId, setSucId] = useState(Number(localStorage.getItem("resto_sucursal_id")) || "");
  const [criticos, setCriticos] = useState(false);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!sucId) return;
    setLoading(true);
    const params = { sucursal_id: sucId };
    if (criticos) params.criticos = "true";
    api.get("solicitud/productos-con-proveedores/", { params })
      .then(({ data: d }) => {
        setData(d);
        const sel = {};
        for (const prov of d.proveedores || []) {
          for (const prod of prov.productos || []) {
            if (prod.critico) sel[prod.id] = true;
          }
        }
        setSelected(sel);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get("sucursales/").then(({ data: d }) => setSucursales(d.results ?? d));
  }, []);

  useEffect(() => { if (sucId) load(); }, [sucId, criticos]);

  const allProducts = (data?.proveedores || []).flatMap((p) => p.productos);
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "") || "";

  const descargar = (formato) => {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k).join(",");
    if (!ids) return alert("Selecciona al menos un producto");
    window.open(`${baseUrl}/api/solicitud/descargar/?formato=${formato}&sucursal_id=${sucId}&productos=${ids}&titulo=Solicitud+de+Productos`, "_blank");
  };

  const toggleSelectAll = (checked) => {
    const sel = {};
    for (const prov of data?.proveedores || []) {
      for (const prod of prov.productos || []) {
        sel[prod.id] = checked;
      }
    }
    setSelected(sel);
  };

  return (
    <div>
      <h1 className="page-title">Solicitud de Productos</h1>
      <p className="page-subtitle">Selecciona productos para descargar orden de compra en PDF o Excel — precios en CLP</p>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ minWidth: 250 }}>
          <select className="form-select" value={sucId} onChange={(e) => { setSucId(Number(e.target.value)); }}>
            <option value="">Selecciona sucursal</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.85rem" }}>
          <input type="checkbox" checked={criticos} onChange={(e) => setCriticos(e.target.checked)} />
          Solo criticos (stock &lt; minimo)
        </label>
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          {allProducts.length} productos | {selectedCount} seleccionados
        </span>
      </div>

      {selectedCount > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={() => descargar("pdf")}>Descargar PDF</button>
          <button className="btn btn-success" onClick={() => descargar("xlsx")}>Descargar Excel</button>
        </div>
      )}

      {loading ? <div className="loading">Cargando...</div> : !data ? null : (
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: "0.85rem", cursor: "pointer" }}>
            <input type="checkbox" checked={selectedCount === allProducts.length && allProducts.length > 0}
              onChange={(e) => toggleSelectAll(e.target.checked)} />
            <strong>Seleccionar todos</strong>
          </label>

          {(data.proveedores || []).map((prov) => {
            const provSelected = prov.productos.every((p) => selected[p.id]);
            return (
              <div key={prov.id} className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={provSelected}
                      onChange={(e) => {
                        const sel = { ...selected };
                        for (const p of prov.productos) sel[p.id] = e.target.checked;
                        setSelected(sel);
                      }} />
                    <h3>{prov.nombre}</h3>
                    <span className="badge badge-default">{prov.rut}</span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {prov.productos.length} productos
                  </span>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th style={{ width: 40 }}></th><th>SKU</th><th>Producto</th><th>Categoria</th><th>Unidad</th><th>Precio</th><th>Stock</th><th>Minimo</th><th>Solicitar</th></tr>
                    </thead>
                    <tbody>
                      {prov.productos.map((p) => (
                        <tr key={p.id} className={p.critico ? "danger-row" : ""}>
                          <td><input type="checkbox" checked={!!selected[p.id]} onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.checked }))} /></td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.sku}</td>
                          <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                          <td>{p.categoria}</td>
                          <td><span className="badge badge-info">{p.unidad}</span></td>
                          <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{formatCLP(p.precio_compra)}</td>
                          <td style={{ fontWeight: 600, color: p.critico ? "var(--danger)" : "inherit" }}>{p.stock_actual}</td>
                          <td>{p.stock_minimo}</td>
                          <td style={{ fontWeight: 600 }}>{selected[p.id] ? Math.ceil(p.cantidad_sugerida) : 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {prov.contacto && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 8 }}>
                    Contacto: {prov.contacto} | {prov.telefono}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
