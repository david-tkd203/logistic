"""
Script de seed mejorado: datos demo para RestoLogistics v2.
Incluye: 20 sucursales, productos con precio_venta, cajas,
movimientos de entrada/salida, roles de usuario.
Ejecutar: python seed.py
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from api.models import (
    Sucursal, Categoria, Producto, Proveedor,
    ProductoProveedor, Caja, CajaProducto, Inventario,
    AlertaStock, Carrito, CarritoItem, Pedido, Merma,
    Movimiento, MovimientoProducto,
)
from django.contrib.auth.models import User
from datetime import date, timedelta
from decimal import Decimal
import random

# ── 1. Superusuario ──────────────────────────────────────────────
if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser("admin", "admin@resto.cl", "admin123")
    print("[OK] Superusuario creado (admin / admin123)")

# Usuarios demo por rol
roles_usuarios = {
    "gerencia": ("gerencia", "gerencia@resto.cl", "gerencia123"),
    "admin_centro": ("admin_centro", "admin_centro@resto.cl", "admin123"),
    "bodeguero_centro": ("bodeguero_centro", "bodeguero_centro@resto.cl", "bodeguero123"),
}
for username, email, password in roles_usuarios.values():
    if not User.objects.filter(username=username).exists():
        User.objects.create_user(username, email, password)
        print(f"[OK] Usuario {username} creado")

# ── 2. Sucursales ─────────────────────────────────────────────────
nombres_sucursales = [
    "Resto Centro", "Resto Providencia", "Resto Las Condes", "Resto Nuneoa",
    "Resto Vitacura", "Resto La Florida", "Resto Maipu", "Resto Puente Alto",
    "Resto San Miguel", "Resto Santiago Centro", "Resto Bellavista",
    "Resto Barrio Italia", "Resto Costanera", "Resto Chicureo",
    "Resto Lo Barnechea", "Resto Recoleta", "Resto Independencia",
    "Resto Estacion Central", "Resto Quilicura", "Resto Cerrillos",
]
sucursales = []
for nombre in nombres_sucursales:
    suc, _ = Sucursal.objects.get_or_create(nombre=nombre, defaults={"activa": True})
    sucursales.append(suc)
print(f"[OK] {len(sucursales)} sucursales creadas")

# ── 3. Categorías ──────────────────────────────────────────────
cats = {}
for nombre in ["Carnes", "Lacteos", "Verduras", "Frutas", "Secos", "Bebestibles", "Limpieza", "Especias"]:
    cat, _ = Categoria.objects.get_or_create(nombre=nombre)
    cats[nombre] = cat
print(f"[OK] {len(cats)} categorias creadas")

# ── 4. Productos con precio_venta ───────────────────────────────
productos_data = [
    ("CAR-001", "Lomo Liso", "Carnes", "kg", Decimal("20"), Decimal("15990")),
    ("CAR-002", "Pollo Entero", "Carnes", "kg", Decimal("15"), Decimal("8990")),
    ("CAR-003", "Posta Rosada", "Carnes", "kg", Decimal("10"), Decimal("12990")),
    ("CAR-004", "Salmon", "Carnes", "kg", Decimal("8"), Decimal("19990")),
    ("CAR-005", "Cerdo Molido", "Carnes", "kg", Decimal("12"), Decimal("7990")),
    ("LAC-001", "Leche Entera", "Lacteos", "lt", Decimal("30"), Decimal("1200")),
    ("LAC-002", "Crema", "Lacteos", "lt", Decimal("10"), Decimal("3500")),
    ("LAC-003", "Queso Mantecoso", "Lacteos", "kg", Decimal("5"), Decimal("8990")),
    ("LAC-004", "Mantequilla", "Lacteos", "un", Decimal("15"), Decimal("1500")),
    ("LAC-005", "Yogurt Natural", "Lacteos", "un", Decimal("20"), Decimal("800")),
    ("VER-001", "Lechuga", "Verduras", "un", Decimal("25"), Decimal("1500")),
    ("VER-002", "Tomate", "Verduras", "kg", Decimal("15"), Decimal("2990")),
    ("VER-003", "Cebolla", "Verduras", "kg", Decimal("20"), Decimal("1200")),
    ("VER-004", "Papa", "Verduras", "kg", Decimal("40"), Decimal("800")),
    ("VER-005", "Zanahoria", "Verduras", "kg", Decimal("15"), Decimal("1000")),
    ("FRU-001", "Limon", "Frutas", "kg", Decimal("10"), Decimal("2500")),
    ("FRU-002", "Palta", "Frutas", "un", Decimal("20"), Decimal("1200")),
    ("FRU-003", "Platano", "Frutas", "kg", Decimal("10"), Decimal("1500")),
    ("SEC-001", "Arroz", "Secos", "kg", Decimal("25"), Decimal("1500")),
    ("SEC-002", "Fideos", "Secos", "pqt", Decimal("20"), Decimal("1000")),
    ("SEC-003", "Aceite Vegetal", "Secos", "lt", Decimal("15"), Decimal("3500")),
    ("SEC-004", "Sal", "Secos", "kg", Decimal("10"), Decimal("500")),
    ("SEC-005", "Harina", "Secos", "kg", Decimal("15"), Decimal("900")),
    ("SEC-006", "Azucar", "Secos", "kg", Decimal("15"), Decimal("1000")),
    ("BEB-001", "Agua Mineral", "Bebestibles", "un", Decimal("48"), Decimal("1200")),
    ("BEB-002", "Bebida Cola", "Bebestibles", "un", Decimal("48"), Decimal("1500")),
    ("BEB-003", "Jugo Natural", "Bebestibles", "lt", Decimal("10"), Decimal("3500")),
    ("ESP-001", "Comino Molido", "Especias", "kg", Decimal("2"), Decimal("5000")),
    ("ESP-002", "Oregano", "Especias", "kg", Decimal("2"), Decimal("4000")),
    ("ESP-003", "Pimienta", "Especias", "kg", Decimal("2"), Decimal("6000")),
]

productos = []
for sku, nombre, cat_name, unidad, stock_min, pv in productos_data:
    prod, _ = Producto.objects.get_or_create(
        sku=sku,
        defaults={
            "nombre": nombre,
            "categoria": cats[cat_name],
            "unidad_medida": unidad,
            "precio_venta": pv,
            "activo": True,
        },
    )
    productos.append(prod)
print(f"[OK] {len(productos)} productos creados (con precio_venta)")

# ── 5. Proveedores ─────────────────────────────────────────────
proveedores_data = [
    ("Carnes Premium SpA", "76.123.456-7", "Juan Perez", "+569 1234 5678"),
    ("Lacteos del Sur Ltda.", "77.234.567-8", "Maria Gonzalez", "+569 2345 6789"),
    ("Verduleria Central SA", "78.345.678-9", "Carlos Munoz", "+569 3456 7890"),
    ("Distribuidora de Secos y Abarrotes", "79.456.789-0", "Ana Soto", "+569 4567 8901"),
    ("Bebidas y Aguas Chile SpA", "80.567.890-1", "Pedro Diaz", "+569 5678 9012"),
    ("Especias y Condimentos Ltda.", "81.678.901-2", "Laura Vega", "+569 6789 0123"),
    ("Frutas Selectas SA", "82.789.012-3", "Diego Rojas", "+569 7890 1234"),
]
proveedores = []
for nombre, rut, contacto, tel in proveedores_data:
    prov, _ = Proveedor.objects.get_or_create(
        nombre=nombre,
        defaults={"rut": rut, "contacto": contacto, "telefono": tel},
    )
    proveedores.append(prov)
print(f"[OK] {len(proveedores)} proveedores creados")

# ── 6. Cajas (SKU de caja) ──────────────────────────────────────
cajas_data = [
    ("CAJ-001", "Caja Pollo 10kg", [("CAR-002", Decimal("10"))]),
    ("CAJ-002", "Caja Carnes Mixtas 15kg", [
        ("CAR-001", Decimal("5")),
        ("CAR-003", Decimal("5")),
        ("CAR-005", Decimal("5")),
    ]),
    ("CAJ-003", "Caja Lacteos Varios", [
        ("LAC-001", Decimal("12")),
        ("LAC-002", Decimal("6")),
        ("LAC-005", Decimal("12")),
    ]),
    ("CAJ-004", "Caja Verduras 20kg", [
        ("VER-003", Decimal("8")),
        ("VER-004", Decimal("8")),
        ("VER-005", Decimal("4")),
    ]),
    ("CAJ-005", "Caja Bebidas 24un", [
        ("BEB-001", Decimal("12")),
        ("BEB-002", Decimal("12")),
    ]),
    ("CAJ-006", "Caja Secos 15kg", [
        ("SEC-001", Decimal("5")),
        ("SEC-002", Decimal("10")),
    ]),
]

for sku, nombre, contenido in cajas_data:
    caja, created = Caja.objects.get_or_create(
        sku=sku, defaults={"nombre": nombre, "activo": True}
    )
    if created:
        for prod_sku, cantidad in contenido:
            prod = Producto.objects.get(sku=prod_sku)
            CajaProducto.objects.create(caja=caja, producto=prod, cantidad=cantidad)
print(f"[OK] {len(cajas_data)} cajas creadas con contenido")

# ── 7. ProductoProveedor ───────────────────────────────────────
for sucursal in sucursales:
    proveedor = random.choice(proveedores)
    for prod in random.sample(productos, k=min(12, len(productos))):
        precio = Decimal(str(round(random.uniform(500, 8000), -1)))
        ProductoProveedor.objects.get_or_create(
            producto=prod,
            proveedor=proveedor,
            sucursal=sucursal,
            defaults={"precio_compra": precio, "activo": True},
        )
print(f"[OK] Precios de proveedores asignados")

# ── 8. Inventario ──────────────────────────────────────────────
ubicaciones = ["superior", "medio", "inferior", "secos"]
hoy = date.today()

for sucursal in sucursales:
    for prod in random.sample(productos, k=min(15, len(productos))):
        stock = Decimal(str(round(random.uniform(0, 50), 1)))
        min_stock = Decimal(str(round(random.uniform(2, 20), 1)))
        lote = f"L{hoy.strftime('%y%m')}-{random.randint(100,999)}"
        caducidad = hoy + timedelta(days=random.randint(5, 180))

        Inventario.objects.get_or_create(
            sucursal=sucursal,
            producto=prod,
            lote=lote,
            defaults={
                "stock_actual": stock,
                "stock_minimo": min_stock,
                "fecha_recepcion": hoy - timedelta(days=random.randint(0, 14)),
                "fecha_caducidad": caducidad,
                "ubicacion": random.choice(ubicaciones),
            },
        )

        if stock < min_stock:
            AlertaStock.objects.get_or_create(
                sucursal=sucursal,
                producto=prod,
                defaults={
                    "tipo": "critico" if stock == 0 else "bajo",
                    "stock_actual": stock,
                    "stock_minimo": min_stock,
                },
            )
print(f"[OK] Inventario generado para {len(sucursales)} sucursales")

# ── 9. Movimientos demo ─────────────────────────────────────────
for sucursal in random.sample(sucursales, k=5):
    for _ in range(3):
        prod = random.choice(productos)
        tipo = random.choice(["entrada", "salida"])
        cantidad = Decimal(str(random.randint(2, 10)))
        lote = f"L{hoy.strftime('%y%m')}-{random.randint(100,999)}"
        signo = 1 if tipo == "entrada" else -1

        mov = Movimiento.objects.create(
            sucursal=sucursal,
            tipo=tipo,
            metodo=random.choice(["manual", "camara"]),
            sku_ingresado=prod.sku,
            tipo_sku="producto",
            responsable=random.choice(["Bodeguero", "Admin Local", "Jefe Cocina"]),
            observaciones="Movimiento generado por seed",
        )
        MovimientoProducto.objects.create(
            movimiento=mov, producto=prod, cantidad=cantidad
        )

        # Actualizar inventario
        inv, _ = Inventario.objects.get_or_create(
            sucursal=sucursal,
            producto=prod,
            lote=lote,
            defaults={
                "stock_actual": 0,
                "stock_minimo": Decimal("5"),
                "fecha_recepcion": hoy,
            },
        )
        inv.stock_actual += signo * cantidad
        if inv.stock_actual < 0:
            inv.stock_actual = Decimal("0")
        inv.save()

print(f"[OK] Movimientos demo creados")

# ── 10. Pedidos demo ────────────────────────────────────────────
for sucursal in random.sample(sucursales, k=5):
    carrito = Carrito.objects.create(sucursal=sucursal)
    items_carrito = Inventario.objects.filter(
        sucursal=sucursal
    ).select_related("producto")[:3]

    for inv in items_carrito:
        try:
            pp = ProductoProveedor.objects.filter(
                producto=inv.producto, sucursal=sucursal
            ).first()
            precio = pp.precio_compra if pp else Decimal("5000")
        except AttributeError:
            precio = Decimal("5000")

        CarritoItem.objects.create(
            carrito=carrito,
            producto=inv.producto,
            cantidad=Decimal(str(random.randint(2, 10))),
            precio_unitario=precio,
        )

    Pedido.objects.create(
        sucursal=sucursal,
        carrito=carrito,
        estado=random.choice(["pendiente", "aprobado", "enviado", "recibido"]),
        creado_por="Jefe de Cocina",
    )
print(f"[OK] Pedidos demo creados")

# ── 11. Mermas demo ─────────────────────────────────────────────
for sucursal in random.sample(sucursales, k=3):
    for inv in Inventario.objects.filter(sucursal=sucursal)[:2]:
        Merma.objects.create(
            sucursal=sucursal,
            producto=inv.producto,
            cantidad=Decimal(str(round(random.uniform(0.5, 3), 1))),
            razon=random.choice(["caducidad", "mal_estado", "error_cocina"]),
            responsable="Bodeguero",
            observaciones="Merma registrada segun bitacora",
        )
print(f"[OK] Mermas demo creadas")

print()
print("*** SEED COMPLETADO v2 ***")
print(f"  {len(sucursales)} sucursales")
print(f"  {len(productos)} productos (con precio_venta)")
print(f"  {len(proveedores)} proveedores")
print(f"  {len(cajas_data)} cajas con SKU propio")
print(f"  Usuarios demo: gerencia / admin_centro / bodeguero_centro")
