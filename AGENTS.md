# Guía de desarrollo

Estas reglas aplican a toda contribución automatizada o manual en este repositorio. Mantén los cambios dentro del alcance solicitado y conserva el idioma español de las rutas, campos y respuestas existentes de la API.

## Flujo de trabajo

1. Revisa `git status`, la rama actual y las instrucciones aplicables antes de editar.
2. Parte de la última versión de `develop`. Usa ramas `feat/`, `fix/`, `refactor/`, `docs/`, `build/`, `ci/` o `chore/` con nombres cortos y descriptivos.
3. Divide el trabajo en unidades revisables. Cada unidad debe tener objetivo, archivos o módulo bajo responsabilidad, criterios de aceptación y validaciones.
4. Cuando haya trabajo paralelo, asigna módulos o archivos sin solapamiento. Usa worktrees aislados para cambios concurrentes; integra cada resultado con revisión y validaciones antes de continuar.
5. No amplíes el alcance, no reviertas cambios ajenos y no incluyas archivos locales, secretos, datos de usuario, dependencias instaladas ni artefactos generados.

## Arquitectura y límites

- Conserva el comportamiento existente salvo que el cambio solicite modificarlo.
- El backend actual está concentrado en `app.py`. Para funcionalidad nueva, evita aumentar ese archivo: organiza por dominio en módulos de rutas, servicios y acceso a datos. Migra el código existente de forma incremental y con comprobaciones para cada dominio.
- En el frontend, organiza nuevas funcionalidades dentro de `frontend/src/features/<dominio>/`; reserva `shared/` para código reutilizado por varios dominios.
- Mantén integraciones externas detrás de módulos propios. No mezcles reglas de negocio con llamadas HTTP, acceso directo a MongoDB o detalles de proveedores.
- Mantén los nombres existentes de colecciones, campos y endpoints en español, salvo una migración explícita.
- Trata cada entrada externa como no confiable. No devuelvas trazas, secretos, rutas locales ni detalles internos de excepciones en respuestas de API.

## Commits y pull requests

- Cada commit y el título del pull request deben seguir Conventional Commits: `tipo(scope opcional): descripción`.
- Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` y `revert`. Para cambios incompatibles usa `!` antes de `:` y documenta `BREAKING CHANGE:` en el cuerpo.
- Usa scopes cortos y estables, por ejemplo `auth`, `campaigns`, `assets`, `frontend`, `api` o `ci`.
- Mantén cada commit enfocado. No combines una refactorización amplia con una funcionalidad ajena.
- El PR apunta a `develop`, explica impacto y alcance, enumera las validaciones ejecutadas y deja los puntos no verificados claramente identificados.

## Seguridad y calidad

- Nunca incluyas credenciales, valores de `.env`, tokens de sesión, datos personales o contenido privado de campañas.
- Si agregas configuración, actualiza `.env.example` con valores locales genéricos y sin secretos.
- Ejecuta las comprobaciones relevantes: `python -m py_compile app.py`; en `frontend/`, `npm run lint` y `npm run build`.
- No afirmes que una comprobación pasó si no se ejecutó. Si no puede ejecutarse, explica el bloqueo y su impacto.
- Mantén documentación funcional y neutral; no agregues marcas de agua, firmas promocionales, metadata de herramientas ni atribuciones automáticas.
