# Buyer Portal — mapa frontend de bounded contexts

Fuente canónica: [Blueprint bounded contexts](https://github.com/nexa-suite/blueprint/tree/main/01-shared/domain/bounded-contexts). Este mapa sólo describe la proyección de la superficie Buyer Portal; no sustituye los READMEs canónicos ni convierte una ruta Angular en autoridad de dominio.

| BC | Ubicación frontend | Estado / responsabilidad de superficie |
|---|---|---|
| BC-01 Tenant & Access Governance | `src/app/tenantaccessgovernance` | Implementado: sesión y seguridad buyer |
| BC-02 Customer & Buyer Relationships | `src/app/customerbuyerrelationships` | Implementado: cuenta buyer, direcciones y referencias |
| BC-03 Catalog & Commercial Policy | `src/app/catalogcommercialpolicy` | Implementado: catálogo buyer como proyección |
| BC-04 Sales Commitment | `src/app/salescommitment` | Implementado: solicitudes de compra y órdenes |
| BC-05 Inventory Availability | `src/app/inventoryavailability` | Proyección: disponibilidad buyer |
| BC-06 Fulfillment & Delivery | `src/app/fulfillmentdelivery` | Implementado: seguimiento de entregas |
| BC-07 Credit & Receivables | `src/app/creditreceivables` | Proyección: cuentas por cobrar autorizadas |
| BC-08 Payments | `src/app/payments` | Implementado: intents, transferencias y métodos de pago |
| BC-09 Business Documents | `src/app/businessdocuments` | Implementado: documentos de negocio buyer |
| BC-10 Notifications | `src/app/notifications` | Implementado: notificaciones buyer |
| BC-11 Business Traceability | `src/app/businesstraceability` | Reservado: sin contrato frontend implementado |

`core` contiene shell, composición de superficie, routing, seguridad y páginas puramente transversales. Los flujos que combinan BC07+BC08 o BC04+BC06 viven como composición/gateway explícito; ningún BC importa el `domain`, `application` o `presentation` de otro.

Los puertos de aplicación definen los contratos que consumen las fachadas y las páginas; `app.config.ts` conecta esos puertos con clientes HTTP. El change-feed sigue el mismo límite mediante `CHANGE_FEED_FETCH_PORT`, dejando su cliente SSE en `core/change-feed/infrastructure`.

Cada BC mantiene `application`, `domain`, `infrastructure` y `presentation` como capas directas de su raíz. BC-04 organiza sus subdominios dentro de esas capas. BC-01 conserva `iam` y `tenantmanagement` como módulos técnicos, cada uno con las cuatro capas, igual que API. Las capas sin código de proyección se mantienen con documentación de ausencia de contrato; no son placeholders ni implican endpoints nuevos.

Los roots de código usan exactamente los nombres de módulos API y viven directamente bajo `src/app`: `tenantaccessgovernance`, `customerbuyerrelationships`, `catalogcommercialpolicy`, `salescommitment`, `inventoryavailability`, `fulfillmentdelivery`, `creditreceivables`, `payments`, `businessdocuments`, `notifications` y `businesstraceability`. Los identificadores `BC-01` a `BC-11` se conservan aquí únicamente como IDs canónicos de Blueprint.

Las únicas dependencias upstream de seguridad cruzan por el contrato neutral `core/security/portal-security.contract.ts`, su entrypoint `core/security/portal-security.boundary.ts` y el adapter `core/security/portal-security.adapter.ts`. Los gateways/ACL cross-BC de BC-04 permanecen en su propia `infrastructure`; el validator exige que cualquier otro cruce sea una composición explícita.

`premium` permanece bajo `core/presentation/premium` como pantalla diferida de superficie; no se presenta como un BC canónico.

La dependencia acotada de sesión/perfil desde superficies buyer es la capacidad upstream de autorización de BC-01, no una importación de modelo de negocio.
