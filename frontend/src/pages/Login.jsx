import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [rol, setRol] = useState("gerencia");
  const [sucursalId, setSucursalId] = useState("");
  const [usuario, setUsuario] = useState("");

  useEffect(() => {
    api.get("sucursales/").then(({ data }) => {
      const list = data.results ?? data;
      setSucursales(list);
      if (list.length > 0) setSucursalId(list[0].id);
    });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usuario.trim()) return;
    const suc = sucursales.find((s) => s.id === Number(sucursalId));
    localStorage.setItem("resto_role", rol);
    localStorage.setItem("resto_usuario", usuario.trim());
    if (suc) {
      localStorage.setItem("resto_sucursal_id", suc.id);
      localStorage.setItem("resto_sucursal_nombre", suc.nombre);
    }
    const redirects = { gerencia: "/gerencia", admin: "/admin", bodeguero: "/bodeguero" };
    navigate(redirects[rol] || "/gerencia");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-dot"></span>
        </div>
        <h1>RestoLogistics</h1>
        <p className="login-sub">Gestion de Bodega Multi-Sucursal</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Rol</label>
            <select className="form-select" value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="gerencia">Gerencia</option>
              <option value="admin">Admin Local</option>
              <option value="bodeguero">Bodeguero</option>
            </select>
          </div>

          {rol !== "gerencia" && (
            <div className="form-group">
              <label>Sucursal</label>
              <select className="form-select" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Nombre de usuario</label>
            <input
              className="form-input"
              type="text"
              placeholder="Tu nombre"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 8 }}>
            Ingresar
          </button>
        </form>

        <div style={{ marginTop: 24, padding: "12px 16px", background: "#f3f4f6", borderRadius: 8, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          Usuarios demo: gerencia / admin_centro / bodeguero_centro
        </div>
      </div>
    </div>
  );
}
