import { useEffect, useState, useRef, useCallback } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "./api";

const navByRole = {
  gerencia: [
    { to: "/gerencia", label: "Dashboard", icon: "D" },
    { to: "/inventario", label: "Inventario", icon: "I" },
    { to: "/productos", label: "Productos", icon: "P" },
    { to: "/cajas", label: "Cajas", icon: "C" },
    { to: "/movimientos", label: "Movimientos", icon: "M" },
    { to: "/notificaciones", label: "Notificaciones", icon: "N" },
    { to: "/pedidos", label: "Pedidos", icon: "O" },
    { to: "/sugerencias", label: "Sugerencias", icon: "R" },
    { to: "/conteos", label: "Conteos", icon: "K" },
    { to: "/solicitud", label: "Solicitud", icon: "Q" },
    { to: "/mermas", label: "Mermas", icon: "W" },
    { to: "/alertas", label: "Alertas", icon: "A" },
    { to: "/proveedores", label: "Proveedores", icon: "S" },
    { to: "/proceso-bodega", label: "Proceso Bodega", icon: "B" },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: "D" },
    { to: "/inventario", label: "Inventario", icon: "I" },
    { to: "/productos", label: "Productos", icon: "P" },
    { to: "/cajas", label: "Cajas", icon: "C" },
    { to: "/movimientos", label: "Movimientos", icon: "M" },
    { to: "/notificaciones", label: "Notificaciones", icon: "N" },
    { to: "/pedidos", label: "Pedidos", icon: "O" },
    { to: "/sugerencias", label: "Sugerencias", icon: "R" },
    { to: "/conteos", label: "Conteos", icon: "K" },
    { to: "/solicitud", label: "Solicitud", icon: "Q" },
    { to: "/mermas", label: "Mermas", icon: "W" },
    { to: "/alertas", label: "Alertas", icon: "A" },
    { to: "/proveedores", label: "Proveedores", icon: "S" },
    { to: "/proceso-bodega", label: "Proceso Bodega", icon: "B" },
  ],
  bodeguero: [
    { to: "/bodeguero", label: "Dashboard", icon: "D" },
    { to: "/movimiento", label: "Ingreso/Salida", icon: "E" },
    { to: "/inventario", label: "Inventario", icon: "I" },
    { to: "/movimientos", label: "Movimientos", icon: "M" },
    { to: "/notificaciones", label: "Notificaciones", icon: "N" },
    { to: "/alertas", label: "Alertas", icon: "A" },
  ],
};

const roleLabels = { gerencia: "Gerencia", admin: "Admin Local", bodeguero: "Bodeguero" };

function Toast({ notif, onClose, onClick }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, []);

  const colors = {
    rechazo: { bg: "var(--danger-light)", border: "var(--danger)" },
    alerta: { bg: "var(--warning-light)", border: "var(--warning)" },
    pedido: { bg: "var(--info-light)", border: "var(--info)" },
    sistema: { bg: "#f3f4f6", border: "#6b7280" },
  };
  const c = colors[notif.tipo] || colors.sistema;

  return (
    <div className="toast" style={{ borderLeft: `4px solid ${c.border}`, background: c.bg }} onClick={() => { onClose(); onClick?.(); }}>
      <div className="toast-title">{notif.titulo}</div>
      <div className="toast-msg">{notif.mensaje?.slice(0, 100)}</div>
    </div>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sucursales, setSucursales] = useState([]);
  const [nonCount, setNonCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const sseRef = useRef(null);

  const role = localStorage.getItem("resto_role");
  const usuario = localStorage.getItem("resto_usuario") || "";
  const sucursalNombre = localStorage.getItem("resto_sucursal_nombre");

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const loadCount = useCallback(() => {
    api.get("notificaciones/", { params: { leida: "False", page_size: 1 } })
      .then(({ data }) => setNonCount(data.count ?? (data.results ?? data).length));
  }, []);

  useEffect(() => {
    if (!role) { navigate("/login", { replace: true }); return; }
    api.get("sucursales/").then(({ data }) => setSucursales(data.results ?? data));
    loadCount();

    const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "") || "";
    const sse = new EventSource(`${baseUrl}/api/notificaciones/stream/`);
    sseRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const n = JSON.parse(event.data);
        if (n.id) {
          setNonCount((c) => c + 1);
          setToast(n);
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.frequency.value = 800;
            osc.connect(ctx.destination);
            osc.start();
            setTimeout(() => osc.stop(), 100);
          } catch {}
        }
      } catch {}
    };
    sse.onerror = () => { setTimeout(() => sse.close(), 5000); };
    return () => { sse.close(); };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array("BIsT8ZIgD8hSk1fG1PbKDYMTstY1d5M0qGJqKaF9d7S5kLjbIGXOv7pN3jFvY-NGn9XJpSgCkZQKDR3X0h6Vq7U"),
        }).then((sub) => api.post("push/subscribe/", sub.toJSON()).catch(() => {}))
        .catch(() => {});
      }).catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    ["resto_role", "resto_usuario", "resto_sucursal_id", "resto_sucursal_nombre"].forEach((k) => localStorage.removeItem(k));
    navigate("/login");
  };

  if (!role) return null;

  const navItems = navByRole[role] || navByRole.gerencia;
  const current = navItems.find((n) => {
    if (n.to === "/gerencia" && role === "gerencia") return location.pathname === "/gerencia";
    if (n.to === "/admin" && role === "admin") return location.pathname === "/admin";
    if (n.to === "/bodeguero" && role === "bodeguero") return location.pathname === "/bodeguero";
    return location.pathname.startsWith(n.to) && !["/gerencia", "/admin", "/bodeguero"].includes(n.to);
  });

  return (
    <div className="app-layout">
      {toast && <Toast notif={toast} onClose={() => setToast(null)} onClick={() => navigate("/notificaciones")} />}

      {/* Overlay for mobile sidebar */}
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <h1>RestoLogistics</h1>
          <div className="role-badge">{roleLabels[role] || role}</div>
          {sucursalNombre && <div className="sidebar-sucursal">{sucursalNombre}</div>}
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === `/${role}`}
              className={({ isActive }) => (isActive ? "active" : "")} onClick={closeMenu}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.to === "/notificaciones" && nonCount > 0 && (
                <span className="nav-badge">{nonCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">{usuario}</div>
          <button onClick={handleLogout}>Salir</button>
        </div>
      </aside>

      <div className="main-area">
        <header className="main-header">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
          <h2>{current?.label || "RestoLogistics"}</h2>
          <div className="header-right">
            <span className="header-role">{roleLabels[role] || role}{sucursalNombre ? ` · ${sucursalNombre}` : ""}</span>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
