# SafeCampus IA

Sistema híbrido para la **gestión y prevención de riesgos en entornos universitarios**. Los estudiantes reportan incidentes (cables expuestos, fugas de agua, fallas de iluminación, etc.) con su ubicación, y los administradores los priorizan, los gestionan y los visualizan en un panel de estadísticas y en un mapa de riesgos. Un componente de inteligencia artificial apoya la clasificación y priorización de los reportes.

Proyecto desarrollado en la **Universidad de Cundinamarca, Extensión Soacha** (Ingeniería de Software), como caso de aplicación de gestión del conocimiento.

> **Estado:** prototipo funcional (versión 1.0). Consulta [Estado y limitaciones](#estado-y-limitaciones).

![Panel del administrador](docs/dashboard.png)
![Mapa de riesgos](docs/mapa.png)

## Tabla de contenido

- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Migración de datos locales](#migración-de-datos-locales-opcional)
- [Variables de entorno](#variables-de-entorno)
- [API REST](#api-rest)
- [Modelo de datos](#modelo-de-datos)
- [Seguridad](#seguridad)
- [Pruebas](#pruebas)
- [Estado y limitaciones](#estado-y-limitaciones)
- [Solución de problemas](#solución-de-problemas)
- [Licencia](#licencia)
- [Autor](#autor)

## Funcionalidades

**Estudiante**
- Registro e inicio de sesión.
- Creación de reportes con título, descripción, categoría opcional y ubicación por **GPS** o por sede, bloque y área (también se puede reportar sin GPS).
- Consulta de sus reportes, con estado e historial de cambios.

**Administrador**
- Dashboard con estadísticas: total, pendientes, en proceso, resueltos, y reportes por categoría, prioridad y zona.
- Lista de todos los reportes con filtros por estado, prioridad y zona.
- Cambio de estado con comentario; cada cambio queda en el historial.
- **Mapa de riesgos** (OpenStreetMap) con marcadores por prioridad y **zonas de concentración** (reportes a menos de 60 m entre sí).

**General**
- Pantalla de presentación pública (landing).
- Interfaz responsiva (web y móvil) y modo oscuro.
- Análisis con IA: categoría, riesgo, prioridad y recomendación. Con `GEMINI_API_KEY` usa un modelo de Gemini; sin clave, o si el servicio falla, usa un **clasificador por palabras clave** de respaldo. La prioridad se calcula con una matriz de probabilidad por impacto (ISO 31000).

## Tecnologías

| Capa | Tecnología |
|---|---|
| Interfaz web y móvil | React Native y Expo (una sola base de código) |
| Navegación y utilidades | React Navigation, expo-secure-store, expo-location, expo-linear-gradient |
| Mapas | Leaflet y OpenStreetMap |
| Backend | Node.js y Express |
| Seguridad | bcrypt, JSON Web Token, CORS, dotenv |
| Base de datos | PostgreSQL alojado en **Supabase** (nube), conectado con el controlador `pg` por SSL |
| IA | API de Gemini (Google AI Studio) y reglas de respaldo |

## Arquitectura

```
Cliente híbrido (Expo: web / Android / iOS)
        │  HTTP + JSON (token JWT en la cabecera Authorization)
        ▼
API REST (Node.js + Express)
  rutas → middlewares (JWT, roles) → controladores → servicios (IA)
        │  SQL parametrizado por SSL (pool de conexiones, transacciones)
        ▼
PostgreSQL en Supabase (nube, Session pooler)
```

La base de datos está en la nube; el backend y la app se ejecutan en tu equipo. Por eso el proyecto **necesita internet**, tanto para la base de datos como para las teselas del mapa (OpenStreetMap), que se descargan en el cliente.

## Estructura del repositorio

```
safecampus-ai/
├── backend/
│   ├── database/
│   │   ├── schema.sql              # esquema y datos iniciales
│   │   ├── crearAdmin.js           # crea el usuario administrador
│   │   └── analizarPendientes.js   # analiza con IA los reportes sin análisis
│   ├── src/
│   │   ├── config/                 # conexión a PostgreSQL
│   │   ├── controllers/            # lógica de autenticación y reportes
│   │   ├── middlewares/            # verificación de token y roles
│   │   ├── routes/                 # definición de endpoints
│   │   ├── services/               # IA y reglas de respaldo
│   │   └── app.js
│   ├── server.js
│   └── package.json
└── mobile/
    ├── assets/                     # logo e íconos
    ├── src/
    │   ├── components/             # layouts, tarjetas, mapa, insignias
    │   ├── context/                # sesión (AuthContext)
    │   ├── navigation/             # rutas por sesión y rol
    │   ├── screens/                # pantallas
    │   ├── services/               # cliente de la API y almacenamiento
    │   └── utils/                  # fechas, zonas y HTML del mapa
    ├── App.js
    └── package.json
```

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior
- [Git](https://git-scm.com/)
- Una cuenta gratuita de [Supabase](https://supabase.com/) (la base de datos PostgreSQL vive allí; **no hace falta instalar PostgreSQL**)
- Conexión a internet
- Opcional: una clave de [Google AI Studio](https://aistudio.google.com/) para el análisis con IA
- Opcional: la app **Expo Go** para probar en el celular

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/MiguelCondia/SafeCampusAI
cd SafeCampusAI
```

### 2. Crear la base de datos en Supabase

1. En [supabase.com](https://supabase.com/) crea un proyecto nuevo (por ejemplo, `safecampus-ia`). Define una contraseña fuerte para la base de datos y **guárdala**; evita caracteres como `@`, `#` o `/`.
2. Obtén la cadena de conexión: pulsa **Connect**, abre la pestaña **Direct (Connection string)** y copia la de **Session pooler** (puerto 5432, host terminado en `pooler.supabase.com`). Tiene esta forma:

   ```
   postgresql://postgres.REFERENCIA:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:5432/postgres
   ```

   Reemplaza `[YOUR-PASSWORD]` por tu contraseña, sin corchetes. No uses la conexión directa (`db.REFERENCIA.supabase.co`): requiere IPv6 y muchas redes no la soportan.
3. Crea las tablas: en **SQL Editor** → **New query**, pega el contenido de `backend/database/schema.sql` y pulsa **Run**.

   > **Advertencia:** el script comienza con `DROP TABLE`, por lo que borra los datos de las tablas existentes. Úsalo en una base nueva o cuando quieras empezar de cero.
4. Activa **RLS** en las tablas (ver [Seguridad](#seguridad)); el script ya incluye las sentencias al final. Comprueba en **Advisors → Security Advisor** que no quede ninguna tabla sin RLS.

### 3. Configurar y arrancar el backend

```bash
cd backend
npm install
```

Crea el archivo `backend/.env` con la cadena de Supabase (ver [Variables de entorno](#variables-de-entorno)), crea el administrador y arranca el servidor:

```bash
node database/crearAdmin.js
npm run dev
```

Verifica la conexión en `http://localhost:3000/api/health/db`; debe responder con `"baseDeDatos":"conectada"` y `"categorias":10`.

El script `crearAdmin.js` crea la cuenta `admin@safecampus.edu`. La contraseña de demostración está definida en el propio script: **cámbiala** antes de cualquier despliegue.

### 4. Arrancar la aplicación

En otra terminal:

```bash
cd mobile
npm install
npx expo start --web
```

Se abre en `http://localhost:8081`.

**Probar en el celular (opcional):** el celular y el computador deben estar en la misma red. Edita `mobile/src/config.js`, cambia `IP_DEL_PC` por la dirección IPv4 de tu equipo (`ipconfig`), permite Node.js en el firewall y ejecuta `npx expo start`; escanea el QR con Expo Go. Muchas redes institucionales aíslan los dispositivos, y en ese caso no funcionará.

### 5. (Opcional) Analizar reportes ya existentes con IA

```bash
cd backend
node database/analizarPendientes.js
```

## Migración de datos locales (opcional)

Si tenías datos en una base PostgreSQL local y quieres conservarlos, exporta solo los datos (los estados y categorías ya los crea `schema.sql`):

```bash
pg_dump -U postgres -d safecampus --data-only --column-inserts \
  -t usuario -t ubicacion -t reporte -t historial_estado -t analisis_ia -t alerta -t evidencia -f datos.sql
```

Ejecuta `datos.sql` en el **SQL Editor** de Supabase y reajusta los contadores de los identificadores (repite la sentencia para cada tabla con su columna):

```sql
SELECT setval(pg_get_serial_sequence('reporte','id_reporte'),
              COALESCE((SELECT MAX(id_reporte) FROM reporte), 1));
```

Si importas los usuarios, no hace falta ejecutar `crearAdmin.js`.

## Variables de entorno

Archivo `backend/.env` (no se sube al repositorio; está en `.gitignore`):

```
PORT=3000
DATABASE_URL=postgresql://postgres.REFERENCIA:CLAVE@aws-0-REGION.pooler.supabase.com:5432/postgres
DB_SSL=true
JWT_SECRET=<texto_largo_y_aleatorio>

# Opcionales: análisis con IA (sin clave se usan las reglas de respaldo)
GEMINI_API_KEY=<tu_clave_de_google_ai_studio>
GEMINI_MODEL=gemini-3.5-flash
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto 3000). |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (**Session pooler** de Supabase). Los caracteres especiales de la contraseña deben codificarse (por ejemplo, `@` como `%40`). No agregues `?sslmode=...` a la URL: el SSL se controla con `DB_SSL`. |
| `DB_SSL` | `true` para conectar con SSL (obligatorio en Supabase). Déjalo vacío o en `false` solo si usas una base local sin SSL. |
| `JWT_SECRET` | Clave con la que se firman los tokens de sesión. |
| `GEMINI_API_KEY` | Clave de Google AI Studio. Opcional. |
| `GEMINI_MODEL` | Modelo de Gemini a usar. Opcional. |

## API REST

Prefijo: `/api`. Las rutas protegidas requieren la cabecera `Authorization: Bearer <token>`.

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `GET /health`, `GET /health/db` | Público | Estado del servidor y de la base de datos |
| `POST /auth/registro` | Público | Crea una cuenta de estudiante |
| `POST /auth/login` | Público | Inicia sesión y devuelve el token |
| `GET /auth/me` | Sesión | Datos del usuario autenticado |
| `GET /catalogos` | Sesión | Categorías y estados |
| `POST /reportes` | Sesión | Crea un reporte |
| `GET /reportes/mios` | Sesión | Reportes del usuario |
| `GET /reportes/:id` | Dueño o administrador | Detalle con historial y análisis |
| `GET /reportes` | Administrador | Todos los reportes; filtros `estado`, `prioridad`, `categoria`, `sede`, `bloque`, `desde`, `hasta` |
| `PATCH /reportes/:id/estado` | Administrador | Cambia el estado y registra el historial |
| `GET /estadisticas` | Administrador | Indicadores para el dashboard |

**Códigos de respuesta:** `200` correcto, `201` creado, `400` datos inválidos, `401` sin sesión o token inválido, `403` sin permiso, `404` no encontrado, `409` correo repetido y `500` error interno.

## Modelo de datos

Nueve tablas: `usuario`, `categoria`, `estado_reporte`, `ubicacion`, `reporte`, `evidencia`, `analisis_ia`, `historial_estado` y `alerta`. La tabla central es `reporte`, que referencia al usuario, la categoría, la ubicación y el estado. Las restricciones (`UNIQUE`, `CHECK`, claves foráneas y `ON DELETE CASCADE`) garantizan la integridad. El esquema completo está en [`backend/database/schema.sql`](backend/database/schema.sql).

Crear un reporte y cambiar su estado se ejecutan dentro de **transacciones**, para que no queden datos a medias. La base de datos está alojada en Supabase (PostgreSQL gestionado).

## Seguridad

- Contraseñas con **bcrypt** (hash con sal); nunca se almacenan en texto plano.
- Sesión con **JWT** (vence en 8 horas).
- Rutas protegidas por token y por rol (`401` y `403`); un estudiante solo ve sus propios reportes.
- Consultas **parametrizadas** contra inyección SQL.
- Credenciales y claves en variables de entorno, fuera del repositorio.
- Conexión a la base de datos cifrada con **SSL**.
- **RLS (Row Level Security) activado sin políticas** en todas las tablas: Supabase expone el esquema `public` mediante una API pública, y de esta forma esa API no puede leer ni modificar los datos. El backend se conecta como `postgres` directamente a la base de datos, por lo que no se ve afectado. Las sentencias están al final de `schema.sql`:

  ```sql
  ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;  -- y lo mismo en las demás tablas
  ```

- La cadena de conexión es un secreto: si se filtra, cambia la contraseña en **Database → Settings** de Supabase.
- Mensajes de error genéricos en el inicio de sesión para no revelar qué correos existen.

## Pruebas

Las pruebas actuales son **manuales**. Se pueden ejecutar con Thunder Client, Postman o similares, siguiendo la tabla de la [API REST](#api-rest). Casos principales:

- Registro válido (`201`), con contraseña corta (`400`) y con correo repetido (`409`).
- Inicio de sesión con credenciales incorrectas (`401`).
- Ruta protegida sin token (`401`); estudiante en una ruta de administrador (`403`); estudiante consultando un reporte ajeno (`404`).
- Creación de un reporte con y sin GPS, y sin ubicación (`400`).
- Cambio de estado por el administrador, con la nueva fila en el historial.

## Estado y limitaciones

**Implementado:** registro y acceso con roles, reportes con ubicación, historial de estados, dashboard, filtros, mapa de riesgos con zonas de concentración, landing, modo oscuro y análisis con IA con respaldo por reglas.

**Pendiente o por mejorar:**

- Evidencia fotográfica (la tabla `evidencia` existe, pero la app aún no la usa).
- Notificaciones por cambio de estado y alertas (la tabla `alerta` existe).
- Eliminación y edición de reportes por el administrador.
- Paginación y búsqueda por texto en las listas.
- Selección manual del punto en el mapa.
- Corrección de la prioridad sugerida por la IA desde la app.
- Límite de intentos de inicio de sesión, CORS restringido y HTTPS (necesarios al desplegar).
- Evaluación de la precisión de la IA y prueba de usabilidad con usuarios.
- Pruebas automatizadas.
- Verificación del certificado SSL de Supabase (hoy se cifra la conexión, pero no se valida la identidad del servidor; para producción, usar el certificado CA del proyecto).
- Despliegue del backend y de la app en la nube (hoy solo la base de datos está en la nube).

SafeCampus IA **no reemplaza las líneas de emergencia** de la institución. La IA es una herramienta de apoyo: sus resultados son sugerencias que el administrador puede revisar.

## Solución de problemas

| Problema | Causa probable y solución |
|---|---|
| `column "sede" of relation "ubicacion" does not exist` | La base se creó con un esquema anterior. Ejecuta `ALTER TABLE ubicacion ADD COLUMN IF NOT EXISTS sede VARCHAR(100), ADD COLUMN IF NOT EXISTS bloque VARCHAR(50), ADD COLUMN IF NOT EXISTS piso_area VARCHAR(100);` o recrea la base con `schema.sql`. |
| `password authentication failed` | La contraseña de `DATABASE_URL` es incorrecta, o el usuario no es `postgres.REFERENCIA` (con la referencia del proyecto). |
| `ENOTFOUND`, `ENETUNREACH` o `ETIMEDOUT` al conectar | Usaste la conexión directa (IPv6) en lugar del **Session pooler**, o la red bloquea la conexión. Prueba con otra red o con los datos del celular. |
| `self-signed certificate` o error de SSL | Falta `DB_SSL=true` en el `.env`, o agregaste `sslmode` a la URL; quítalo. |
| El proyecto de Supabase no responde | Los proyectos gratuitos pueden pausarse por inactividad: entra al panel y reactívalo (revisa las condiciones vigentes del plan). |
| Error de clave duplicada al crear reportes tras importar datos | Reajusta los contadores con `setval` (ver [Migración de datos locales](#migración-de-datos-locales-opcional)). |
| `EADDRINUSE` | El puerto 3000 está ocupado: cambia `PORT` en el `.env` y la URL en `mobile/src/config.js`. |
| "No se pudo conectar con el servidor" | El backend no está corriendo, o en el celular la IP de `config.js` es incorrecta. |
| El mapa sale gris | Sin internet o teselas de OpenStreetMap bloqueadas por la red. |
| Los reportes quedan en `origen = reglas` | Falta `GEMINI_API_KEY`, el modelo no existe o el servicio no respondió; revisa el mensaje en la terminal del backend. |
| Falla la instalación de `bcrypt` | Instala `bcryptjs` y cambia el `require('bcrypt')` por `require('bcryptjs')` en `authController.js` y `crearAdmin.js`. |

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

Los mapas usan datos de © colaboradores de OpenStreetMap, disponibles bajo la licencia ODbL.

## Autor

**Miguel Ángel Condía Santamaría**
Estudiante de Ingeniería de Software, Universidad de Cundinamarca, Extensión Soacha.