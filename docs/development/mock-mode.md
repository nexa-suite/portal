# Portal mock mode

El primer runtime mock del Buyer Portal se activa únicamente con el global
`__NEXA_RUNTIME_CONFIG__`. El valor por defecto sigue siendo `dataMode: 'api'`
con `tenantProfile: 'generic'`; no hay flags de build ni cambios de contrato
REST.

## Activación

Define el global antes de que Angular haga bootstrap. En un `index.html` servido
por una integración local, el bloque debe aparecer antes del bundle de Angular:

```html
<script>
  window.__NEXA_RUNTIME_CONFIG__ = {
    dataMode: 'mock',
    tenantProfile: 'icisa'
  };
</script>
```

Para el perfil genérico usa `tenantProfile: 'generic'`. Si un valor no está
soportado, el runtime vuelve a API/generic. El `apiBaseUrl` y las rutas existentes
siguen disponibles para `dataMode: 'api'`.

Como atajo local, también se puede abrir
`http://localhost:4300/sign-in?nexaDataMode=mock&nexaTenantProfile=icisa`. El
override por query sólo se acepta en `localhost`, `127.0.0.1` o `::1`.

## Credenciales deterministas

Los dos perfiles usan la contraseña `mock-password`:

| Perfil | Workspace | Buyer |
|---|---|---|
| `generic` | `generic` | `buyer@generic.example` |
| `icisa` | `icisa` | `buyer@icisa.example` |

El mock expone los permisos Buyer necesarios para catálogo, cuenta, solicitudes,
órdenes, documentos, tracking, notificaciones y pagos. Los fixtures no son
persistencia y se reinician al recargar la aplicación.

## Alcance funcional

El runtime mock cubre los ports Buyer-safe implementados en cada bounded
context:

- BC-01 Tenant Access & Governance: autenticación, sesión y perfil Buyer.
- BC-02 Customer & Buyer Relationships: cuenta y direcciones Buyer.
- BC-03 Catalog & Commercial Policy: catálogo y preview de precio.
- BC-04 Sales Commitment: draft canónico de Purchase Request, ciclo de
  solicitudes, sales orders y su descarga.
- BC-06 Fulfillment & Delivery: entregas y tracking buyer-safe.
- BC-07 Credit & Receivables y BC-08 Payments: cuentas por cobrar, historial,
  transferencia reportada y Payment Intent local.
- BC-09 Business Documents: documentos y evidencias descargables.
- BC-10 Notifications: feed, contador y estado de lectura.
- BC-11 Business Traceability: change-feed offline no-op.

El store en memoria comparte el resultado del submit entre el draft y la lista
de solicitudes; sus cambios respetan `If-Match` mediante `version`/ETag y
rechazan versiones obsoletas con error 409. El Payment Element mock reemplaza
el SDK externo durante la demo; no contacta Stripe.

El mock no simula persistencia, autorización real, jobs, webhooks ni datos
internos de Platform. `api` conserva los clientes HTTP existentes y es el
modo por defecto; `mock` sólo cambia los adapters seleccionados detrás de los
application ports.
