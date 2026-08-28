# Frontend functional baseline — Portal v0.15

Blueprint es autoridad de requisitos. Este documento ordena la entrega del
Portal y no redefine dominio, estados ni contratos API.

## Alcance canónico

| Epic | US | Superficie | BC principal | Proyección Angular actual |
|---|---:|---|---|---|
| WEB-EPIC-01 | 001–006 | Website | BC-01 | Fuera de Portal |
| WEB-EPIC-02 | 007–015 | Platform | BC-01 | Fuera de Portal |
| WEB-EPIC-03 | 016–024 | Platform | BC-01 | Fuera de Portal |
| WEB-EPIC-04 | 025–032 | Platform + Portal | BC-02 | `/portal/account` |
| WEB-EPIC-05 | 033–042 | Platform | BC-03 | `/portal/product-catalog` |
| WEB-EPIC-06 | 043–049 | Portal | BC-03 + BC-04 | `/portal/request-builder` |
| WEB-EPIC-07 | 050–060 | Portal + Platform | BC-04 | `/portal/purchase-requests` |
| WEB-EPIC-08 | 061–069 | Platform + Portal | BC-04 | `/portal/sales-orders` |
| WEB-EPIC-09 | 070–081 | Platform | BC-05 | Proyección buyer-safe vía BC-03/BC-06 |
| WEB-EPIC-10 | 082–089 | Platform | BC-06 | Proyección buyer-safe vía entregas |
| WEB-EPIC-11 | 090–103 | Platform + Portal | BC-06 | `/portal/deliveries` |
| WEB-EPIC-12 | 104–115 | Platform + Portal | BC-07 + BC-08 | `/portal/receivables`, payment methods |
| WEB-EPIC-13 | 116–122 | Platform + Portal | BC-09 | `/portal/documents` |
| WEB-EPIC-14 | 123–126 | Platform + Portal | BC-10 | `/portal/notifications` |
| WEB-EPIC-15 | 127–133 | Platform + Portal | BC-11 | shell, tracking y evidencias |

## Corte v0.15 ejecutable

1. BC-01: sign-in, sesión y workspace buyer.
2. BC-03: catálogo y detalle buyer-safe.
3. BC-02: cuenta, direcciones y referencias.
4. BC-04: draft de solicitud, preview, submit, solicitudes y sales orders con
   versión/ETag.
5. BC-06: consulta de entregas y tracking buyer-safe.
6. BC-07/BC-08: cuentas por cobrar, pagos e historial de transferencia.
7. BC-09/BC-10: documentos, evidencia y notificaciones.
8. BC-11: change-feed offline no-op.

El flujo Buyer Request Builder sigue la referencia local Vue: comprador,
productos provenientes exclusivamente del carrito de Catálogo, entrega con
dirección guardada/manual/actual y fecha hábil, y confirmación después del
preview del servidor. La ruta se muestra también en un mapa Google Maps
embebido; el dominio conserva únicamente puertos y snapshots, sin depender del
proveedor.

Las capacidades visibles del shell siguen la sesión/autorización recibida. La
selección `mock` sólo es un adaptador local para verificación y no sustituye la
autorización backend.

La semilla mock debe soportar dos perfiles explícitos: `generic` e `icisa`.
`api` es el modo por defecto; ningún build de producción puede depender del
mock. La selección vive en configuración runtime, no en `domain`.

## Reglas de implementación

- Cada BC conserva `domain`, `application`, `infrastructure` y `presentation`.
- Un mock es un adaptador de `application` ubicado en la `infrastructure` del
  BC dueño; no es un servicio global ni un segundo dominio.
- Las composiciones pueden conectar varios BC mediante ports, pero las páginas
  no importan clientes HTTP concretos.
- Los nombres de rutas existentes no sustituyen los nombres canónicos de BC.

Fuente: `blueprint/02-web/requirements/coverage.md`, Blueprint v1 CONFIRMED.

Nota de alcance: el catálogo de Web contiene 133 US, pero Blueprint mantiene
pendientes sus criterios de aceptación detallados. Este baseline documenta
paridad pre-diseño auditada para las superficies implementadas; no certifica
100% de esos criterios pendientes.
