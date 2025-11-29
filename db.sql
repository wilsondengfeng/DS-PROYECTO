-- ==========================
-- ESQUEMA DEL CONGLOMERADO FINANCIERO
-- ==========================

-- Crear la base de datos si no existe (ejecutar como superusuario)
-- CREATE DATABASE conglomerado_financiero;

-- Conectarse a la base de datos conglomerado_financiero antes de ejecutar el resto del script

-- Forzar codificacion UTF-8 para evitar caracteres corruptos
SET client_encoding = 'UTF8';

DROP TABLE IF EXISTS solicitudes_informacion;
DROP TABLE IF EXISTS contratos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios(
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    login VARCHAR(20) UNIQUE NOT NULL,
    clave VARCHAR(60) NOT NULL,
    email VARCHAR(120) NOT NULL,
    saldo NUMERIC(15,2) NOT NULL DEFAULT 0,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    tipo VARCHAR(10) NOT NULL,
    riesgo VARCHAR(20),
    descripcion VARCHAR(500) NOT NULL,
    beneficio VARCHAR(500),
    costo VARCHAR(100),
    plazo VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE contratos (
   id SERIAL PRIMARY KEY,
   usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
   producto_id BIGINT NOT NULL REFERENCES productos(id),
   monto_invertido NUMERIC(15,2) NOT NULL,
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

INSERT INTO usuarios (nombre, login, clave, email, rol, saldo) VALUES
    ('Ana Inversionista', 'ana', '1234', 'ana@conglomerado.com', 'CLIENTE', 25000.00),
    ('Luis Emprendedor', 'luis', '1234', 'luis@conglomerado.com', 'CLIENTE', 15000.00),
    ('Equipo Corporativo', 'admin', 'admin', 'admin@conglomerado.com', 'ADMIN', 0.00);

INSERT INTO productos (nombre, tipo, riesgo, descripcion, beneficio, costo, plazo, activo) VALUES
    ('IF Libre Disponibilidad Soles FMIV', 'FONDO', 'BAJO', 'Es nuestra alternativa extra conservadora, en soles, que te permite disponer de tu dinero cuando quieras. Invierte unicamente en renta fija y es de riesgo muy bajo.', 'Rentabilidad nominal a octubre 2025*: Serie A 3.15%, Serie B 3.31%, Serie C 3.21%.', 'Moneda: Soles. Libre disponibilidad sin penalidad.', 'Sin plazo minimo; acceso inmediato al capital.', TRUE),
    ('IF Mediano Plazo Soles FMIV', 'FONDO', 'MEDIO', 'Es nuestra alternativa moderada, en soles. Invierte en renta fija local e internacional, mayoritariamente en bonos y sin posicion en acciones.', 'Rentabilidad nominal a octubre 2025*: 5.33%. Registrate en ERNI y abrelo aqui.', 'Moneda: Soles. Portafolio de bonos locales e internacionales.', 'Mantener la inversion al menos 3 anos para buscar mejores rendimientos.', TRUE),
    ('FDF IF Real Estate Student Accommodation FMIV', 'FONDO', 'MEDIO', 'Es nuestra alternativa de inversion inmobiliaria enfocada en la renta estudiantil global. Busca generar ganancias por la revalorizacion de los inmuebles y los flujos constantes de renta.', 'Rentabilidad nominal a octubre 2025* (con dividendo): 4.83%. Registrate en ERNI y abrelo aqui.', 'Moneda: Dolares. Enfoque en renta estudiantil global.', 'Te sugerimos mantener la inversion al menos 3 anos.', TRUE),
    ('IF Futuro Seguro Dolares FMIV', 'FONDO', 'MEDIO', 'Es nuestra alternativa moderada, en dolares, que busca superar a las alternativas de jubilacion mediante una mezcla de renta fija y acciones globales.', 'Rentabilidad nominal a octubre 2025*: 10.74%. Registrate en ERNI y abrelo aqui.', 'Moneda: Dolares. Portafolio mixto orientado a jubilacion.', 'Te sugerimos mantener la inversion al menos 5 anos.', TRUE),
    ('IF Acciones FMIV', 'FONDO', 'ALTO', 'Es nuestra alternativa audaz, en soles. Invierte hasta un 100% en acciones de la bolsa peruana y asume riesgo alto para buscar valorizacion.', 'Rentabilidad nominal a octubre 2025*: 20.73%. Registrate en ERNI y abrelo aqui.', 'Moneda: Soles. Exposicion total a renta variable local.', 'Mantener la inversion al menos 5 anos para buscar mayores retornos.', TRUE),
    ('Seguro Vida Integral', 'SEGURO', NULL, 'Cobertura integral de vida y salud para adultos jovenes.', 'Telemedicina, asistencias y cobertura familiar.', 'Prima mensual desde S/ 120', 'Contratacion anual renovable', TRUE),
    ('Seguro Salud Familiar Plus', 'SEGURO', NULL, 'Cobertura hospitalaria y ambulatoria para todo el hogar.', 'Red de clinicas premium y telemedicina ilimitada.', 'Prima mensual desde S/ 180', 'Contrato anual renovable', TRUE),
    ('Seguro Auto Ejecutivo', 'SEGURO', NULL, 'Proteccion total para flotas de ejecutivos y gerentes.', 'Auto de reemplazo y asistencia en carretera 24/7.', 'Prima mensual desde S/ 220', 'Contrato anual renovable', TRUE),
    ('Seguro Hogar Premium', 'SEGURO', NULL, 'Cobertura contra incendios, robos y danos por agua.', 'Incluye asistencia de urgencia y monitoreo IoT.', 'Prima mensual desde S/ 95', 'Contrato anual renovable', TRUE),
    ('Seguro Cyber Empresas', 'SEGURO', NULL, 'Proteccion ante brechas de datos y ataques ransomware.', 'Respuesta forense, abogados y comunicacion de crisis.', 'Prima mensual desde S/ 600', 'Contrato anual renovable', TRUE);

INSERT INTO contratos (usuario_id, producto_id, monto_invertido) VALUES
    (1, 1, 12000.00),
    (1, 3, 8000.00),
    (2, 2, 15000.00);

INSERT INTO solicitudes_informacion (usuario_id, producto_id, mensaje) VALUES
    (1, 4, 'Quiero saber requisitos para asegurar a mi familia.'),
    (2, 1, U&'\00BFCu\00E1l es el monto m\00EDnimo para abrir este fondo?');
