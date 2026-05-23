"""
Modelos de datos — sistema de gestión de bodega/logística multi-sucursal.
Versión extendida con Cajas (SKU de caja), Movimientos (entrada/salida),
precio de venta, y roles por sucursal.
"""

from django.db import models


# ---------------------------------------------------------------------------
# Catálogos base
# ---------------------------------------------------------------------------
class Sucursal(models.Model):
    """Cada uno de los 20 locales."""

    nombre = models.CharField(max_length=200)
    direccion = models.CharField(max_length=300, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Sucursales"

    def __str__(self):
        return self.nombre


class Categoria(models.Model):
    """Categoría de producto (ej: carnes, lácteos, verduras, secos…)."""

    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categorías"

    def __str__(self):
        return self.nombre


# ---------------------------------------------------------------------------
# Productos
# ---------------------------------------------------------------------------
class Producto(models.Model):
    """SKU de insumo individual."""

    UNIDADES = [
        ("kg", "Kilogramo"),
        ("lt", "Litro"),
        ("un", "Unidad"),
        ("cj", "Caja"),
        ("bz", "Bolsa"),
        ("pqt", "Paquete"),
    ]

    CONSERVACION = [
        ("refrigerado", "Refrigerado (0°C a 5°C)"),
        ("congelado", "Congelado (<= -18°C)"),
        ("seco", "Seco / Ambiente"),
    ]

    nombre = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    categoria = models.ForeignKey(
        Categoria, on_delete=models.SET_NULL, null=True, related_name="productos"
    )
    unidad_medida = models.CharField(max_length=10, choices=UNIDADES, default="un")
    descripcion = models.TextField(blank=True)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tipo_conservacion = models.CharField(
        max_length=20, choices=CONSERVACION, default="seco",
        help_text="Define los rangos de temperatura aceptados en recepcion",
    )
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.sku} — {self.nombre}"


class Proveedor(models.Model):
    """Proveedor que abastece uno o varios locales."""

    nombre = models.CharField(max_length=200)
    rut = models.CharField(max_length=20, blank=True, verbose_name="RUT")
    contacto = models.CharField(max_length=200, blank=True)
    telefono = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self):
        return self.nombre


class ProductoProveedor(models.Model):
    """Precio de compra de un producto para un proveedor en una sucursal."""

    producto = models.ForeignKey(
        Producto, on_delete=models.CASCADE, related_name="precios_proveedor"
    )
    proveedor = models.ForeignKey(
        Proveedor, on_delete=models.CASCADE, related_name="productos"
    )
    sucursal = models.ForeignKey(
        Sucursal, on_delete=models.CASCADE, related_name="precios_proveedor"
    )
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)

    class Meta:
        unique_together = ("producto", "proveedor", "sucursal")
        verbose_name_plural = "Productos por Proveedor"

    def __str__(self):
        return f"{self.producto.nombre} @ {self.proveedor.nombre} — ${self.precio_compra}"


# ---------------------------------------------------------------------------
# Cajas (SKU de caja que contiene múltiples productos)
# ---------------------------------------------------------------------------
class Caja(models.Model):
    """
    Caja / Pack — tiene su propio SKU.
    Al escanear/cargar una caja, se expande a los productos que contiene.
    Ej: Caja "Pollo Congelado 10kg" → 10kg de pollo como producto individual.
    """

    nombre = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Cajas"

    def __str__(self):
        return f"{self.sku} — {self.nombre}"


class CajaProducto(models.Model):
    """Producto individual dentro de una caja, con su cantidad."""

    caja = models.ForeignKey(Caja, on_delete=models.CASCADE, related_name="contenido")
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name_plural = "Productos de Caja"

    def __str__(self):
        return f"{self.caja.nombre} → {self.cantidad} x {self.producto.nombre}"


# ---------------------------------------------------------------------------
# Inventario (stock por sucursal)
# ---------------------------------------------------------------------------
class Inventario(models.Model):
    """Stock de cada producto en cada sucursal."""

    sucursal = models.ForeignKey(
        Sucursal, on_delete=models.CASCADE, related_name="inventario"
    )
    producto = models.ForeignKey(
        Producto, on_delete=models.CASCADE, related_name="inventario"
    )
    lote = models.CharField(max_length=100, blank=True)
    stock_actual = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_recepcion = models.DateField(null=True, blank=True)
    fecha_caducidad = models.DateField(null=True, blank=True)
    ubicacion = models.CharField(
        max_length=50,
        choices=[
            ("superior", "Nivel Superior — listos para consumo"),
            ("medio", "Nivel Medio — frutas/verduras"),
            ("inferior", "Nivel Inferior — carnes crudas"),
            ("secos", "Zona de Secos"),
        ],
        default="secos",
    )

    class Meta:
        verbose_name_plural = "Inventario"
        unique_together = ("sucursal", "producto", "lote")

    def __str__(self):
        return f"{self.sucursal} — {self.producto.nombre} (lote {self.lote})"


