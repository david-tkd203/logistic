import { useState, useEffect } from "react";
import api from "../api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);

export default function DashboardGerencia() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("dashboard/gerencia/").then(({ data: d }) => setData(d));
  }, []);

  if (!data) return <div className="loading">Cargando dashboard gerencia...</div>;

  return (
    <div>
      <h1 className="page-title">Dashboard Gerencia</h1>
      <p className="page-subtitle">Consolidado de {data.total_sucursales} sucursales</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">Sucursales</div>
          <div className="stat-value">{data.total_sucursales}</div>
          <div className="stat-label">Locales activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">Productos (SKU)</div>
          <div className="stat-value">{data.total_productos}</div>
          <div className="stat-label">Insumos registrados</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">Stock total</div>
          <div className="stat-value">{data.total_stock}</div>
          <div className="stat-label">Registros en inventario</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">Alertas</div>
          <div className="stat-value">{data.total_alertas}</div>
          <div className="stat-label">Sin leer</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">Pedidos pendientes</div>
          <div className="stat-value">{data.total_pedidos_pendientes}</div>
          <div className="stat-label">Por aprobar</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">Mermas del mes</div>
          <div className="stat-value">{data.total_mermas_mes}</div>
          <div className="stat-label">Registradas</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Valor Total Inventario</h3>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--success)" }}>
            {fmt(data.valor_total_inventario)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
            Costo total de stock actual a precio de venta
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3>Ganancia Potencial</h3>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)" }}>
            {fmt(data.ganancia_potencial)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
            Diferencia precio venta - precio compra
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Stock por Sucursal</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.stock_por_sucursal}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total_stock" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Top 10 Productos por Valor</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Producto</th><th style={{ textAlign: "right" }}>Valor Total</th></tr>
              </thead>
              <tbody>
                {data.top_productos.map((p, i) => (
                  <tr key={i}>
                    <td>{p.nombre}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(p.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
