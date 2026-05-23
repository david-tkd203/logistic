import { useState, useEffect } from "react";
import api from "../api";

export default function Movimientos() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api.get("movimientos/", { params: { ordering: "-creado_en", page_size: 100 } })
      .then(({ data: d }) => setData(d.results ?? d));
  }, []);

  const filtered = filter ? data.filter((m) => m.tipo === filter) : data;

  return (
    <div>
      <h1 className="page-title">Movimientos</h1>
      <p className="page-subtitle">Historial de entradas y salidas</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["", "entrada", "salida"].map((f) => (
          <button
            key={f}
            className={`btn ${filter === f ? (f === "entrada" ? "btn-success" : f === "salida" ? "btn-danger" : "btn-primary") : "btn-outline"}`}
            onClick={() => setFilter(f)}
          >
            {f === "" ? "Todos" : f === "entrada" ? "Entradas" : "Salidas"}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Fecha/Hora</th><th>Sucursal</th><th>Tipo</th><th>SKU</th><th>Tipo SKU</th><th>Metodo</th><th>Responsable</th><th>Productos</th></tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: "0.8rem" }}>{new Date(m.creado_en).toLocaleString("es-CL")}</td>
                  <td>{m.sucursal_nombre}</td>
                  <td><span className={`badge ${m.tipo === "entrada" ? "badge-success" : "badge-danger"}`}>{m.tipo}</span></td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{m.sku_ingresado}</td>
                  <td><span className="badge badge-default">{m.tipo_sku}</span></td>
                  <td><span className="badge badge-info">{m.metodo}</span></td>
                  <td>{m.responsable}</td>
                  <td style={{ fontSize: "0.8rem" }}>
                    {(m.productos || []).map((p, i) => (
                      <div key={i}>{p.cantidad} x {p.producto_nombre}</div>
                    ))}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty-state">Sin movimientos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
