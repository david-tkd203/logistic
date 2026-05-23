import { useState, useEffect } from "react";
import api from "../api";

export default function Cajas() {
  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get("cajas/").then(({ data: d }) => setData(d.results ?? d));
  }, []);

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <h1 className="page-title">Cajas</h1>
      <p className="page-subtitle">SKU de cajas que contienen multiples productos</p>

      {data.length === 0 ? <div className="loading">Cargando...</div> : (
        <div style={{ maxWidth: 700 }}>
          {data.map((caja) => (
            <div key={caja.id} className="caja-card">
              <div className="caja-card-header" onClick={() => toggle(caja.id)}>
                <div>
                  <h4>{caja.nombre}</h4>
                  <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    SKU: {caja.sku}
                  </span>
                </div>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                  {expanded[caja.id] ? "▲" : "▼"} {caja.contenido?.length || 0} productos
                </span>
              </div>
              {expanded[caja.id] && (
                <div className="caja-card-body">
                  <table>
                    <thead>
                      <tr><th>Producto</th><th>SKU</th><th>Cantidad</th></tr>
                    </thead>
                    <tbody>
                      {(caja.contenido || []).map((item, i) => (
                        <tr key={i}>
                          <td>{item.producto_nombre}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{item.producto_sku}</td>
                          <td>{item.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
