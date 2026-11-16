# Contribuir

La rama de integración es `develop`; los pull requests deben apuntar a ella. `main` se reserva para versiones estables. Consulta [AGENTS.md](AGENTS.md) para las reglas completas de arquitectura, seguridad y colaboración.

## Configuración local

1. Instala Python 3.12 o posterior, Node.js 20 o posterior, npm y MongoDB local.
2. Crea el entorno virtual e instala las dependencias del backend:

   ```bash
   python -m venv .venv
   # Windows PowerShell: .\.venv\Scripts\Activate.ps1
   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. Copia `.env.example` a `.env` y genera un `SECRET_KEY` privado. Las claves de proveedores de IA solo son necesarias para usar esas integraciones.
4. Configura el frontend e inicia ambos servidores:

   ```bash
   cd frontend
   npm ci
   # Opcional: copia .env.example a .env para personalizar las URL locales.
   npm run dev
   ```

   En otra terminal, desde la raíz, ejecuta `python app.py`.

## Ramas y commits

- Crea una rama corta desde `develop`: `feat/`, `fix/`, `refactor/`, `docs/`, `build/`, `ci/` o `chore/`.
- Configura el hook local para validar los mensajes de commit:

  ```bash
  git config core.hooksPath .githooks
  ```

- Usa Conventional Commits en cada commit y en el título del PR. Ejemplos:

  ```text
  feat(campaigns): add invite code validation
  fix(auth): reject expired sessions
  docs(dev): document local setup
  ```

- Usa `!` para un cambio incompatible, por ejemplo `feat(api)!: rename campaign response fields`, y describe `BREAKING CHANGE:` en el cuerpo.
- Mantén cada commit enfocado y cada PR acotado a un resultado revisable.

## Trabajo dividido

Antes de delegar o paralelizar una tarea, define el resultado esperado, criterios de aceptación, módulo o archivos asignados y validaciones. Evita asignar los mismos archivos a varias personas o procesos. Para cambios concurrentes usa worktrees; integra y valida cada rama antes de combinarla.

## Validación y pull requests

Antes de abrir el PR, ejecuta lo que corresponda al cambio:

```bash
python -m py_compile app.py
cd frontend
npm run lint
npm run build
```

La CI valida sintaxis de Python, lint y build del frontend, además de los Conventional Commits. El repositorio todavía no tiene pruebas automatizadas de comportamiento; identifica esa limitación cuando afecte la validación.

El PR debe explicar el objetivo, alcance, riesgos, comprobaciones ejecutadas y cualquier punto pendiente. Incluye capturas para cambios visuales y actualiza documentación cuando cambie la configuración o el comportamiento.

No subas `.env`, credenciales, bases de datos, datos privados de campañas, dependencias instaladas ni artefactos de compilación. No agregues marcas de agua, firmas promocionales ni metadata de herramientas a los archivos o assets del proyecto.
