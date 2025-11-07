-- ==========================
-- ESQUEMA DEL CONGLOMERADO FINANCIERO
-- ==========================

-- Crear la base de datos si no existe (ejecutar como superusuario)
-- CREATE DATABASE conglomerado_financiero;

-- Conectarse a la base de datos conglomerado_financiero antes de ejecutar el resto del script

DROP TABLE IF EXISTS solicitudes_informacion;
DROP TABLE IF EXISTS favoritos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios(
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    login VARCHAR(20) UNIQUE NOT NULL,
    clave VARCHAR(60) NOT NULL,
    email VARCHAR(120) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    tipo VARCHAR(10) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    beneficio VARCHAR(500),
    costo VARCHAR(100),
    plazo VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE favoritos (
   id SERIAL PRIMARY KEY,
   usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
   producto_id BIGINT NOT NULL REFERENCES productos(id),
   creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT uk_usuario_producto UNIQUE(usuario_id, producto_id)
);

CREATE TABLE solicitudes_informacion (
   id SERIAL PRIMARY KEY,
   usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
   producto_id BIGINT NOT NULL REFERENCES productos(id),
   mensaje VARCHAR(500) NOT NULL,
   creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- DATOS DE REFERENCIA
-- ==========================

INSERT INTO usuarios (nombre, login, clave, email, rol) VALUES
    ('Ana Inversionista', 'ana', '1234', 'ana@conglomerado.com', 'CLIENTE'),
    ('Luis Emprendedor', 'luis', '1234', 'luis@conglomerado.com', 'CLIENTE'),
    ('Equipo Corporativo', 'admin', 'admin', 'admin@conglomerado.com', 'ADMIN');

INSERT INTO productos (nombre, tipo, descripcion, beneficio, costo, plazo, activo) VALUES
    ('Fondo Crecimiento Joven', 'FONDO', 'Fondo mutuo diversificado para primeras inversiones con aportes accesibles.', 'Acompañamiento digital y rebalanceo automático.', 'Aporte mensual desde S/ 150', 'Plazo sugerido: 3 a 5 años', TRUE),
    ('Fondo Patrimonial Plus', 'FONDO', 'Portafolio conservador orientado a metas familiares y preservación de capital.', 'Asesoría personalizada y reinversión de dividendos.', 'Aporte mensual desde S/ 300', 'Plazo sugerido: 5 años a más', TRUE),
    ('Seguro Vida Integral', 'SEGURO', 'Cobertura integral de vida y salud para adultos jóvenes.', 'Telemedicina, asistencias y cobertura familiar.', 'Prima mensual desde S/ 120', 'Contratación anual renovable', TRUE),
    ('Seguro Autónomos Protegidos', 'SEGURO', 'Protección flexible para independientes con foco en accidentes.', 'Reembolsos ágiles y asistencias 24/7.', 'Prima mensual desde S/ 160', 'Contratación anual renovable', TRUE);

INSERT INTO favoritos (usuario_id, producto_id) VALUES
    (1, 1),
    (1, 3),
    (2, 2);

INSERT INTO solicitudes_informacion (usuario_id, producto_id, mensaje) VALUES
    (1, 4, 'Quiero saber requisitos para asegurar a mi familia.'),
    (2, 1, '¿Cuál es el monto mínimo para abrir este fondo?');
