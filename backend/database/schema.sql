-- =====================================================
-- SafeCampus AI - Esquema de base de datos
-- =====================================================

-- Borra las tablas existentes para poder re-ejecutar el script (borra los datos)
DROP TABLE IF EXISTS alerta CASCADE;
DROP TABLE IF EXISTS historial_estado CASCADE;
DROP TABLE IF EXISTS analisis_ia CASCADE;
DROP TABLE IF EXISTS evidencia CASCADE;
DROP TABLE IF EXISTS reporte CASCADE;
DROP TABLE IF EXISTS ubicacion CASCADE;
DROP TABLE IF EXISTS estado_reporte CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- USUARIO: estudiantes y administradores (RF01, RF03)
CREATE TABLE usuario (
    id_usuario  SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    correo      VARCHAR(100) NOT NULL UNIQUE,
    contrasena  VARCHAR(255) NOT NULL,          -- hash bcrypt, nunca la contraseña real
    rol         VARCHAR(20)  NOT NULL DEFAULT 'estudiante'
                CHECK (rol IN ('estudiante', 'administrador')),
    telefono    VARCHAR(20),
    estado      BOOLEAN NOT NULL DEFAULT TRUE
);

-- CATEGORIA: tipos de incidente
CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre       VARCHAR(50) NOT NULL UNIQUE,
    descripcion  TEXT,
    tipo         VARCHAR(20)
);

-- ESTADO_REPORTE (RF08)
CREATE TABLE estado_reporte (
    id_estado   SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- UBICACION (RF05). sede, bloque y piso_area permiten filtrar por zona (RF14)
CREATE TABLE ubicacion (
    id_ubicacion SERIAL PRIMARY KEY,
    nombre       VARCHAR(100),
    tipo         VARCHAR(30),          -- "gps" o "manual"
    latitud      DECIMAL(10,6),        -- puede ser NULL (RNF13)
    longitud     DECIMAL(10,6),
    descripcion  TEXT,
    sede         VARCHAR(100),
    bloque       VARCHAR(50),
    piso_area    VARCHAR(100)
);

-- REPORTE: tabla central (RF04)
CREATE TABLE reporte (
    id_reporte    SERIAL PRIMARY KEY,
    id_usuario    INT NOT NULL REFERENCES usuario(id_usuario),
    id_categoria  INT REFERENCES categoria(id_categoria),
    id_ubicacion  INT REFERENCES ubicacion(id_ubicacion),
    id_estado     INT NOT NULL REFERENCES estado_reporte(id_estado),
    titulo        VARCHAR(100) NOT NULL,
    descripcion   TEXT NOT NULL,
    fecha_reporte TIMESTAMP NOT NULL DEFAULT NOW(),
    prioridad     VARCHAR(10)
                    CHECK (prioridad IN ('Bajo', 'Medio', 'Alto', 'Crítico')),
    evidencia     BOOLEAN NOT NULL DEFAULT FALSE
);

-- EVIDENCIA: fotos de un reporte
CREATE TABLE evidencia (
    id_evidencia SERIAL PRIMARY KEY,
    id_reporte   INT NOT NULL REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    url_archivo  VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(20),
    fecha_subida TIMESTAMP NOT NULL DEFAULT NOW(),
    descripcion  TEXT
);

-- ANALISIS_IA: resultado del análisis (RF06). Uno por reporte
CREATE TABLE analisis_ia (
    id_analisis        SERIAL PRIMARY KEY,
    id_reporte         INT NOT NULL UNIQUE REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    categoria_sugerida VARCHAR(50),
    prioridad_sugerida VARCHAR(10),
    riesgo_detectado   VARCHAR(100),
    recomendaciones    TEXT,
    fecha_analisis     TIMESTAMP NOT NULL DEFAULT NOW(),
    origen             VARCHAR(20) NOT NULL DEFAULT 'ia'   -- 'ia' o 'reglas'
);

-- HISTORIAL_ESTADO (RF09)
CREATE TABLE historial_estado (
    id_historial SERIAL PRIMARY KEY,
    id_reporte   INT NOT NULL REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    id_estado    INT NOT NULL REFERENCES estado_reporte(id_estado),
    id_usuario   INT REFERENCES usuario(id_usuario),
    comentario   TEXT,
    fecha_cambio TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ALERTA: avisos por prioridad alta o crítica
CREATE TABLE alerta (
    id_alerta     SERIAL PRIMARY KEY,
    id_reporte    INT NOT NULL REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    tipo          VARCHAR(30),
    mensaje       TEXT,
    nivel         VARCHAR(10),
    estado        VARCHAR(20) NOT NULL DEFAULT 'activa',
    fecha_emision TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ÍNDICES (RNF02)
CREATE INDEX idx_reporte_usuario   ON reporte(id_usuario);
CREATE INDEX idx_reporte_estado    ON reporte(id_estado);
CREATE INDEX idx_reporte_prioridad ON reporte(prioridad);

-- DATOS INICIALES
INSERT INTO estado_reporte (nombre, descripcion) VALUES
    ('Pendiente',   'Reporte recibido, aún sin revisar'),
    ('En revisión', 'Un administrador está evaluando el reporte'),
    ('En proceso',  'Se está trabajando en la solución'),
    ('Resuelto',    'El problema fue solucionado'),
    ('Cerrado',     'Reporte finalizado');

INSERT INTO categoria (nombre, descripcion, tipo) VALUES
    ('Infraestructura',   'Daños en paredes, pisos, techos, puertas',          'estructural'),
    ('Eléctrico',         'Cables expuestos, cortos, fallas de energía',       'seguridad'),
    ('Hidráulico',        'Fugas de agua, pisos mojados, daños en tuberías',   'servicios'),
    ('Iluminación',       'Lámparas dañadas, zonas oscuras',                   'servicios'),
    ('Seguridad física',  'Hurtos, acceso no autorizado, personas ajenas',     'seguridad'),
    ('Emergencia médica', 'Lesiones, desmayos, necesidad de primeros auxilios','emergencia'),
    ('Ambiental',         'Olores, gases, residuos, condiciones del entorno',  'ambiental'),
    ('Limpieza',          'Basura acumulada, falta de aseo',                   'servicios'),
    ('Accesibilidad',     'Rampas, ascensores, obstáculos en rutas',           'accesibilidad'),
    ('Otro',              'Situaciones que no encajan en otra categoría',      'general');

ALTER TABLE usuario          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categoria        ENABLE ROW LEVEL SECURITY;
ALTER TABLE estado_reporte   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicacion        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporte          ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencia        ENABLE ROW LEVEL SECURITY;
ALTER TABLE analisis_ia      ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerta           ENABLE ROW LEVEL SECURITY;