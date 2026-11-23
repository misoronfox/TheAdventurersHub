# Diagramas del sistema The Adventurers Hub

Los diagramas reflejan el código y las pantallas actuales del proyecto. La arquitectura se representa por capas lógicas y se indica dónde el código todavía concentra responsabilidades.

## Diseño visual

Se conserva la identidad de la interfaz actual: fondo oscuro `#1a1a1d`, madera `#4e342e`, dorado `#ffd700` y texto papel `#f5f5dc`. El usuario visitante llega a una portada temática; después de autenticarse, usa la navegación superior con **Mis Partidas**, **Galería**, **IA Lab** y **Salir**. Los diagramas usan los mismos nombres visibles y agrupan las pantallas según el flujo actual de React.

## 1. Arquitectura en n capas

```mermaid
flowchart TB
  visitante[Visitante]
  aventurero[Aventurero autenticado]
  dm[Dungeon Master]
  jugador[Jugador]

  subgraph presentacion["Capa 1 · Presentación · React + Vite"]
    portada[Portada · comenzar aventura]
    acceso[Login / Registro]
    nav[Barra superior · Mis Partidas / Galería / IA Lab]
    partidas[Tablero de campañas]
    detalle[Detalle de campaña]
    galeria[Galería de NPC y retratos]
    ia[Laboratorio de IA]
    modales[Modales · crear campaña / unirse]
    cliente[Cliente HTTP Axios · api.js]
    estado[Estado de sesión · Zustand]
    foundry[Enlace externo · Foundry VTT]
  end

  subgraph aplicacion["Capa 2 · Aplicación HTTP · Flask · app.py"]
    rutas[Rutas REST /api]
    auth[Autenticación y autorización · JWT / CSRF]
    campanas[Casos de uso de campañas]
    assets[Casos de uso de assets]
    generacion[Casos de uso de IA]
    limites[Control de solicitudes]
    serializacion[Validación y respuesta JSON]
  end

  subgraph persistencia["Capa 3 · Persistencia · acceso PyMongo desde app.py"]
    mongo[(MongoDB · adventurers_hub)]
    archivos[(Sistema de archivos · FOUNDRY_DATA_PATH)]
  end

  subgraph externos["Servicios externos"]
    groq[Groq · texto y optimización del prompt]
    hf[Hugging Face · generación de imágenes]
    google[Google GenAI · diagnóstico de modelos]
    foundryvtt[Foundry VTT · URL abierta desde el navegador]
  end

  visitante --> portada
  portada --> acceso
  aventurero --> nav
  dm --> partidas
  jugador --> partidas
  nav --> partidas
  nav --> galeria
  nav --> ia
  partidas --> detalle
  partidas --> modales
  partidas --> foundry
  foundry --> foundryvtt
  acceso --> cliente
  nav --> cliente
  partidas --> cliente
  detalle --> cliente
  galeria --> cliente
  ia --> cliente
  cliente --> rutas
  estado -. sesión .-> nav
  rutas --> auth
  rutas --> campanas
  rutas --> assets
  rutas --> generacion
  rutas --> limites
  campanas --> serializacion
  assets --> serializacion
  generacion --> serializacion
  auth --> mongo
  campanas --> mongo
  assets --> mongo
  assets --> archivos
  limites --> mongo
  generacion --> groq
  generacion --> hf
  rutas --> google

  classDef ui fill:#1a1a1d,stroke:#ffd700,color:#f5f5dc,stroke-width:2px
  classDef app fill:#4e342e,stroke:#ffd700,color:#f5f5dc,stroke-width:2px
  classDef data fill:#242426,stroke:#f5f5dc,color:#f5f5dc
  classDef ext fill:#28202d,stroke:#c7a6ff,color:#f5f5dc
  class portada,acceso,nav,partidas,detalle,galeria,ia,modales,cliente,estado,foundry ui
  class rutas,auth,campanas,assets,generacion,limites,serializacion app
  class mongo,archivos data
  class groq,hf,google,foundryvtt ext
```

**Lectura de capas:** la presentación React consume la API Flask. En el estado actual, `app.py` reúne rutas, autorización, reglas del negocio y operaciones PyMongo; por eso la capa de aplicación no se dibuja como servicios o repositorios separados. MongoDB conserva los documentos; los PNG se guardan en el sistema de archivos y MongoDB guarda su ruta. Foundry VTT se abre como enlace externo desde la interfaz, no como una llamada del backend.

## 2. Modelo de datos MongoDB existente

```mermaid
erDiagram
  USUARIOS ||--o{ CAMPANAS : "crea como DM mediante dm_id"
  USUARIOS }o--o{ CAMPANAS : "participa mediante jugadores[]"
  USUARIOS ||--o{ ASSETS : "posee mediante usuario_id"
  CAMPANAS o|--o{ ASSETS : "agrupa mediante campana_id"
  USUARIOS ||--o{ LOGS_GENERACION : "origina mediante usuario_id"

  USUARIOS {
    ObjectId _id PK
    string username UK
    string password_hash
    datetime fecha_registro
  }
  CAMPANAS {
    ObjectId _id PK
    string nombre
    string descripcion
    string codigo_invitacion
    ObjectId dm_id FK
    array jugadores "ObjectId de usuarios"
  }
  ASSETS {
    ObjectId _id PK
    ObjectId usuario_id FK
    string tipo "NPC o Retrato"
    object_or_string prompt_original
    string estado_aprobacion
    ObjectId campana_id FK "opcional"
    string file_path "opcional para retratos"
    string nombre "opcional"
    datetime fecha_creacion
  }
  LOGS_GENERACION {
    ObjectId _id PK
    ObjectId usuario_id FK
    string prompt_original
    string art_prompt
    datetime fecha
    string engine_texto
    string engine_imagen
  }
  RATE_LIMITS {
    string _id PK "digest HMAC del ámbito, usuario/IP y ventana"
    int count
    datetime expires_at "índice TTL"
  }
```

