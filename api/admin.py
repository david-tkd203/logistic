from django.contrib import admin
from .models import (
    Sucursal, Categoria, Producto, Proveedor, ProductoProveedor,
    Caja, CajaProducto, Inventario, Movimiento, MovimientoProducto,
    Carrito, CarritoItem, Pedido, Merma, AlertaStock, Notificacion,
    SugerenciaPedido, Conteo, ConteoProducto,
)


@admin.register(Sucursal)
class SucursalAdmin(admin.ModelAdmin):
    list_display = ["nombre", "direccion", "activa"]
    list_filter = ["activa"]


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "descripcion"]


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ["sku", "nombre", "categoria", "unidad_medida", "precio_venta", "activo"]
    list_filter = ["categoria", "activo"]
    search_fields = ["nombre", "sku"]


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ["nombre", "rut", "contacto"]
    search_fields = ["nombre", "rut"]


@admin.register(ProductoProveedor)
class ProductoProveedorAdmin(admin.ModelAdmin):
    list_display = ["producto", "proveedor", "sucursal", "precio_compra"]
    list_filter = ["sucursal", "proveedor"]


@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    list_display = ["sku", "nombre", "activo"]
    search_fields = ["nombre", "sku"]


@admin.register(CajaProducto)
class CajaProductoAdmin(admin.ModelAdmin):
    list_display = ["caja", "producto", "cantidad"]


@admin.register(Inventario)
class InventarioAdmin(admin.ModelAdmin):
    list_display = [
        "sucursal", "producto", "lote", "stock_actual",
        "stock_minimo", "ubicacion", "fecha_caducidad",
    ]
    list_filter = ["sucursal", "ubicacion"]


@admin.register(Movimiento)
class MovimientoAdmin(admin.ModelAdmin):
    list_display = [
        "id", "sucursal", "tipo", "metodo", "sku_ingresado",
        "tipo_sku", "responsable", "creado_en",
    ]
    list_filter = ["tipo", "metodo", "tipo_sku", "sucursal"]


@admin.register(MovimientoProducto)
class MovimientoProductoAdmin(admin.ModelAdmin):
    list_display = ["movimiento", "producto", "cantidad", "caja_origen"]


@admin.register(Carrito)
class CarritoAdmin(admin.ModelAdmin):
    list_display = ["id", "sucursal", "creado_en"]


@admin.register(CarritoItem)
class CarritoItemAdmin(admin.ModelAdmin):
    list_display = ["carrito", "producto", "cantidad", "precio_unitario"]


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ["id", "sucursal", "estado", "creado_por", "creado_en"]
    list_filter = ["estado", "sucursal"]


@admin.register(Merma)
class MermaAdmin(admin.ModelAdmin):
    list_display = ["sucursal", "producto", "cantidad", "razon", "responsable", "fecha"]
    list_filter = ["razon", "sucursal"]


@admin.register(AlertaStock)
class AlertaStockAdmin(admin.ModelAdmin):
    list_display = ["tipo", "sucursal", "producto", "stock_actual", "stock_minimo", "leida"]
    list_filter = ["tipo", "leida", "sucursal"]


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ["tipo", "titulo", "sucursal", "leida", "creada_en"]
    list_filter = ["tipo", "leida", "sucursal"]


@admin.register(SugerenciaPedido)
class SugerenciaPedidoAdmin(admin.ModelAdmin):
    list_display = ["producto", "sucursal", "cantidad_sugerida", "stock_actual", "estado", "creada_en"]
    list_filter = ["estado", "sucursal"]


@admin.register(Conteo)
class ConteoAdmin(admin.ModelAdmin):
    list_display = ["id", "sucursal", "responsable", "estado", "creado_en"]
    list_filter = ["estado", "sucursal"]


@admin.register(ConteoProducto)
class ConteoProductoAdmin(admin.ModelAdmin):
    list_display = ["conteo", "producto", "cantidad_sistema", "cantidad_fisica", "diferencia", "ajustado"]
    list_filter = ["ajustado"]
