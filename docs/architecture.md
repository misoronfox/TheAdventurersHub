# Dirección de arquitectura

Este documento describe la estructura actual y el camino de evolución. No representa módulos que aún no existen.

## Estado actual

- El backend Flask concentra rutas, autenticación, reglas de negocio e integraciones externas en `app.py`.
- El frontend React está bajo `frontend/src`; componentes y funcionalidades todavía comparten una estructura plana.
- MongoDB se accede mediante PyMongo y los proveedores externos se llaman desde el backend.

## Límites objetivo

### Backend

Organiza el backend por dominio y separa responsabilidades:

```text
backend/
  app/
    __init__.py          # creación de la aplicación y registro de rutas
    config.py            # configuración validada
    extensions.py        # Mongo y extensiones compartidas
    auth/
      routes.py
      service.py
      repository.py
    campaigns/
      routes.py
      service.py
      repository.py
    assets/
      routes.py
      service.py
      repository.py
    integrations/
      groq.py
      image_provider.py
      foundry.py
```

Las rutas validan HTTP y serializan respuestas; los servicios aplican reglas de negocio; los repositorios aíslan consultas de MongoDB; los módulos de integración encapsulan proveedores. Evita que un dominio importe lógica privada de otro dominio. Comparte interfaces pequeñas, no acceso global a todas las colecciones.

La migración desde `app.py` debe ser incremental: extrae un dominio por cambio, conserva rutas y respuestas existentes, añade validación automatizada para el comportamiento afectado y elimina código antiguo solo después de verificar equivalencia. No muevas el archivo completo en un único cambio.

### Frontend

Agrupa UI, estado y llamadas del dominio en `frontend/src/features/<dominio>/`. Mantén `frontend/src/shared/` para componentes, utilidades y cliente HTTP compartidos por dos o más dominios. Evita importar internals entre features; expón una interfaz pública por feature cuando sea necesario.

## Contratos y dependencias

- Los módulos de dominio dependen de interfaces; la capa HTTP, MongoDB y proveedores externos quedan en los bordes.
- Mantén los contratos actuales de API durante refactors. Los cambios incompatibles requieren migración documentada y versión o estrategia explícita.
- No añadas una capa, framework o dependencia sin una necesidad del dominio y un beneficio verificable.
- Cada extracción de módulo incluye criterios de aceptación y validaciones que cubran el comportamiento movido.

## Colaboración y revisión

Asigna una tarea a un único responsable y delimita el módulo bajo su control. El trabajo paralelo debe usar módulos independientes o worktrees separados. La integración revisa las interfaces entre módulos, seguridad, cambios de contrato, dependencias y pruebas antes de aceptar el resultado.
