# Modelo de permisos Analytics + estrategia BI por rol

## 1) Objetivo

Este documento define el nuevo grupo de permisos `analytics` para controlar qué análisis, métricas y visualizaciones puede consultar cada rol, con foco en decisiones reales del negocio (operación diaria, control financiero, liderazgo y mejora continua).

También incluye una propuesta de explotación analítica sobre el modelo de datos actual y, al final, un análisis de mejoras estructurales para volver el modelo más robusto, operativo y útil para inteligencia de negocio.

---

## 2) Estado actual del modelo de datos (base factual)

Con base en las tablas actuales:

- `users`
  - `id`, `name`, `email`, `role`, `banned`, timestamps.
- `customers`
  - `id`, `name`, `identifier`, `phone`, `address`, `createdById`, `updatedById`, timestamps.
- `product_categories`
  - `id`, `name`, trazabilidad por usuario y timestamps.
- `products`
  - `id`, `categoryId`, `name`, `variant`, `price`, trazabilidad por usuario y timestamps.
- `orders`
  - `id`, `customerId`, `assignedToUserId`, `expectedDeliveryAt`, `status`, `paymentStatus`, `deliveryAddress`, trazabilidad por usuario y timestamps.
- `order_items`
  - `id`, `orderId`, `productId`, `quantity`, `price`, `details`, trazabilidad por usuario y timestamps.

### 2.1 Métricas que ya se pueden calcular directamente

1. **Volumen operativo**
   - Órdenes creadas por día/semana/mes (`orders.createdAt`).
   - Órdenes por estado (`orders.status`).
   - Órdenes por usuario asignado (`orders.assignedToUserId`).

2. **Cumplimiento de servicio**
   - Órdenes vencidas respecto a `expectedDeliveryAt`.
   - Backlog por estado.
   - Carga por operador/supervisor.

3. **Ingresos y cobro (aproximados)**
   - Ingreso bruto por orden = SUM(`order_items.quantity * order_items.price`).
   - Ingreso por período, por cliente y por producto.
   - Distribución por `paymentStatus`.

4. **Clientes y catálogo**
   - Clientes activos por período (clientes con órdenes).
   - Ticket promedio por cliente.
   - Mix de productos/categorías.

### 2.2 Límites actuales que impactan BI

- No existe costo de producto (solo precio de venta), por lo que no hay margen real.
- No hay historial de cambios de estado de órdenes (solo estado actual).
- No hay tabla explícita de transacciones/pagos (solo `paymentStatus` en la orden).
- No hay segmentación de cliente (tipo, zona normalizada, canal de adquisición, etc.).
- No hay registro de eventos operativos (reasignaciones, reintentos de entrega, incidencias).

---

## 3) Nuevo grupo de permisos: `analytics`

Se define el recurso `analytics` con acciones para controlar analítica por dominio y alcance:

- Acción base:
  - `list`
- Alcance global:
  - `*-all`
- Alcance de trabajo asignado:
  - `*-assigned`

### 3.1 Catálogo de acciones analytics

1. `overview-all`, `overview-assigned`
2. `orders-performance-all`, `orders-performance-assigned`
3. `customers-insights-all`, `customers-insights-assigned`
4. `products-insights-all`, `products-insights-assigned`
5. `revenue-all`, `revenue-assigned`
6. `operations-all`, `operations-assigned`
7. `team-performance-all`, `team-performance-assigned`

### 3.2 Semántica de cada grupo

- **overview**: resumen ejecutivo/operativo de alto nivel (estado general, KPIs principales, alertas).
- **orders-performance**: throughput, embudo, SLA, puntualidad, carga y avance de órdenes.
- **customers-insights**: retención/recurrencia, frecuencia, concentración de ingresos por cliente.
- **products-insights**: desempeño de productos y categorías, rotación y contribución al ingreso.
- **revenue**: ingresos y estructura de cobro, aging de pagos, concentración financiera.
- **operations**: productividad operativa, riesgo de atraso, capacidad y balance de carga.
- **team-performance**: desempeño por usuario/equipo, distribución de trabajo, eficiencia por rol.

---

## 4) Matriz de permisos analytics por rol

> Convención:  
> - ✅ = permitido  
> - ➖ = no aplica / no habilitado

