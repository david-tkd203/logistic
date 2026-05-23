from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"sucursales", views.SucursalViewSet)
router.register(r"categorias", views.CategoriaViewSet)
router.register(r"productos", views.ProductoViewSet)
router.register(r"proveedores", views.ProveedorViewSet)
router.register(r"productos-proveedor", views.ProductoProveedorViewSet)
router.register(r"cajas", views.CajaViewSet)
router.register(r"inventario", views.InventarioViewSet)
router.register(r"movimientos", views.MovimientoViewSet)
router.register(r"notificaciones", views.NotificacionViewSet)
router.register(r"sugerencias", views.SugerenciaPedidoViewSet)
router.register(r"conteos", views.ConteoViewSet)
router.register(r"conteo-productos", views.ConteoProductoViewSet)
router.register(r"carritos", views.CarritoViewSet)
router.register(r"carrito-items", views.CarritoItemViewSet)
router.register(r"pedidos", views.PedidoViewSet)
router.register(r"mermas", views.MermaViewSet)
router.register(r"alertas-stock", views.AlertaStockViewSet)

urlpatterns = [
    # Notificaciones SSE debe ir ANTES del router para evitar conflicto
    path("notificaciones/stream/", views.sse_stream, name="sse-stream"),
    path("push/subscribe/", views.push_subscribe, name="push-subscribe"),
    path("", include(router.urls)),
    # Movimiento por SKU (ingreso/salida manual o por cámara)
    path("movimiento-sku/", views.movimiento_por_sku, name="movimiento-sku"),
    path("movimiento-batch/", views.movimiento_batch, name="movimiento-batch"),
    # Dashboards
    path("dashboard/gerencia/", views.dashboard_gerencia, name="dashboard-gerencia"),
    path("dashboard/admin/<int:sucursal_id>/", views.dashboard_admin, name="dashboard-admin"),
    path("dashboard/bodeguero/<int:sucursal_id>/", views.dashboard_bodeguero, name="dashboard-bodeguero"),
    # Flujo de pedidos
    path("pedidos/<int:pedido_id>/aprobar/", views.aprobar_pedido, name="aprobar-pedido"),
    path("pedidos/<int:pedido_id>/rechazar/", views.rechazar_pedido, name="rechazar-pedido"),
    path("pedidos/<int:pedido_id>/avanzar/", views.avanzar_pedido, name="avanzar-pedido"),
    # Solicitud de productos (PDF / XLSX)
    path("solicitud/productos-con-proveedores/", views.productos_con_proveedores, name="productos-con-proveedores"),
    path("solicitud/descargar/", views.descargar_solicitud, name="descargar-solicitud"),
    # Reportes
    path("reportes/resumen-mermas/", views.resumen_mermas, name="resumen-mermas"),
    path("reportes/productos-vencer/", views.productos_vencer, name="productos-vencer"),
]
