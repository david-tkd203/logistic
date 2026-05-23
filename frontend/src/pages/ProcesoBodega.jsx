export default function ProcesoBodega() {
  return (
    <div className="doc-content">
      <h2>Proceso Operativo Integral de Recepción y Gestión de Insumos</h2>
      <p>
        Este manual detalla la cadena de custodia de los insumos alimentarios, desde la recepción
        hasta su transformación, garantizando la inocuidad, la calidad y el control financiero
        estricto.
      </p>

      <div className="card">
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: "1.1rem" }}>1. Recepción y Filtro de Calidad</h3>
        <p>Punto de control crítico para proteger la salud del cliente y la rentabilidad.</p>
        <ul>
          <li><strong>Verificación Documental:</strong> Confrontación física contra Orden de Compra (OC) y Guía de Despacho. Prohibido recibir sin OC.</li>
          <li><strong>Control de Temperatura:</strong> Uso obligatorio de termómetros calibrados.
            <ul>
              <li>Refrigerados: 0°C a 5°C.</li>
              <li>Congelados: -18°C o menos.</li>
              <li>Rechazo inmediato si el producto está fuera de rango térmico.</li>
            </ul>
          </li>
          <li><strong>Inspección Organoléptica:</strong> Evaluación de color, olor, textura y estado de envases.</li>
          <li><strong>Gestión de Rechazos:</strong> Cualquier anomalía debe registrarse en la guía y firmarse por el transportista.</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: "1.1rem" }}>2. Etiquetado y Trazabilidad (Loteo)</h3>
        <p>La trazabilidad es esencial para gestionar alertas alimentarias y controlar vencimientos.</p>
        <ul>
          <li><strong>Etiquetado Interno:</strong> Etiqueta adhesiva con fecha de recepción, fecha de caducidad real, nombre del proveedor y número de lote.</li>
          <li><strong>Digitalización:</strong> Registro en el sistema ERP/POS para alta de inventario.</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: "1.1rem" }}>3. Almacenamiento y Seguridad Alimentaria (FIFO/PEPS)</h3>
        <ul>
          <li><strong>Rotación FIFO:</strong> El producto con fecha de vencimiento más próxima debe consumirse primero.</li>
          <li><strong>Sectorización de Cámaras de Frío (orden vertical):</strong>
            <ol>
              <li>Nivel Superior: Alimentos listos para consumo (cocinados, postres).</li>
              <li>Nivel Medio: Frutas y verduras lavadas/preparadas.</li>
              <li>Nivel Inferior: Carnes crudas (res, cerdo, pollo, pescado, ordenado por temperatura de cocción).</li>
            </ol>
          </li>
          <li><strong>Zona de Secos:</strong> Estanterías elevadas (15-20 cm del suelo). Separación absoluta de productos químicos.</li>
          <li><strong>Control de Plagas:</strong> Trasvasije a contenedores herméticos de policarbonato con tapa.</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: "1.1rem" }}>4. Gestión Financiera y Control de Stock</h3>
        <ul>
          <li><strong>Gestión de Niveles:</strong> Stock Mínimo (punto de recompra) y Stock Máximo definidos por local.</li>
          <li><strong>Inventarios Cíclicos:</strong> Auditorías sorpresa y conteos aleatorios diarios de insumos de alto valor.</li>
          <li><strong>Bitácora de Mermas:</strong> Registro obligatorio de todo producto desechado con razón y firma del responsable.</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: "1.1rem" }}>5. Salida hacia Producción (Requisición y Consumo)</h3>
        <ul>
          <li><strong>Requisición Formal:</strong> Prohibido el acceso directo de cocina a bodega. Se requiere vale firmado por el Jefe de Cocina.</li>
          <li><strong>Descarga en Tiempo Real:</strong> El sistema descuenta el producto al momento de la entrega.</li>
          <li><strong>Merma Técnica:</strong> Evaluación de pérdidas durante el pre-procesamiento para definir el costo real de los platos.</li>
        </ul>
      </div>

      <h2>Resumen de Responsabilidades</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Etapa</th>
            <th>Responsable</th>
            <th>Acción Clave</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Recepción</td><td>Bodeguero</td><td>Control de calidad y temperatura</td></tr>
          <tr><td>Etiquetado</td><td>Bodeguero</td><td>Rotación y trazabilidad</td></tr>
          <tr><td>Almacenaje</td><td>Bodeguero</td><td>Regla FIFO y orden vertical en frío</td></tr>
          <tr><td>Control</td><td>Admin / Chef</td><td>Inventarios cíclicos y análisis de merma</td></tr>
          <tr><td>Salida</td><td>Cocinero / Bodega</td><td>Requisición formal y registro de salida</td></tr>
        </tbody>
      </table>
    </div>
  );
}