### 4.1 Alcance `all`

| Grupo analytics | Admin | Operator | Supervisor | Accounting |
|---|---:|---:|---:|---:|
| list | ✅ | ✅ | ✅ | ✅ |
| overview-all | ✅ | ➖ | ✅ | ✅ |
| orders-performance-all | ✅ | ➖ | ✅ | ✅ |
| customers-insights-all | ✅ | ➖ | ✅ | ✅ |
| products-insights-all | ✅ | ➖ | ✅ | ✅ |
| revenue-all | ✅ | ➖ | ➖ | ✅ |
| operations-all | ✅ | ➖ | ✅ | ✅ |
| team-performance-all | ✅ | ➖ | ✅ | ➖ |

### 4.2 Alcance `assigned`

| Grupo analytics | Admin | Operator | Supervisor | Accounting |
|---|---:|---:|---:|---:|
| overview-assigned | ✅ | ✅ | ✅ | ➖ |
| orders-performance-assigned | ✅ | ✅ | ✅ | ➖ |
| customers-insights-assigned | ✅ | ✅ | ✅ | ➖ |
| products-insights-assigned | ✅ | ✅ | ✅ | ➖ |
| revenue-assigned | ✅ | ➖ | ➖ | ➖ |
| operations-assigned | ✅ | ✅ | ✅ | ➖ |
| team-performance-assigned | ✅ | ➖ | ✅ | ➖ |

---

## 5) Diseño de dashboards y KPIs por rol (foco en decisiones)

## 5.1 Admin

### Objetivo de decisión

- Balancear crecimiento, rentabilidad operativa y nivel de servicio.
- Detectar cuellos de botella de extremo a extremo.
- Reasignar recursos y ajustar reglas de operación.

### Dashboards habilitados

- Overview global y asignado.
- Performance de órdenes global/asignado.
- Insights de clientes y productos global/asignado.
- Revenue global/asignado.
- Operaciones global/asignado.
- Team performance global/asignado.

### KPIs prioritarios (admin)

1. **Ingresos brutos por período**
   - Fórmula: SUM(`order_items.quantity * order_items.price`) por ventana temporal.
2. **Fill rate operativo**
   - `% órdenes completadas / órdenes creadas` por semana.
3. **Atraso operativo**
   - `% órdenes con expectedDeliveryAt vencida y status != completed`.
4. **Aging de pagos**
   - Distribución de órdenes `pending`/`paid`.
5. **Concentración de clientes**
   - `% ingreso top 10 clientes`.
6. **Concentración de productos**
   - `% ingreso top productos/categorías`.
7. **Carga por equipo**
   - Órdenes activas por usuario asignado.

### Visualizaciones recomendadas

- Serie temporal (ingresos, órdenes creadas/completadas).
- Funnel de estado de órdenes.
- Heatmap de atraso por usuario y día de la semana.
- Pareto (clientes/productos).
- Boxplot de tiempo a completar (cuando exista historial de estados).

### Decisiones concretas que habilita

- Reasignar operadores entre zonas/carteras.
- Cambiar prioridades de producción/atención.
- Definir campañas para clientes de alto valor y alto riesgo de fuga.
- Ajustar política de crédito/cobro sobre clientes con mayor aging.

---

## 5.2 Operator (Operario)

### Objetivo de decisión

- Ejecutar su cartera diaria con foco en cumplimiento y productividad personal.

### Dashboards habilitados

- Overview asignado.
- Orders performance asignado.
- Customers insights asignado.
- Products insights asignado.
- Operations asignado.

### KPIs prioritarios (operator)

1. **Órdenes pendientes asignadas hoy**.
2. **Órdenes atrasadas asignadas**.
3. **Tiempo de respuesta operacional (proxy)**
   - Diferencia entre `createdAt` y `updatedAt` en órdenes activas (aproximación actual).
4. **Cumplimiento diario**
   - Completadas hoy / pendientes al inicio del día.
5. **Top clientes de su cartera**
   - Por valor de órdenes activas y recurrencia.

### Visualizaciones recomendadas

- Kanban por estado (solo asignadas).
- Lista priorizada por riesgo de atraso (`expectedDeliveryAt` cercano o vencido).
- Tendencia semanal de cumplimiento personal.
- Barras de carga por día.

