import { useState, useEffect } from "react";
import api from "../api";
import { formatCLP } from "../api";

const RAZONES = [
  { value: "caducidad", label: "Caducidad" },
  { value: "mal_estado", label: "Mal estado" },
  { value: "error_cocina", label: "Error de cocina" },
  { value: "rotura", label: "Rotura / Derrame" },
  { value: "otro", label: "Otro" },
];

export default function Mermas() {
  const [data, setData] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [sucId, setSucId] = useState(Number(localStorage.getItem("resto_sucursal_id")) || "");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Formulario nueva merma
  const [showForm, setShowForm] = useState(false);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ producto: "", cantidad: 1, razon: "caducidad", responsable: "", observaciones: "" });
  const [creando, setCreando] = useState(false);

  const load = () => {
    const params = {};
    if (sucId) params.sucursal_id = sucId;
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    api.get("reportes/resumen-mermas/", { params }).then(({ data: d }) => setData(d));
  };

  useEffect(() => {
    api.get("sucursales/").then(({ data: d }) => setSucursales(d.results ?? d));
    api.get("productos/", { params: { page_size: 200 } }).then(({ data: d }) => setProductos(d.results ?? d));
    load();
  }, []);

  useEffect(() => { if (sucId || !sucId) load(); }, [sucId, desde, hasta]);

  const crearMerma = async (e) => {
    e.preventDefault();
    if (!form.producto || !form.responsable.trim()) return alert("Completa los campos");
    setCreando(true);
    try {
      await api.post("mermas/", {
        sucursal: Number(sucId) || 1,
        producto: Number(form.producto),
        cantidad: Number(form.cantidad),
        razon: form.razon,
        responsable: form.responsable.trim(),
        observaciones: form.observaciones,
      });
      setShowForm(false);
      setForm({ producto: "", cantidad: 1, razon: "caducidad", responsable: "", observaciones: "" });
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Error al crear merma");
    }
    setCreando(false);
  };

  const prodSelect = productos.find((p) => p.id === Number(form.producto));
  const perdidaEstimada = prodSelect ? Number(prodSelect.precio_venta) * Number(form.cantidad) : 0;

  return (
    <div>
      <h1 className="page-title">Mermas</h1>
      <p className="page-subtitle">Registro de perdidas con calculo automatico de costo</p>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <select className="form-select" style={{ maxWidth: 250 }} value={sucId} onChange={(e) => setSucId(e.target.value)}>
          <option value="">Todas las sucursales</option>
          {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <input className="form-input" style={{ maxWidth: 150 }} type="date" value={desde} onChange={(e) => setDesde(e.target.value)} placeholder="Desde" />
        <input className="form-input" style={{ maxWidth: 150 }} type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} placeholder="Hasta" />
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nueva Merma"}
        </button>
      </div>

      {/* Stats */}
      {data && (
        <div className="stats-grid">
          <div className="stat-card danger">
            <div className="stat-icon">Total Mermas</div>
            <div className="stat-value">{data.total_mermas}</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-icon">Perdida Total</div>
            <div className="stat-value small">{formatCLP(data.total_perdida)}</div>
          </div>
          {(data.por_razon || []).map((r) => (
            <div key={r.razon} className="stat-card warning">
              <div className="stat-icon">{RAZONES.find((x) => x.value === r.razon)?.label || r.razon}</div>
              <div className="stat-value small">{formatCLP(r.perdida)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario nueva merma */}
      {showForm && (
        <div className="card" style={{ maxWidth: 500, marginBottom: 20 }}>
          <div className="card-header"><h3>Registrar Merma</h3></div>
          <form onSubmit={crearMerma}>
            <div className="form-group">
              <label>Producto</label>
              <select className="form-select" value={form.producto} onChange={(e) => setForm((f) => ({ ...f, producto: e.target.value }))} required>
                <option value="">Selecciona...</option>
                {productos.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cantidad ({prodSelect?.unidad_medida || "un"})</label>
              <input className="form-input" type="number" step="0.5" min="0.5" value={form.cantidad}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))} required />
            </div>
            {prodSelect && (
              <div style={{ padding: "8px 12px", background: "#fef2f2", borderRadius: 8, marginBottom: 12, fontSize: "0.85rem" }}>
                Perdida estimada: <strong>{formatCLP(perdidaEstimada)}</strong>
                {" a precio de venta ($" + Number(prodSelect.precio_venta).toLocaleString() + "/" + prodSelect.unidad_medida + ")"}
              </div>
            )}
            <div className="form-group">
              <label>Razon</label>
              <select className="form-select" value={form.razon} onChange={(e) => setForm((f) => ({ ...f, razon: e.target.value }))}>
                {RAZONES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Responsable</label>
              <input className="form-input" value={form.responsable} onChange={(e) => setForm((f) => ({ ...f, responsable: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea className="form-input" rows={2} value={form.observaciones} onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} />
            </div>
            <button className="btn btn-danger btn-block" disabled={creando}>
              {creando ? "Guardando..." : "Registrar Merma"}
            </button>
          </form>
        </div>
      )}

      {/* Tabla de mermas */}
      <div className="card">
        <div className="card-header"><h3>Ultimas Mermas</h3></div>
        {!data || data.ultimas.length === 0 ? <div className="empty-state">Sin mermas registradas</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Sucursal</th><th>Producto</th><th>SKU</th><th>Cantidad</th><th>Razon</th><th>Responsable</th><th>Perdida</th></tr>
              </thead>
              <tbody>
                {data.ultimas.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: "0.8rem" }}>{m.fecha}</td>
                    <td>{m.sucursal}</td>
                    <td style={{ fontWeight: 500 }}>{m.producto}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{m.sku}</td>
                    <td>{m.cantidad}</td>
                    <td><span className="badge badge-danger">{m.razon}</span></td>
                    <td>{m.responsable}</td>
                    <td style={{ fontWeight: 600, color: "var(--danger)" }}>{formatCLP(m.perdida)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
