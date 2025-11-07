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
    descripcion_corta VARCHAR(200) NOT NULL,
    riesgo VARCHAR(10) NOT NULL,
    costo NUMERIC(12,2) NOT NULL,
    rendimiento NUMERIC(5,2),
    cobertura VARCHAR(200),
    resumen VARCHAR(500),
    beneficios VARCHAR(500),
    exclusiones VARCHAR(500),
    documento_url VARCHAR(300),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    vistas BIGINT NOT NULL DEFAULT 0,
    comparaciones BIGINT NOT NULL DEFAULT 0,
    solicitudes_informacion BIGINT NOT NULL DEFAULT 0
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

INSERT INTO productos (nombre, tipo, descripcion_corta, riesgo, costo, rendimiento, cobertura, resumen, beneficios, exclusiones, documento_url) VALUES
    ('Fondo Crecimiento Joven', 'FONDO', 'Fondo mutuo diversificado para primeras inversiones', 'MEDIO', 15.00, 8.5, NULL, 'Inversión inicial baja con re-balanceo automático', 'Acompañamiento digital, aportes automáticos', 'No garantiza rentabilidad anual', 'https://docs.conglomerado.com/fondos/crecimiento_joven.pdf'),
    ('Fondo Patrimonial Plus', 'FONDO', 'Portafolio conservador para metas familiares', 'BAJO', 25.00, 6.1, NULL, 'Enfoque en preservación de capital', 'Reinversión automática de dividendos', 'Rendimiento sujeto a mercado', 'https://docs.conglomerado.com/fondos/patrimonial_plus.pdf'),
    ('Seguro Vida Integral', 'SEGURO', 'Cobertura integral de vida y salud para adultos jóvenes', 'BAJO', 42.90, NULL, 'Vida y salud', 'Beneficios en clínicas aliadas + telemedicina', 'Atención médica preferencial, cobertura familiar', 'No cubre enfermedades preexistentes en primeros 12 meses', 'https://docs.conglomerado.com/seguros/vida_integral.pdf'),
    ('Seguro Autónomos Protegidos', 'SEGURO', 'Cobertura flexible para independientes', 'MEDIO', 58.40, NULL, 'Accidentes y hospitalización', 'Reembolsos rápidos, asistencias 24/7', 'Flexibilidad de pago, cobertura internacional', 'No cubre deportes extremos', 'https://docs.conglomerado.com/seguros/autonomos.pdf');

INSERT INTO favoritos (usuario_id, producto_id) VALUES
    (1, 1),
    (1, 3),
    (2, 2);

INSERT INTO solicitudes_informacion (usuario_id, producto_id, mensaje) VALUES
    (1, 4, 'Quiero saber requisitos para asegurar a mi familia.'),
    (2, 1, '¿Cuál es el monto mínimo para abrir este fondo?');