### Decisiones concretas que habilita

- Priorizar secuencia de atención por riesgo y valor.
- Escalar casos críticos al supervisor con evidencia.
- Gestionar mejor tiempos y carga diaria.

---

## 5.3 Supervisor

### Objetivo de decisión

- Coordinar operación del equipo, reducir atrasos sistémicos y elevar el throughput.

### Dashboards habilitados

- Overview global y asignado.
- Orders performance global y asignado.
- Customers insights global y asignado.
- Products insights global y asignado.
- Operations global y asignado.
- Team performance global y asignado.

### KPIs prioritarios (supervisor)

1. **Backlog por estado y por usuario**.
2. **Atraso por operador y por franja horaria**.
3. **Velocidad del flujo**
   - Entradas (órdenes nuevas) vs salidas (órdenes completadas).
4. **Eficiencia de asignación**
   - % órdenes reasignadas, % órdenes sin asignar.
5. **Carga balanceada**
   - Desviación estándar de órdenes activas por operador.
6. **Productividad de equipo**
   - Completadas por operador / período.

### Visualizaciones recomendadas

- Matriz usuario x estado de órdenes.
- Control chart de entradas/salidas diarias.
- Burndown de backlog semanal.
- Ranking de cumplimiento por operador.

### Decisiones concretas que habilita

- Rebalancear asignación en tiempo real.
- Definir guardias/refuerzos por picos.
- Estandarizar prácticas de ejecución según brechas observadas.

---

## 5.4 Accounting (Contabilidad / Facturación)

### Objetivo de decisión

- Maximizar cobrabilidad, anticipar riesgo de caja y sostener trazabilidad financiera.

### Dashboards habilitados

- Overview global.
- Orders performance global.
- Customers insights global.
- Products insights global.
- Revenue global.
- Operations global.

### KPIs prioritarios (accounting)

1. **Ingreso bruto facturable por período**.
2. **Órdenes por `paymentStatus`**.
3. **Aging de cuentas por cobrar (proxy con expectedDeliveryAt + paymentStatus)**.
4. **Ticket promedio y dispersión por cliente**.
5. **Participación de ingresos por producto/categoría**.
6. **Riesgo de concentración**
   - Dependencia de pocos clientes para ingreso total.

### Visualizaciones recomendadas

- Waterfall mensual de ingreso bruto.
- Barras apiladas por estado de pago.
- Cohortes de clientes por primer pedido (cuando exista dato consolidado).
- Pareto de cuentas por cobrar.

### Decisiones concretas que habilita

- Definir priorización de cobranza por riesgo/impacto.
- Revisar condiciones de pago por segmento de cliente.
- Ajustar mix comercial en productos con mejor contribución.

---

## 6) Diccionario mínimo de métricas (definición operacional)

1. **Orden activa**: estado en `pending` o `in_progress`.
2. **Orden completada**: `status = completed`.
3. **Orden atrasada**: `expectedDeliveryAt < now` y `status != completed`.
4. **Ingreso bruto orden**: SUM(items.quantity * items.price).
5. **Ticket promedio**: ingreso bruto total / cantidad de órdenes.
6. **Cliente activo período**: cliente con al menos una orden en la ventana.
7. **Productividad operador**: órdenes completadas por operador por período.
8. **Backlog**: órdenes activas al cierre del período.

---

## 7) Priorización de implementación de analítica (sin cambiar negocio)

### Fase 1: rápido valor (con datos actuales)

- KPIs de overview y operación.
- Ingreso bruto y distribución de pago.
- Top clientes/productos por ingreso.
- Carga y atraso por asignado.

### Fase 2: confiabilidad operativa

- Alertas de riesgo de atraso.
- Monitoreo de capacidad y saturación por equipo.
- Control de cartera asignada por operador.

### Fase 3: madurez BI

- Modelado histórico de estado y tiempos de ciclo.
- KPIs de margen real.
- Forecast de demanda y carga.

---

## 8) Análisis de mejoras al modelo de datos (robustez / operación / utilidad BI)

## 8.1 Cambios de alto impacto (recomendados)

