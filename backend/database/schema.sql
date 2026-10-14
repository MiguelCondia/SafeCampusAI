-- Si ya existían las tablas, las borramos para poder re-ejecutar el script
-- sin errores. CASCADE borra también lo que dependa de ellas.
-- (OJO: esto borra los datos. Solo útil en desarrollo)
DROP TABLE IF EXISTS alerta CASCADE;
DROP TABLE IF EXISTS historial_estado CASCADE;
DROP TABLE IF EXISTS analisis_ia CASCADE;
DROP TABLE IF EXISTS evidencia CASCADE;
DROP TABLE IF EXISTS reporte CASCADE;
DROP TABLE IF EXISTS ubicacion CASCADE;
DROP TABLE IF EXISTS estado_reporte CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- -----------------------------------------------------
-- USUARIO: estudiantes y administradores (RF01, RF03)
-- -----------------------------------------------------
CREATE TABLE usuario (
    id_usuario  SERIAL PRIMARY KEY,            -- SERIAL = entero autoincremental
    nombre      VARCHAR(100) NOT NULL,
    correo      VARCHAR(100) NOT NULL UNIQUE,  -- UNIQUE: no puede haber dos cuentas con el mismo correo
    contrasena  VARCHAR(255) NOT NULL,         -- aquí guardaremos el HASH (bcrypt), nunca la contraseña real
    rol         VARCHAR(20)  NOT NULL DEFAULT 'estudiante'
                CHECK (rol IN ('estudiante', 'administrador')),  -- CHECK: solo permite estos valores
    telefono    VARCHAR(20),                   -- opcional (sin NOT NULL)
    estado      BOOLEAN NOT NULL DEFAULT TRUE  -- TRUE = cuenta activa
);

-- -----------------------------------------------------
-- CATEGORIA: tipos de incidente (infraestructura, eléctrico...)
-- -----------------------------------------------------
CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre       VARCHAR(50) NOT NULL UNIQUE,
    descripcion  TEXT,
    tipo         VARCHAR(20)
);

