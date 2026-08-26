# Frontend bounded-context feature roots

Esta estructura sigue el conjunto canónico de Blueprint: [bounded contexts de Nexa](https://github.com/nexa-suite/blueprint/tree/main/01-shared/domain/bounded-contexts).

Cada carpeta usa exactamente el nombre del módulo API correspondiente (`tenantaccessgovernance`, `customerbuyerrelationships`, `catalogcommercialpolicy`, `salescommitment`, `inventoryavailability`, `fulfillmentdelivery`, `creditreceivables`, `payments`, `businessdocuments`, `notifications`, `businesstraceability`) y vive directamente bajo `src/app`. Cada contexto conserva las cuatro capas reales `application`, `domain`, `infrastructure` y `presentation` en su propia frontera. La única excepción estructural es BC-01, que sigue el patrón API y mantiene las cuatro capas dentro de sus módulos técnicos `iam` y `tenantmanagement`. Las capas sin proyección frontend se documentan explícitamente; no se crean carpetas vacías ni comportamiento especulativo.

`application` contiene casos de uso, fachadas, puertos y orquestación; `domain` contiene modelos y reglas sin dependencias de framework o HTTP; `infrastructure` contiene clientes HTTP, adapters y ACL; `presentation` contiene páginas, componentes y view state. La validación impide imports de `presentation` o `infrastructure` desde `application`, persistencia directa desde `presentation`, dominio fuera de su frontera y cross-BC implícito.

La seguridad transversal usa el contrato neutral [`core/security/portal-security.contract.ts`](../core/security/portal-security.contract.ts) y el adapter [`core/security/portal-security.adapter.ts`](../core/security/portal-security.adapter.ts). La composición raíz conecta los puertos de IAM con sus clientes HTTP; ni `application` ni `domain` importan esa infraestructura.

Esta aplicación es la Buyer Portal: presenta casos de uso buyer y consume contratos/proyecciones del API; no redefine la autoridad del dominio ni crea un segundo catálogo de BCs.

La asignación de pantallas, proyecciones y composiciones está en [`docs/architecture/bounded-context-map.md`](../../docs/architecture/bounded-context-map.md). Los contextos sin implementación frontend se mantienen explícitos para evitar inventar endpoints o modelos.