1. **Historial de estados de órdenes**
   - Nueva tabla: `order_status_events`
   - Campos sugeridos: `id`, `orderId`, `fromStatus`, `toStatus`, `changedById`, `changedAt`, `reason`.
   - Beneficio:
     - medir lead time real, tiempo por etapa, cuellos de botella y re-trabajo.

2. **Tabla de pagos/transacciones**
   - Nueva tabla: `order_payments`
   - Campos sugeridos: `id`, `orderId`, `amount`, `currency`, `method`, `status`, `paidAt`, `reference`, `createdById`.
   - Beneficio:
     - aging real, mora, conciliación y trazabilidad financiera.

3. **Costo de producto y vigencia de precio**
   - Extender `products` o crear `product_price_history`.
   - Agregar: `cost`, `validFrom`, `validTo`.
   - Beneficio:
     - margen bruto por orden/producto/categoría.

4. **Eventos de asignación**
   - Tabla `order_assignment_events`: historial de asignaciones y reasignaciones.
   - Beneficio:
     - medir estabilidad de planificación y calidad de asignación.

## 8.2 Mejoras para calidad de datos

1. **Normalización de dirección y zona**
   - Estructurar `deliveryAddress` y `customers.address` en componentes (zona, ciudad, etc.).
   - Beneficio:
     - analítica geográfica y optimización de rutas/capacidad.

2. **Restricciones y validaciones**
   - `quantity > 0`, `price >= 0`, integridad de enums y no-null consistentes.
   - Unicidad de `customers.identifier` si aplica al negocio.
   - Beneficio:
     - menos ruido analítico y menor costo de limpieza.

3. **Soft delete + audit log**
   - Campos: `deletedAt`, `deletedById` o tabla de auditoría.
   - Beneficio:
     - trazabilidad histórica y BI consistente (evitar “desaparición” de registros).

## 8.3 Mejoras de performance analítica

1. **Índices adicionales**
   - `orders(status, expectedDeliveryAt)`.
   - `orders(assigned_to_user_id, status)`.
   - `orders(created_at)`, `orders(payment_status)`.
   - `order_items(order_id)`, `order_items(product_id)`.

2. **Tablas agregadas / snapshots**
   - `daily_order_metrics`, `daily_revenue_metrics`, `user_workload_snapshots`.
   - Beneficio:
     - dashboards más rápidos y estables.

3. **Dimensión de tiempo**
   - Tabla calendario para cortes semanales/mensuales/fiscales.
   - Beneficio:
     - comparativos robustos y consistencia temporal.

## 8.4 Mejoras funcionales orientadas a decisiones

1. **Segmentación de clientes**
   - Campos: segmento, canal, potencial, riesgo.
2. **Clasificación de productos**
   - Estado de producto (activo/obsoleto), familia, criticidad operativa.
3. **Motivos de cancelación y devoluciones**
   - Estructurar catálogo de motivos.
4. **SLA explícito por tipo de orden**
   - Permite medir cumplimiento contra objetivo, no solo contra fecha esperada.

---

## 9) Recomendaciones finales de gobierno analítico

1. Definir un **owner funcional** por dashboard (quién valida KPI y semántica).
2. Mantener un **diccionario de métricas versionado** (evitar interpretaciones distintas).
3. Introducir **tests de calidad de datos** sobre campos críticos.
4. Publicar una **cadencia de revisión**:
   - diario (operación),
   - semanal (supervisión),
   - mensual (dirección/finanzas).
5. Usar el grupo `analytics` como control central para habilitar vistas sin lógica de negocio por nombre de rol en frontend.

---

## 10) Resumen ejecutivo

- El nuevo recurso de permisos `analytics` habilita control fino por dominio analítico y alcance (`all`/`assigned`).
- Cada rol obtiene dashboards alineados a sus decisiones reales:
  - **Admin**: visión total de negocio y equipo.
  - **Operator**: ejecución de cartera asignada.
  - **Supervisor**: control de capacidad y desempeño del equipo.
  - **Accounting**: ingresos, cobro y riesgo financiero.
- Con el modelo actual ya se puede construir una primera capa BI valiosa; para madurez real se recomienda agregar historial de estados, pagos y costos para pasar de métricas descriptivas a analítica operativa y financiera robusta.
