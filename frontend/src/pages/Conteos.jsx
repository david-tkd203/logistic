import { useState, useEffect } from "react";
import api from "../api";

export default function Conteos() {
  const [data, setData] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [creando, setCreando] = useState(false);
  const [sucId, setSucId] = useState(Number(localStorage.getItem("resto_sucursal_id")) || "");
  const [responsable, setResponsable] = useState(localStorage.getItem("resto_usuario") || "");
  const [conteoActivo, setConteoActivo] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [conteos, setConteos] = useState({});
  const [confirmando, setConfirmando] = useState(false);
  const [resultadoAjuste, setResultadoAjuste] = useState(null);

  const load = () => {
    api.get("conteos/", { params: { ordering: "-creado_en", page_size: 50 } })
      .then(({ data: d }) => setData(d.results ?? d));
  };

  useEffect(() => {
    api.get("sucursales/").then(({ data: d }) => setSucursales(d.results ?? d));
    load();
  }, []);

  const iniciarConteo = async () => {
    if (!sucId || !responsable.trim()) return;
    const { data: conteo } = await api.post("conteos/", { sucursal: Number(sucId), responsable: responsable.trim() });
    setConteoActivo(conteo);
    setCreando(false);
    // Cargar inventario de la sucursal
    const { data: inv } = await api.get("inventario/", { params: { sucursal: Number(sucId), page_size: 200 } });
    setInventario(inv.results ?? inv);
    setConteos({});
  };

  const guardarConteo = async (productoId, cantidadFisica) => {
    if (!conteoActivo) return;
    const prod = inventario.find((i) => i.producto === productoId);
    if (!prod) return;

    const payload = {
      conteo: conteoActivo.id,
      producto: productoId,
      cantidad_sistema: Number(prod.stock_actual),
      cantidad_fisica: Number(cantidadFisica) || 0,
    };

    // Si ya existe, actualizar
    if (conteos[productoId]?.id) {
      await api.patch(`conteo-productos/${conteos[productoId].id}/`, { cantidad_fisica: Number(cantidadFisica) || 0 });
    } else {
      const { data: cp } = await api.post("conteo-productos/", payload);
      setConteos((prev) => ({ ...prev, [productoId]: cp }));
    }
  };

  const confirmarConteo = async () => {
    if (!conteoActivo) return;
    setConfirmando(true);
    try {
      const { data } = await api.post(`conteos/${conteoActivo.id}/confirmar/`);
      setResultadoAjuste(data);
      setConteoActivo(null);
      setConteos({});
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Error al confirmar");
    }
    setConfirmando(false);
  };

  const cancelarConteo = () => {
    setConteoActivo(null);
    setConteos({});
    setInventario([]);
    setResultadoAjuste(null);
  };

  return (
    <div>
      <h1 className="page-title">Inventarios Ciclicos</h1>
      <p className="page-subtitle">Conteo fisico de inventario con ajuste automatico</p>

      {resultadoAjuste ? (
        <div className="card">
          <div className="card-header"><h3>Ajuste Completado</h3></div>
          <div className="movimiento-summary">
            <h4>Conteo #{resultadoAjuste.conteo_id}</h4>
            <p>{resultadoAjuste.productos_ajustados.length} productos ajustados</p>
            <ul>
              {resultadoAjuste.productos_ajustados.map((p, i) => (
                <li key={i}>
                  {p.producto}: diferencia {p.diferencia > 0 ? "+" : ""}{p.diferencia}
                  {" → "}nuevo stock: {p.nuevo_stock}
                </li>
              ))}
            </ul>
          </div>
          <button className="btn btn-primary" onClick={() => setResultadoAjuste(null)}>Nuevo Conteo</button>
        </div>
      ) : conteoActivo ? (
        <div>
          <div className="card">
            <div className="card-header">
              <h3>Conteo #{conteoActivo.id} — {conteoActivo.sucursal_nombre}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-outline" onClick={cancelarConteo}>Cancelar</button>
                <button className="btn btn-success" onClick={confirmarConteo} disabled={confirmando}>
                  {confirmando ? "Ajustando..." : "Confirmar y Ajustar"}
                </button>
              </div>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 16 }}>
              Ingresa la cantidad fisica de cada producto. El sistema calculara la diferencia.
            </p>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Producto</th><th>SKU</th><th>Stock Sistema</th><th>Cantidad Fisica</th><th>Diferencia</th></tr>
                </thead>
                <tbody>
                  {inventario.map((inv) => {
                    const cp = conteos[inv.producto];
                    const dif = cp ? Number(cp.cantidad_fisica) - Number(inv.stock_actual) : 0;
                    const tieneDif = dif !== 0 && cp;
                    return (
                      <tr key={inv.id} className={tieneDif ? "danger-row" : ""}>
                        <td style={{ fontWeight: 500 }}>{inv.producto_nombre}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{inv.producto_sku}</td>
                        <td>{inv.stock_actual}</td>
                        <td>
                          <input
                            className="form-input"
                            style={{ maxWidth: 100, textAlign: "center" }}
                            type="number"
                            step="0.5"
                            defaultValue=""
                            placeholder="0"
                            onBlur={(e) => {
                              if (e.target.value) guardarConteo(inv.producto, e.target.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.target.value) guardarConteo(inv.producto, e.target.value);
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 600, color: dif > 0 ? "var(--success)" : dif < 0 ? "var(--danger)" : "inherit" }}>
                          {cp ? (dif > 0 ? "+" : "") + dif.toFixed(1) : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="stats-grid">
            <div className="stat-card info"><div className="stat-icon">Total Conteos</div><div className="stat-value">{data.length}</div></div>
            <div className="stat-card warning"><div className="stat-icon">En progreso</div><div className="stat-value">{data.filter((c) => c.estado === "en_progreso").length}</div></div>
            <div className="stat-card success"><div className="stat-icon">Completados</div><div className="stat-value">{data.filter((c) => c.estado === "completado").length}</div></div>
          </div>

          {!creando ? (
            <button className="btn btn-primary btn-lg" onClick={() => setCreando(true)}>
              Nuevo Conteo
            </button>
          ) : (
            <div className="card" style={{ maxWidth: 500 }}>
              <div className="card-header"><h3>Iniciar Conteo</h3></div>
              <div className="form-group">
                <label>Sucursal</label>
                <select className="form-select" value={sucId} onChange={(e) => setSucId(Number(e.target.value))}>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Responsable</label>
                <input className="form-input" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={iniciarConteo}>Comenzar Conteo</button>
                <button className="btn btn-outline" onClick={() => setCreando(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header"><h3>Historial de Conteos</h3></div>
            {data.length === 0 ? <div className="empty-state">Sin conteos registrados</div> : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>#</th><th>Sucursal</th><th>Responsable</th><th>Productos</th><th>Diferencias</th><th>Estado</th><th>Fecha</th></tr>
                  </thead>
                  <tbody>
                    {data.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>#{c.id}</td>
                        <td>{c.sucursal_nombre}</td>
                        <td>{c.responsable}</td>
                        <td>{c.total_productos}</td>
                        <td style={{ fontWeight: 600, color: c.total_diferencias > 0 ? "var(--danger)" : "inherit" }}>{c.total_diferencias}</td>
                        <td><span className={`badge ${c.estado === "completado" ? "badge-success" : "badge-warning"}`}>{c.estado}</span></td>
                        <td style={{ fontSize: "0.8rem" }}>{new Date(c.creado_en).toLocaleDateString("es-CL")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
