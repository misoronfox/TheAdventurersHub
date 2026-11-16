# Contribuir

Gracias por ayudar a mejorar The Adventurer's Hub. La rama de integración actual es `develop`; los pull requests deben apuntar a esa rama. `main` queda reservada para versiones estables.

## Configuración local

1. Instala Python 3.12 o posterior, Node.js 20 o posterior, npm y MongoDB local.
2. Crea y activa un entorno virtual de Python e instala las dependencias del backend:

   ```bash
   python -m venv .venv
   # Windows PowerShell: .\.venv\Scripts\Activate.ps1
   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. Copia `.env.example` a `.env` y genera un valor privado y único para `SECRET_KEY`. Agrega claves de proveedores solo si usarás esas integraciones.
4. Instala las dependencias del frontend e inicia el servidor de desarrollo:

   ```bash
   cd frontend
   npm ci
   # Copia .env.example a .env si necesitas cambiar las URL locales.
   npm run dev
   ```

5. En una segunda terminal, inicia el backend con `python app.py`.

## Antes de abrir un pull request

Ejecuta las comprobaciones que correspondan a tu cambio:

```bash
python -m py_compile app.py
cd frontend
npm run lint
npm run build
```

El repositorio todavía no tiene una suite automatizada. No indiques que una comprobación pasó si no la ejecutaste. Nunca subas archivos `.env`, credenciales, bases de datos locales, recursos generados ni direcciones personales de servidores.

## Pull requests

- Crea una rama enfocada desde la última versión de `develop` (`feat/`, `fix/`, `docs/` o `chore/`).
- Explica el impacto para usuarios u operación y enumera las comprobaciones ejecutadas.
- Incluye capturas para cambios de interfaz y actualiza la documentación cuando cambien la configuración o el comportamiento.
- Conserva la licencia y atribución de cualquier regla, imagen u otro contenido de terceros que agregues.
