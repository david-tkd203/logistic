import { useState, useEffect } from "react";
import { fetchAll } from "../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    (async () => {
      const [inventario, sucursales, productos, alertas, pedidos] = await Promise.all([
        fetchAll("inventario/", { page_size: 1 }),
        fetchAll("sucursales/"),
        fetchAll("productos/", { page_size: 1 }),
        fetchAll("alertas-stock/", { page_size: 1 }),
        fetchAll("pedidos/", { ordering: "-creado_en", page_size: 5 }),
      ]);

      setStats({
        totalSucursales: sucursales.length,
        totalProductos: productos.count ?? productos.length,
        totalStock: inventario.count ?? inventario.length,
        totalAlertas: alertas.count ?? alertas.length,
      });
      setRecentOrders(pedidos.results ?? pedidos);

      // Simple chart: count inventory per branch
      const allInv = await fetchAll("inventario/", { page_size: 200 });
      const branchMap = {};
      for (const item of allInv) {
        const name = item.sucursal_nombre ?? `ID ${item.sucursal}`;
        branchMap[name] = (branchMap[name] || 0) + Number(item.stock_actual);
      }
      setChartData(
        Object.entries(branchMap).slice(0, 10).map(([name, value]) => ({
          name: name.replace("Restó ", ""),
          stock: Math.round(value),
        }))
      );
    })();
  }, []);

  if (!stats) return <p style={{ color: "var(--text-secondary)" }}>Cargando dashboard...</p>;

  const statusBadge = (estado) => {
    const map = {
      pendiente: "badge-warning",
      aprobado: "badge-info",
      preparacion: "badge-info",
      enviado: "badge-info",
      recibido: "badge-success",
      cancelado: "badge-danger",
    };
    return <span className={`badge ${map[estado] ?? "badge-default"}`}>{estado}</span>;
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Sucursales</div>
          <div className="stat-value">{stats.totalSucursales}</div>
          <div className="stat-sub">Locales activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Productos (SKU)</div>
          <div className="stat-value">{stats.totalProductos}</div>
          <div className="stat-sub">Insumos registrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Registros de Stock</div>
          <div className="stat-value">{stats.totalStock}</div>
          <div className="stat-sub">En inventario</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Alertas Activas</div>
          <div className="stat-value" style={{ color: stats.totalAlertas > 0 ? "var(--danger)" : "var(--success)" }}>
            {stats.totalAlertas}
          </div>
          <div className="stat-sub">Stock crítico o bajo</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div className="card">
          <div className="card-header">
            <h3>Stock por Sucursal (top 10)</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="stock" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Últimos Pedidos</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>#{o.id}</td>
                    <td>{o.sucursal_nombre}</td>
                    <td>{statusBadge(o.estado)}</td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {new Date(o.creado_en).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                      Sin pedidos aún
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
