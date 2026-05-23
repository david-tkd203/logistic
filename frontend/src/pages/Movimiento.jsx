import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../api";

const SCANNER_ID = "barcode-scanner";

function playBeep(freq = 880, duration = 100) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, duration);
  } catch {}
}

export default function Movimiento() {
  const [sucursales, setSucursales] = useState([]);
  const [sucId, setSucId] = useState(Number(localStorage.getItem("resto_sucursal_id")) || null);
  const [tipo, setTipo] = useState("entrada");
  const [responsable, setResponsable] = useState(localStorage.getItem("resto_usuario") || "");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultadoMov, setResultadoMov] = useState(null);
  const [modoContinuo, setModoContinuo] = useState(true);

  // Scanner
  const [scannerOn, setScannerOn] = useState(false);
  const scannerRef = useRef(null);
  const [sku, setSku] = useState("");
  const [buscandoSku, setBuscandoSku] = useState(false);
  const [resultadoSku, setResultadoSku] = useState(null);
  const [tipoSku, setTipoSku] = useState(null);

  // Lista de productos escaneados (sesion actual)
  const [scanList, setScanList] = useState([]);

  useEffect(() => {
    api.get("sucursales/").then(({ data }) => {
      const list = data.results ?? data;
      setSucursales(list);
      if (!sucId && list.length > 0) setSucId(list[0].id);
    });
  }, []);

  // ── Scanner ──────────────────────────────────────────────────────────
  const startScanner = useCallback(() => {
    setScannerOn(true);
    setError("");
    setTimeout(() => {
      const el = document.getElementById(SCANNER_ID);
      if (!el) return;
      try {
        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;
        scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            const code = decodedText.trim().toUpperCase();
            playBeep(1100, 80);
            agregarSku(code);
          },
          () => {}
        ).catch(() => {
          setError("No se pudo acceder a la camara");
          setScannerOn(false);
        });
      } catch {
        setError("Escaneo no disponible");
        setScannerOn(false);
      }
    }, 200);
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScannerOn(false);
  }, []);

  useEffect(() => () => stopScanner(), []);

  // ── Buscar SKU (scan manual o por codigo) ──────────────────────────
  const buscarSku = async (valor) => {
    if (!valor.trim()) return null;
    try {
      const prodRes = await api.get("productos/", { params: { sku: valor, page_size: 1 } });
      const prodList = prodRes.data.results ?? prodRes.data;
      if (prodList.length > 0) return { tipo: "producto", data: prodList[0] };

      const cajaRes = await api.get("cajas/", { params: { sku: valor, page_size: 1 } });
      const cajaList = cajaRes.data.results ?? cajaRes.data;
      if (cajaList.length > 0) {
        const { data: caja } = await api.get(`cajas/${cajaList[0].id}/`);
        return { tipo: "caja", data: caja };
      }

      // Fallback: buscar por nombre
      const searchRes = await api.get("productos/", { params: { search: valor, page_size: 1 } });
      const searchList = searchRes.data.results ?? searchRes.data;
      if (searchList.length > 0) return { tipo: "producto", data: searchList[0] };

      return null;
    } catch {
      return null;
    }
  };

  const agregarSku = async (valor) => {
    setError("");
    setSku(valor);
    const encontrado = await buscarSku(valor);

    if (!encontrado) {
      setError(`SKU "${valor}" no encontrado`);
      playBeep(200, 300);
      return;
    }

    if (encontrado.tipo === "producto") {
      const p = encontrado.data;
      setScanList((prev) => [...prev, {
        id: Date.now() + Math.random(),
        sku: p.sku,
        nombre: p.nombre,
        categoria: p.categoria_nombre || "",
        unidad: p.unidad_medida,
        precio: Number(p.precio_venta) || 0,
        cantidad: 1,
        lote: `L${new Date().toISOString().slice(2,10).replace(/-/g,"")}${String(Date.now()).slice(-4)}`,
        editando: false,
      }]);
      playBeep(1100, 80);
    } else {
      // Es caja: agregar todos sus productos
      const caja = encontrado.data;
      for (const cp of (caja.contenido || [])) {
        setScanList((prev) => [...prev, {
          id: Date.now() + Math.random() + Math.random(),
          sku: cp.producto_sku,
          nombre: cp.producto_nombre,
          categoria: "",
          unidad: "",
          precio: 0,
          cantidad: Number(cp.cantidad) || 1,
          lote: `L${new Date().toISOString().slice(2,10).replace(/-/g,"")}${String(Date.now()).slice(-4)}`,
          editando: false,
          viaCaja: caja.nombre,
        }]);
      }
      playBeep(1100, 80);
    }

    setSku("");
    setResultadoSku(null);
    setTipoSku(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && sku.trim()) {
      agregarSku(sku);
    }
  };

  const eliminarItem = (id) => setScanList((prev) => prev.filter((i) => i.id !== id));
  const toggleEdit = (id) => setScanList((prev) => prev.map((i) => i.id === id ? { ...i, editando: !i.editando } : i));
  const updateCantidad = (id, val) => setScanList((prev) => prev.map((i) => i.id === id ? { ...i, cantidad: Math.max(0.5, Number(val) || 0.5) } : i));

  // ── Confirmar todo ─────────────────────────────────────────────────
  const confirmarTodo = async () => {
    if (!sucId || scanList.length === 0 || !responsable.trim()) {
      setError("Completa los campos requeridos");
      return;
    }
    setCargando(true);
    setError("");

    try {
      const { data } = await api.post("movimiento-batch/", {
        sucursal_id: Number(sucId),
        tipo,
        metodo: "manual",
        responsable: responsable.trim(),
        observaciones,
        items: scanList.map((i) => ({ sku: i.sku, cantidad: i.cantidad, lote: i.lote })),
      });
      setResultadoMov(data);
    } catch (e) {
      setError(e.response?.data?.error || "Error al confirmar movimiento");
    }
    setCargando(false);
  };

  const resetTodo = () => {
    setScanList([]);
    setResultadoMov(null);
    setError("");
    setObservaciones("");
  };

  // ── UI ───────────────────────────────────────────────────────────────
  const totalItems = scanList.length;
  const totalUnidades = scanList.reduce((s, i) => s + Number(i.cantidad), 0);

  return (
    <div>
      <h1 className="page-title">
        {resultadoMov ? "Movimiento Confirmado" : "Recepcion de Productos"}
      </h1>
      <p className="page-subtitle">
        {resultadoMov ? "" : "Escaneo continuo: agrega productos y confirma todo junto"}
      </p>

      {resultadoMov ? (
        <div>
          <div className="movimiento-summary">
            <h4>Movimiento #{resultadoMov.movimiento?.id || resultadoMov.id}</h4>
            <p>{resultadoMov.creados?.length || 0} productos ingresados</p>
            {resultadoMov.errores?.length > 0 && (
              <div style={{ color: "var(--danger)", marginTop: 8 }}>
                Errores: {resultadoMov.errores.join(", ")}
              </div>
            )}
            <ul>
              {(resultadoMov.creados || []).map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
          <button className="btn btn-primary btn-lg" onClick={resetTodo}>
            Nueva Recepcion
          </button>
        </div>
      ) : (
        <>
          {/* ── Config ────────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ minWidth: 200 }}>
                <select className="form-select" value={sucId || ""} onChange={(e) => setSucId(Number(e.target.value))}>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>

              <div className="toggle-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
                <button className={`toggle-btn ${tipo === "entrada" ? "active-entrada" : ""}`} onClick={() => setTipo("entrada")}>Entrada</button>
                <button className={`toggle-btn ${tipo === "salida" ? "active-salida" : ""}`} onClick={() => setTipo("salida")}>Salida</button>
              </div>

              <input className="form-input" style={{ maxWidth: 200 }} type="text" placeholder="Responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
            </div>
          </div>

          {/* ── Scanner + entrada ──────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 16 }}>
            {scannerOn && (
              <div style={{ marginBottom: 16, textAlign: "center" }}>
                <div id={SCANNER_ID} style={{ width: "100%", maxWidth: 350, margin: "0 auto" }} />
                <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={stopScanner}>Detener camara</button>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="form-input form-input-lg"
                style={{ flex: 1, fontFamily: "monospace" }}
                type="text"
                placeholder={scannerOn ? "Escanea o escribe SKU..." : "Escribe SKU y Enter, o abre camara"}
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {!scannerOn && (
                <button className="btn btn-primary" onClick={() => startScanner()}>
                  Camara
                </button>
              )}
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: 10, background: "var(--danger-light)", borderRadius: 8, color: "var(--danger)", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
              SKU escaneados aparecen abajo. Ajusta cantidades y confirma todo junto.
            </div>
          </div>

          {/* ── Lista de productos escaneados ──────────────────────── */}
          {scanList.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              Aun no hay productos escaneados. Escanea o escribe SKU arriba.
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3>Productos escaneados ({totalItems} items, {totalUnidades} unidades)</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-outline" onClick={() => setScanList([])}>Limpiar</button>
                  <button
                    className={`btn btn-lg ${tipo === "entrada" ? "btn-success" : "btn-danger"}`}
                    onClick={confirmarTodo}
                    disabled={cargando}
                  >
                    {cargando ? "Confirmando..." : `Confirmar ${tipo === "entrada" ? "Entrada" : "Salida"} (${totalItems})`}
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>SKU</th><th>Producto</th><th>Cantidad</th><th>Lote</th><th></th></tr>
                  </thead>
                  <tbody>
                    {scanList.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{item.sku}</td>
                        <td>
                          {item.nombre}
                          {item.viaCaja && <span className="badge badge-default" style={{ marginLeft: 4 }}>{item.viaCaja}</span>}
                        </td>
                        <td>
                          {item.editando ? (
                            <input className="form-input" style={{ width: 80, textAlign: "center" }} type="number" step="0.5" min="0.5" value={item.cantidad}
                              onChange={(e) => updateCantidad(item.id, e.target.value)}
                              onBlur={() => toggleEdit(item.id)}
                              autoFocus />
                          ) : (
                            <span style={{ fontWeight: 600, cursor: "pointer" }} onClick={() => toggleEdit(item.id)}>
                              {item.cantidad} {item.unidad || ""}
                            </span>
                          )}
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{item.lote}</td>
                        <td>
                          <button className="btn btn-outline" style={{ padding: "2px 10px", fontSize: "0.75rem", color: "var(--danger)" }}
                            onClick={() => eliminarItem(item.id)}>x</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Observaciones</label>
                <textarea className="form-input" rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