-- -----------------------------------------------------
-- ESTADO_REPORTE: Pendiente, En revisión, etc. (RF08)
-- -----------------------------------------------------
CREATE TABLE estado_reporte (
    id_estado   SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- -----------------------------------------------------
-- UBICACION: coordenadas y datos del lugar (RF05)
-- DECIMAL(10,6) guarda coordenadas con precisión de ~10 cm
-- -----------------------------------------------------
CREATE TABLE ubicacion (
    id_ubicacion SERIAL PRIMARY KEY,
    nombre       VARCHAR(100),        -- ej: "Bloque B"
    tipo         VARCHAR(30),         -- ej: "gps" o "manual" (cómo se obtuvo)
    latitud      DECIMAL(10,6),       -- puede ser NULL (RNF13: reportar sin GPS)
    longitud     DECIMAL(10,6),
    descripcion  TEXT                 -- sede, bloque, piso, salón...
);

-- -----------------------------------------------------
-- REPORTE: tabla central del sistema (RF04)
-- Las columnas id_* son claves foráneas (FK): enlazan con otras tablas
-- -----------------------------------------------------
CREATE TABLE reporte (
    id_reporte    SERIAL PRIMARY KEY,
    id_usuario    INT NOT NULL REFERENCES usuario(id_usuario),      -- quién lo creó
    id_categoria  INT REFERENCES categoria(id_categoria),           -- puede ser NULL hasta que la IA clasifique
    id_ubicacion  INT REFERENCES ubicacion(id_ubicacion),
    id_estado     INT NOT NULL REFERENCES estado_reporte(id_estado),
    titulo        VARCHAR(100) NOT NULL,
    descripcion   TEXT NOT NULL,
    fecha_reporte TIMESTAMP NOT NULL DEFAULT NOW(),                 -- NOW() = fecha y hora actuales
    prioridad     VARCHAR(10)
                    CHECK (prioridad IN ('Bajo', 'Medio', 'Alto', 'Crítico')),
    evidencia     BOOLEAN NOT NULL DEFAULT FALSE                    -- ¿tiene fotos adjuntas?
);

-- -----------------------------------------------------
-- EVIDENCIA: fotos asociadas a un reporte (0 o muchas)
-- -----------------------------------------------------
CREATE TABLE evidencia (
    id_evidencia SERIAL PRIMARY KEY,
    id_reporte   INT NOT NULL REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    -- ON DELETE CASCADE: si borramos el reporte, se borran sus evidencias
    url_archivo  VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(20),
    fecha_subida TIMESTAMP NOT NULL DEFAULT NOW(),
    descripcion  TEXT
);

-- -----------------------------------------------------
-- ANALISIS_IA: resultado del análisis de la IA (RF06)
-- id_reporte UNIQUE = un reporte tiene como máximo un análisis (relación 1 a 1)
-- -----------------------------------------------------
CREATE TABLE analisis_ia (
    id_analisis       SERIAL PRIMARY KEY,
    id_reporte        INT NOT NULL UNIQUE REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    categoria_sugerida VARCHAR(50),
    prioridad_sugerida VARCHAR(10),
    riesgo_detectado   VARCHAR(100),
    recomendaciones    TEXT,
    fecha_analisis     TIMESTAMP NOT NULL DEFAULT NOW(),
    origen             VARCHAR(20) NOT NULL DEFAULT 'ia'
    -- origen: 'ia' (Claude) o 'reglas' (respaldo si la IA falla, RNF12)
);

-- -----------------------------------------------------
-- HISTORIAL_ESTADO: registro de cada cambio de estado (RF09)
-- Cada vez que un admin cambia el estado, se inserta una fila aquí
-- -----------------------------------------------------
CREATE TABLE historial_estado (
    id_historial    SERIAL PRIMARY KEY,
    id_reporte      INT NOT NULL REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    id_estado       INT NOT NULL REFERENCES estado_reporte(id_estado),
    id_usuario      INT REFERENCES usuario(id_usuario),  -- quién hizo el cambio
    comentario      TEXT,
    fecha_cambio    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- ALERTA: avisos generados por reportes de alta prioridad
-- -----------------------------------------------------
CREATE TABLE alerta (
    id_alerta     SERIAL PRIMARY KEY,
    id_reporte    INT NOT NULL REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    tipo          VARCHAR(30),
    mensaje       TEXT,
    nivel         VARCHAR(10),
    estado        VARCHAR(20) NOT NULL DEFAULT 'activa',
    fecha_emision TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- ÍNDICES: aceleran las búsquedas más frecuentes (RNF02)
-- Sin índice, PostgreSQL revisa fila por fila; con índice, salta directo
-- -----------------------------------------------------
CREATE INDEX idx_reporte_usuario   ON reporte(id_usuario);    -- "mis reportes"
CREATE INDEX idx_reporte_estado    ON reporte(id_estado);     -- filtrar por estado
CREATE INDEX idx_reporte_prioridad ON reporte(prioridad);     -- filtrar por prioridad

-- -----------------------------------------------------
-- DATOS INICIALES: lo mínimo para que el sistema funcione
-- -----------------------------------------------------

-- Los 5 estados definidos en el RF08
INSERT INTO estado_reporte (nombre, descripcion) VALUES
    ('Pendiente',   'Reporte recibido, aún sin revisar'),
    ('En revisión', 'Un administrador está evaluando el reporte'),
    ('En proceso',  'Se está trabajando en la solución'),
    ('Resuelto',    'El problema fue solucionado'),
    ('Cerrado',     'Reporte finalizado');

-- Categorías basadas en la descripción del proyecto
INSERT INTO categoria (nombre, descripcion, tipo) VALUES
    ('Infraestructura',  'Daños en paredes, pisos, techos, puertas',        'estructural'),
    ('Eléctrico',        'Cables expuestos, cortos, fallas de energía',     'seguridad'),
    ('Hidráulico',       'Fugas de agua, pisos mojados, daños en tuberías', 'servicios'),
    ('Iluminación',      'Lámparas dañadas, zonas oscuras',                 'servicios'),
    ('Seguridad física', 'Hurtos, acceso no autorizado, personas ajenas',   'seguridad'),
    ('Emergencia médica','Lesiones, desmayos, necesidad de primeros auxilios','emergencia'),
    ('Ambiental',        'Olores, gases, residuos, condiciones del entorno', 'ambiental'),
    ('Limpieza',         'Basura acumulada, falta de aseo',                  'servicios'),
    ('Accesibilidad',    'Rampas, ascensores, obstáculos en rutas',          'accesibilidad'),
    ('Otro',             'Situaciones que no encajan en otra categoría',     'general');