# BC-01 — Tenant & Access Governance

Responsable frontend: módulo técnico `iam`, propietario de autenticación, autorización y sesión de la superficie Buyer Portal.

La proyección técnica de este BC conserva `iam` y `tenantmanagement`, igual que el patrón API. Cada módulo técnico mantiene sus capas directas `application`, `domain`, `infrastructure` y `presentation`. `tenantmanagement` no tiene una proyección frontend independiente en Portal y sólo conserva la frontera documentada.

Los casos de uso de `iam` dependen de puertos de aplicación (`portal-auth.port.ts` y `security.port.ts`); los clientes HTTP sólo implementan esos puertos en `infrastructure` y se conectan desde la composición raíz.

El shell, routing e interceptores consumen la capacidad upstream mediante [`core/security/portal-security.boundary.ts`](../../core/security/portal-security.boundary.ts); no acceden directamente a IAM.