# ---------------------------------------------------------------------------
# Movimientos (entrada / salida de productos)
# ---------------------------------------------------------------------------
class Movimiento(models.Model):
    """
    Registro de entrada o salida de productos.
    Puede originarse por escaneo de SKU de producto o de caja.
    """

    TIPOS = [("entrada", "Entrada"), ("salida", "Salida")]
    METODOS = [("manual", "Manual"), ("camara", "Camara / QR")]

    sucursal = models.ForeignKey(
        Sucursal, on_delete=models.CASCADE, related_name="movimientos"
    )
    tipo = models.CharField(max_length=10, choices=TIPOS)
    metodo = models.CharField(max_length=10, choices=METODOS, default="manual")
    sku_ingresado = models.CharField(max_length=50)
    TIPO_SKU = [("producto", "Producto"), ("caja", "Caja")]
    tipo_sku = models.CharField(max_length=10, choices=TIPO_SKU)
    responsable = models.CharField(max_length=200)
    creado_en = models.DateTimeField(auto_now_add=True)
    observaciones = models.TextField(blank=True)

    # ── Orden de Compra ─────────────────────────────────────────────────
    orden_compra_numero = models.CharField(
        max_length=50, blank=True,
        help_text="Numero de Orden de Compra asociada (verificacion documental)",
    )

    # ── Control de calidad ──────────────────────────────────────────────
    temperatura = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True,
        help_text="Temperatura del producto al recibir (Celsius)",
    )
    temp_ok = models.BooleanField(
        null=True, blank=True,
        help_text="True si temp entre 0-5°C (refrig) o <= -18°C (congelado)",
    )
    inspeccion_visual = models.TextField(
        blank=True,
        help_text="Resultado de inspeccion organoleptica (color, olor, textura, envases)",
    )
    control_calidad_ok = models.BooleanField(
        null=True, blank=True,
        help_text="False si el producto fue rechazado por control de calidad",
    )
    rechazo_motivo = models.CharField(
        max_length=100, blank=True,
        help_text="Motivo de rechazo si aplica",
    )

    def __str__(self):
        return f"{self.tipo.upper()} #{self.id} — SKU {self.sku_ingresado} ({self.sucursal})"


class MovimientoProducto(models.Model):
    """
    Detalle de productos afectados por un movimiento.
    Si se escaneó una caja, se expande a N productos.
    """

    movimiento = models.ForeignKey(
        Movimiento, on_delete=models.CASCADE, related_name="productos"
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    caja_origen = models.ForeignKey(
        Caja, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self):
        origen = f" (vía caja {self.caja_origen.sku})" if self.caja_origen else ""
        return f"{self.movimiento.tipo} {self.cantidad} x {self.producto.nombre}{origen}"


# ---------------------------------------------------------------------------
# Carrito de compra interna
# ---------------------------------------------------------------------------
class Carrito(models.Model):
    """Carrito de compra por sucursal."""

    sucursal = models.ForeignKey(
        Sucursal, on_delete=models.CASCADE, related_name="carritos"
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Carrito {self.sucursal} #{self.id}"


class CarritoItem(models.Model):
    """Ítem dentro de un carrito."""

    carrito = models.ForeignKey(
        Carrito, on_delete=models.CASCADE, related_name="items"
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.SET_NULL, null=True)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre}"


# ---------------------------------------------------------------------------
# Pedidos y flujo logístico
# ---------------------------------------------------------------------------
class Pedido(models.Model):
    """Pedido interno: carrito → aprobación → preparación → envío → recepción."""

    ESTADOS = [
        ("pendiente", "Pendiente de aprobación"),
        ("aprobado", "Aprobado por logística"),
        ("preparacion", "En preparación"),
        ("enviado", "Enviado al local"),
        ("recibido", "Recibido en el local"),
        ("cancelado", "Cancelado"),
    ]

    sucursal = models.ForeignKey(
        Sucursal, on_delete=models.CASCADE, related_name="pedidos"
    )
    carrito = models.OneToOneField(
        Carrito, on_delete=models.SET_NULL, null=True, blank=True
    )
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    creado_por = models.CharField(max_length=200, blank=True)
    aprobado_por = models.CharField(max_length=200, blank=True)
    rechazado_motivo = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    observaciones = models.TextField(blank=True)

    @property
    def total(self):
        if not self.carrito:
            return 0
        return sum(item.subtotal for item in self.carrito.items.all())

    def __str__(self):
        return f"Pedido #{self.id} — {self.sucursal} ({self.estado})"


class Merma(models.Model):
    """Bitácora de mermas."""

    RAZONES = [
        ("caducidad", "Caducidad"),
        ("mal_estado", "Mal estado"),
        ("error_cocina", "Error de cocina"),
        ("rotura", "Rotura/derrame"),
        ("otro", "Otro"),
    ]

    sucursal = models.ForeignKey(
        Sucursal, on_delete=models.CASCADE, related_name="mermas"
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    razon = models.CharField(max_length=20, choices=RAZONES)
    responsable = models.CharField(max_length=200)
    fecha = models.DateField(auto_now_add=True)
    observaciones = models.TextField(blank=True)
    perdida = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, editable=False,
        help_text="Perdida calculada = cantidad * precio_venta del producto",
    )

    class Meta:
        verbose_name_plural = "Mermas"

    def save(self, *args, **kwargs):
        self.perdida = self.cantidad * (self.producto.precio_venta if self.producto else Decimal("0"))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Merma {self.producto.nombre} x {self.cantidad} ({self.razon})"


# ---------------------------------------------------------------------------
# Alertas de stock
# ---------------------------------------------------------------------------
class AlertaStock(models.Model):
    """Alerta generada cuando un producto baja de su stock mínimo."""

    TIPOS = [
        ("critico", "Crítico — stock agotado"),
        ("bajo", "Bajo — por debajo del mínimo"),
    ]

    sucursal = models.ForeignKey(
        Sucursal, on_delete=models.CASCADE, related_name="alertas"
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=TIPOS)
    stock_actual = models.DecimalField(max_digits=10, decimal_places=2)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2)
    creada_en = models.DateTimeField(auto_now_add=True)
    leida = models.BooleanField(default=False)

    def __str__(self):
        return f"[{self.tipo.upper()}] {self.sucursal} — {self.producto.nombre}"


