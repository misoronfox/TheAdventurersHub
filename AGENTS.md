# Guía de Contexto para Agentes de IA (`AGENTS.md`)

Este archivo provee contexto técnico y reglas de arquitectura para asistentes de IA que trabajen en **The Adventurer's Hub**.

## 1. Visión General del Proyecto
- **Propósito:** Sistema de gestión de campañas de rol (D&D 5e) con generación de NPCs/retratos por IA y sincronización de archivos con Foundry VTT.
- **Repositorio:** `https://github.com/misoronfox/TheAdventurersHub`
- **Flujo de trabajo:** Basado en **Pull Requests** hacia la rama `main`.

## 2. Stack y Estructura de Archivos
- `app.py`: Monolito Backend en Flask. Contiene configuración de MongoDB (`PyMongo`), middleware JWT (`@token_required`), rutas REST bajo `/api/...`, integración con Groq (`llama-3.1-8b-instant`), Hugging Face (`FLUX.1-schnell`) y Google GenAI.
- `requirements.txt`: Dependencias de Python del backend.
- `frontend/`: SPA en React 19 + Vite 7 + Tailwind CSS v4 + Zustand.
  - `frontend/src/api.js`: Instancia de Axios (`api`) e IPs/URLs hacia el backend y Foundry VTT.
  - `frontend/src/store/authStore.js`: Estado de autenticación con Zustand persistido en `localStorage` (`token`).
  - `frontend/src/components/`: Componentes principales (`Dashboard.jsx`, `CampaignDetails.jsx`, `IALab.jsx`, `Gallery.jsx`, `LoginForm.jsx`, `RegisterForm.jsx`, modales y tarjetas).

## 3. Convenciones de Código y Reglas de Negocio
1. **Idioma:**
   - Nombres de colecciones, campos de MongoDB, rutas de la API (`/api/campanas`, `/api/registro`, `/api/ia/npc-rapido`) y mensajes de respuesta están en **español**.
   - Mantener este estándar al crear nuevos endpoints o modelos.
2. **Autenticación y Seguridad:**
   - Todas las rutas privadas deben usar el decorador `@token_required` definido en `app.py`, el cual inyecta `usuario_actual` (documento de `mongo.db.usuarios`) como primer argumento de la función.
   - Nunca exponer `SECRET_KEY`, `GROQ_API_KEY`, `HUGGINGFACE_API_KEY` ni `GOOGLE_API_KEY` en el código fuente.
3. **Manejo de IDs en MongoDB:**
   - Los `_id` y referencias (`usuario_id`, `dm_id`, `campana_id`, `jugadores`) se almacenan como `bson.objectid.ObjectId` en MongoDB y deben serializarse a `str` al devolver respuestas JSON a React.
4. **Formato de Respuestas API:**
   - Éxito: `jsonify({"status": "success", ...}), 200/201`
   - Error: `jsonify({"error": "Mensaje descriptivo", "detalle": str(e)}), 4xx/5xx`
5. **Flujo Git / Pull Requests:**
   - Trabajar siempre en ramas (`feat/...`, `fix/...`, `chore/...`, `docs/...`) y validar que `frontend` compile (`npm run build`) y pase el linter (`npm run lint`) antes de proponer un PR.