Las referencias se implementan como `ObjectId`; MongoDB no impone las claves foráneas del dibujo. `jugadores` es un arreglo embebido en cada campaña. Los NPC guardan su contenido en `prompt_original` como objeto o texto. Los retratos guardan `file_path` en MongoDB y el archivo PNG fuera de la base de datos. `rate_limits` es una colección técnica y no tiene relación directa con una cuenta: el identificador se calcula con HMAC.

## 3. Navegación de la interfaz actual

```mermaid
flowchart LR
  inicio[Portada · The Adventurer's Hub]
  login[Identifícate, Viajero]
  registro[Nuevo Aventurero]
  tablero[Mis Partidas · Tus Aventuras]
  crear[Modal · Fundar Nueva Campaña]
  unir[Modal · Unirse a Gesta]
  campana[Detalle · La Compañía / Recursos de la Partida]
  galeria[Galería · NPC y Retratos]
  laboratorio[Laboratorio de IA]
  foundry[Foundry VTT · pestaña externa]
  salir[Salir · volver a portada]

  inicio -->|Comenzar aventura| login
  inicio -->|Crear nuevo usuario| registro
  registro -->|Cuenta creada| login
  login -->|Autenticación correcta| tablero
  tablero --> crear
  tablero --> unir
  tablero -->|Seleccionar campaña| campana
  tablero -->|Abrir Foundry VTT| foundry
  tablero --> galeria
  tablero --> laboratorio
  campana -->|Volver al tablero| tablero
  galeria -->|Mis Partidas| tablero
  laboratorio -->|Mis Partidas| tablero
  tablero --> salir
  galeria --> salir
  laboratorio --> salir

  classDef screen fill:#1a1a1d,stroke:#ffd700,color:#f5f5dc,stroke-width:2px
  classDef modal fill:#4e342e,stroke:#ffd700,color:#f5f5dc
  classDef external fill:#28202d,stroke:#c7a6ff,color:#f5f5dc
  class inicio,login,registro,tablero,campana,galeria,laboratorio,salir screen
  class crear,unir modal
  class foundry external
```

El estilo previsto para las pantallas y los diagramas reutiliza los tokens de `frontend/src/index.css`: fondo grafito, bordes y acciones en madera, acentos dorados y texto claro. El panel del NPC generado en IA usa además el color papel `#f4ece1`, coherente con la tarjeta actual.

## 4. Proceso principal · crear o unirse a una campaña

```mermaid
flowchart TD
  start((Inicio)) --> auth{¿Tiene sesión?}
  auth -->|No| signin[Ingresar o registrarse]
  signin --> auth
  auth -->|Sí| board[Consultar Mis Partidas]
  board --> choice{Acción}
  choice -->|Crear| form[Completar nombre y descripción]
  form --> validate[Validar datos y sesión]
  validate --> save1[(Crear documento en campanas)]
  save1 --> invite[Generar código de invitación]
  invite --> refresh[Actualizar tablero]
  choice -->|Unirse| code[Ingresar código]
  code --> find[Buscar campaña por código]
  find --> member{¿Código válido y no pertenece?}
  member -->|No| error[Mostrar error]
  error --> code
  member -->|Sí| add[Agregar usuario a jugadores[]]
  add --> refresh
  refresh --> finish((Fin))
```

## 5. Proceso principal · generar y guardar un NPC con retrato

```mermaid
flowchart TD
  start((Inicio en IA Lab)) --> idea[Escribir idea del NPC]
  idea --> npc[Solicitar generación de NPC]
  npc --> groq[Groq devuelve datos estructurados del NPC]
  groq --> review[Revisar resultado en la tarjeta de estilo pergamino]
  review --> portrait{¿Generar retrato?}
  portrait -->|Sí| prompt[Construir prompt visual]
  prompt --> optimize[Groq optimiza el prompt]
  optimize --> image[Hugging Face genera PNG]
  image --> preview[Mostrar vista previa]
  portrait -->|No| select
  preview --> select[Elegir campaña o Galería Personal]
  select --> saveNpc[Guardar NPC en assets de MongoDB]
  saveNpc --> savePortrait{¿Hay retrato?}
  savePortrait -->|Sí| file[Guardar PNG en FOUNDRY_DATA_PATH]
  file --> meta[Guardar ruta y metadatos en assets]
  savePortrait -->|No| done((Fin))
  meta --> done
```

## Observaciones sobre el alcance actual

- Los perfiles **Dungeon Master** y **Jugador** son roles relativos a cada campaña (`dm_id` y `jugadores[]`), no roles globales guardados en `usuarios`.
- La interfaz actual limita el campo del código de invitación a 6 caracteres; el backend acepta de 6 a 8 y crea códigos de 8. Conviene alinear ese campo para que el flujo de unirse funcione con los códigos generados.
- La Galería muestra el control de borrar, pero el componente actual solo quita el elemento del estado local; no ejecuta la eliminación persistente aunque exista una ruta DELETE en el backend.

