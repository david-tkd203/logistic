import { useState, useEffect } from "react";
import api from "../api";

export default function Sugerencias() {
  const [data, setData] = useState([]);

  const load = () => {
    api.get("sugerencias/", { params: { ordering: "-creada_en", page_size: 100 } })
      .then(({ data: d }) => setData(d.results ?? d));
  };

  useEffect(load, []);

  const cambiarEstado = async (id, estado) => {
    await api.patch(`sugerencias/${id}/`, { estado });
    load();
  };

  return (
    <div>
      <h1 className="page-title">Sugerencias de Abastecimiento</h1>
      <p className="page-subtitle">
        Generadas automaticamente cuando el stock baja del minimo
        | {data.filter((s) => s.estado === "pendiente").length} pendientes
      </p>

      {data.length === 0 ? <div className="empty-state">Sin sugerencias — stock saludable</div> : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Sucursal</th><th>Producto</th><th>SKU</th><th>Stock Actual</th><th>Minimo</th><th>Sugerido</th><th>Proveedor</th><th>Estado</th><th>Accion</th></tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <td>{s.sucursal_nombre}</td>
                    <td style={{ fontWeight: 500 }}>{s.producto_nombre}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{s.producto_sku}</td>
                    <td style={{ fontWeight: 600, color: "var(--danger)" }}>{s.stock_actual}</td>
                    <td>{s.stock_minimo}</td>
                    <td style={{ fontWeight: 600 }}>{s.cantidad_sugerida}</td>
                    <td>{s.proveedor_nombre || "--"}</td>
                    <td>
                      <span className={`badge ${s.estado === "aprobada" ? "badge-success" : s.estado === "ignorada" ? "badge-default" : "badge-warning"}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td>
                      {s.estado === "pendiente" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-success" style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                            onClick={() => cambiarEstado(s.id, "aprobada")}>Aprobar</button>
                          <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                            onClick={() => cambiarEstado(s.id, "ignorada")}>Ignorar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