# ---------------------------------------------------------------------------
# Conteos ciclicos de inventario
# ---------------------------------------------------------------------------
class Conteo(models.Model):
    """
    Sesion de conteo fisico de inventario.
    El bodeguero ingresa lo que ve fisicamente y el sistema
    calcula las diferencias contra el sistema.
    """

    ESTADOS = [
        ("en_progreso", "En progreso"),
        ("completado", "Completado"),
    ]

    sucursal = models.ForeignKey(
        Sucursal, on_delete=models.CASCADE, related_name="conteos"
    )
    responsable = models.CharField(max_length=200)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="en_progreso")
    creado_en = models.DateTimeField(auto_now_add=True)
    completado_en = models.DateTimeField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Conteos"
        ordering = ["-creado_en"]

    def __str__(self):
        return f"Conteo #{self.id} — {self.sucursal} ({self.estado})"


class ConteoProducto(models.Model):
    """Producto contado fisicamente dentro de una sesion de conteo."""

    conteo = models.ForeignKey(
        Conteo, on_delete=models.CASCADE, related_name="productos"
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad_sistema = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad_fisica = models.DecimalField(max_digits=10, decimal_places=2)
    diferencia = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    ajustado = models.BooleanField(default=False)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Productos de Conteo"
        unique_together = ("conteo", "producto")

    def save(self, *args, **kwargs):
        self.diferencia = self.cantidad_fisica - self.cantidad_sistema
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.producto.nombre}: sist={self.cantidad_sistema} / fis={self.cantidad_fisica} (dif={self.diferencia})"


# ---------------------------------------------------------------------------
# Notificaciones internas
# ---------------------------------------------------------------------------
class Notificacion(models.Model):
    """
    Notificacion interna del sistema.
    Se genera automaticamente ante eventos como rechazos, alertas, pedidos.
    """

    TIPOS = [
        ("rechazo", "Rechazo en recepcion"),
        ("alerta", "Alerta de stock"),
        ("pedido", "Nuevo pedido"),
        ("sistema", "Mensaje del sistema"),
    ]

    sucursal = models.ForeignKey(
        Sucursal, on_delete=models.CASCADE, related_name="notificaciones"
    )
    tipo = models.CharField(max_length=20, choices=TIPOS)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    referencia_id = models.IntegerField(null=True, blank=True, help_text="ID del movimiento/pedido relacionado")
    leida = models.BooleanField(default=False)
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Notificaciones"
        ordering = ["-creada_en"]

    def __str__(self):
        return f"[{self.tipo}] {self.titulo}"


# ---------------------------------------------------------------------------
# Sugerencias de abastecimiento
# ---------------------------------------------------------------------------
class SugerenciaPedido(models.Model):
    """
    Sugerencia automatica de compra generada cuando un producto
    llega a su stock minimo. Facilita el reabastecimiento.
    """

    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("aprobada", "Aprobada"),
        ("ignorada", "Ignorada"),
    ]

    sucursal = models.ForeignKey(
        Sucursal, on_delete=models.CASCADE, related_name="sugerencias"
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    proveedor = models.ForeignKey(
        Proveedor, on_delete=models.SET_NULL, null=True, blank=True
    )
    cantidad_sugerida = models.DecimalField(max_digits=10, decimal_places=2)
    stock_actual = models.DecimalField(max_digits=10, decimal_places=2)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Sugerencias de Pedido"
        ordering = ["-creada_en"]

    def __str__(self):
        return f"Sugerencia: {self.producto.nombre} x {self.cantidad_sugerida} ({self.sucursal})"
