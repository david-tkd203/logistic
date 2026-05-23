import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./Layout";
import DashboardGerencia from "./pages/DashboardGerencia";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardBodeguero from "./pages/DashboardBodeguero";
import Movimiento from "./pages/Movimiento";
import Inventario from "./pages/Inventario";
import Productos from "./pages/Productos";
import Proveedores from "./pages/Proveedores";
import Cajas from "./pages/Cajas";
import Pedidos from "./pages/Pedidos";
import Alertas from "./pages/Alertas";
import Movimientos from "./pages/Movimientos";
import ProcesoBodega from "./pages/ProcesoBodega";
import Notificaciones from "./pages/Notificaciones";
import Sugerencias from "./pages/Sugerencias";
import Conteos from "./pages/Conteos";
import Solicitud from "./pages/Solicitud";
import Mermas from "./pages/Mermas";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="/gerencia" element={<DashboardGerencia />} />
          <Route path="/admin" element={<DashboardAdmin />} />
          <Route path="/bodeguero" element={<DashboardBodeguero />} />
          <Route path="/movimiento" element={<Movimiento />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/cajas" element={<Cajas />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/sugerencias" element={<Sugerencias />} />
          <Route path="/conteos" element={<Conteos />} />
          <Route path="/solicitud" element={<Solicitud />} />
          <Route path="/mermas" element={<Mermas />} />
          <Route path="/proceso-bodega" element={<ProcesoBodega />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
