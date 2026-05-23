from rest_framework import serializers
from .models import (
    Sucursal, Categoria, Producto, Proveedor, ProductoProveedor,
    Caja, CajaProducto, Inventario, Movimiento, MovimientoProducto,
    Carrito, CarritoItem, Pedido, Merma, AlertaStock, Notificacion,
    SugerenciaPedido, Conteo, ConteoProducto,
)


class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursal
        fields = "__all__"


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = "__all__"


class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)

    class Meta:
        model = Producto
        fields = "__all__"


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = "__all__"


class ProductoProveedorSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    proveedor_nombre = serializers.CharField(source="proveedor.nombre", read_only=True)
    sucursal_nombre = serializers.CharField(source="sucursal.nombre", read_only=True)

    class Meta:
        model = ProductoProveedor
        fields = "__all__"


# ── Cajas ─────────────────────────────────────────────────────────────────
class CajaProductoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    producto_sku = serializers.CharField(source="producto.sku", read_only=True)

    class Meta:
        model = CajaProducto
        fields = "__all__"


class CajaSerializer(serializers.ModelSerializer):
    contenido = CajaProductoSerializer(many=True, read_only=True)

    class Meta:
        model = Caja
        fields = "__all__"


# ── Inventario ────────────────────────────────────────────────────────────
class InventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    producto_sku = serializers.CharField(source="producto.sku", read_only=True)
    valor_total = serializers.SerializerMethodField()

    class Meta:
        model = Inventario
        fields = "__all__"

    def get_valor_total(self, obj):
        return float(obj.stock_actual) * float(obj.producto.precio_venta)


# ── Movimientos ───────────────────────────────────────────────────────────
class MovimientoProductoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    producto_sku = serializers.CharField(source="producto.sku", read_only=True)

    class Meta:
        model = MovimientoProducto
        fields = "__all__"


class MovimientoSerializer(serializers.ModelSerializer):
    productos = MovimientoProductoSerializer(many=True, read_only=True)
    sucursal_nombre = serializers.CharField(source="sucursal.nombre", read_only=True)

    class Meta:
        model = Movimiento
        fields = "__all__"


class MovimientoCreateSerializer(serializers.Serializer):
    """
    Serializer para crear movimientos escaneando un SKU.
    Acepta SKU de producto o de caja con datos de control de calidad.
    """
    sucursal_id = serializers.IntegerField()
    tipo = serializers.ChoiceField(choices=["entrada", "salida"])
    sku = serializers.CharField(max_length=50)
    metodo = serializers.ChoiceField(choices=["manual", "camara"], default="manual")
    responsable = serializers.CharField(max_length=200)
    lote = serializers.CharField(max_length=100, required=False, default="")
    observaciones = serializers.CharField(required=False, default="")

    # Orden de Compra
    orden_compra_numero = serializers.CharField(required=False, default="")

    # Control de calidad
    temperatura = serializers.DecimalField(
        max_digits=5, decimal_places=1, required=False, allow_null=True
    )
    inspeccion_visual = serializers.CharField(required=False, default="")
    rechazar = serializers.BooleanField(default=False)
    rechazo_motivo = serializers.CharField(required=False, default="")

    def validate_sku(self, value):
        if not Producto.objects.filter(sku=value).exists() and not Caja.objects.filter(sku=value).exists():
            raise serializers.ValidationError(f"SKU '{value}' no encontrado ni como producto ni como caja")
        return value

    def validate_temperatura(self, value):
        if value is not None and value < -30:
            raise serializers.ValidationError("Temperatura no puede ser menor a -30°C")
        if value is not None and value > 50:
            raise serializers.ValidationError("Temperatura no puede ser mayor a 50°C")
        return value


# ── Carrito ───────────────────────────────────────────────────────────────
class CarritoItemSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CarritoItem
        fields = "__all__"


class CarritoSerializer(serializers.ModelSerializer):
    items = CarritoItemSerializer(many=True, read_only=True)
    sucursal_nombre = serializers.CharField(source="sucursal.nombre", read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Carrito
        fields = "__all__"

    def get_total(self, obj):
        return sum(item.subtotal for item in obj.items.all())


class PedidoSerializer(serializers.ModelSerializer):
    sucursal_nombre = serializers.CharField(source="sucursal.nombre", read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = "__all__"

    def get_items_count(self, obj):
        return obj.carrito.items.count() if obj.carrito else 0


class MermaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    sucursal_nombre = serializers.CharField(source="sucursal.nombre", read_only=True)

    class Meta:
        model = Merma
        fields = "__all__"


class AlertaStockSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    sucursal_nombre = serializers.CharField(source="sucursal.nombre", read_only=True)

    class Meta:
        model = AlertaStock
        fields = "__all__"


# ── Dashboard ─────────────────────────────────────────────────────────────
class DashboardGerenciaSerializer(serializers.Serializer):
    total_sucursales = serializers.IntegerField()
    total_productos = serializers.IntegerField()
    total_stock = serializers.IntegerField()
    total_alertas = serializers.IntegerField()
    total_pedidos_pendientes = serializers.IntegerField()
    total_mermas_mes = serializers.IntegerField()
    valor_total_inventario = serializers.FloatField()
    ganancia_potencial = serializers.FloatField()
    stock_por_sucursal = serializers.ListField(child=serializers.DictField())
    top_productos = serializers.ListField(child=serializers.DictField())


class DashboardAdminSerializer(serializers.Serializer):
    sucursal_nombre = serializers.CharField()
    total_productos = serializers.IntegerField()
    total_stock = serializers.IntegerField()
    total_alertas = serializers.IntegerField()
    total_pedidos = serializers.IntegerField()
    total_movimientos_mes = serializers.IntegerField()
    valor_inventario = serializers.FloatField()
    stock_bajo = serializers.ListField(child=serializers.DictField())
    ultimos_movimientos = serializers.ListField(child=serializers.DictField())


class DashboardBodegueroSerializer(serializers.Serializer):
    sucursal_nombre = serializers.CharField()
    total_productos = serializers.IntegerField()
    total_stock = serializers.IntegerField()
    alertas_criticas = serializers.IntegerField()
    stock_por_ubicacion = serializers.ListField(child=serializers.DictField())
    movimientos_hoy = serializers.ListField(child=serializers.DictField())


class NotificacionSerializer(serializers.ModelSerializer):
    sucursal_nombre = serializers.CharField(source="sucursal.nombre", read_only=True)

    class Meta:
        model = Notificacion
        fields = "__all__"


class SugerenciaPedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    producto_sku = serializers.CharField(source="producto.sku", read_only=True)
    proveedor_nombre = serializers.CharField(source="proveedor.nombre", read_only=True)
    sucursal_nombre = serializers.CharField(source="sucursal.nombre", read_only=True)

    class Meta:
        model = SugerenciaPedido
        fields = "__all__"


# ── Conteos ──────────────────────────────────────────────────────────────
class ConteoProductoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    producto_sku = serializers.CharField(source="producto.sku", read_only=True)

    class Meta:
        model = ConteoProducto
        fields = "__all__"
        read_only_fields = ["diferencia"]


class ConteoSerializer(serializers.ModelSerializer):
    productos = ConteoProductoSerializer(many=True, read_only=True)
    sucursal_nombre = serializers.CharField(source="sucursal.nombre", read_only=True)
    total_productos = serializers.SerializerMethodField()
    total_diferencias = serializers.SerializerMethodField()

    class Meta:
        model = Conteo
        fields = "__all__"

    def get_total_productos(self, obj):
        return obj.productos.count()

    def get_total_diferencias(self, obj):
        return obj.productos.exclude(diferencia=0).count()
