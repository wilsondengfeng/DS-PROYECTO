-- ==========================
-- ESQUEMA DEL CONGLOMERADO FINANCIERO
-- ==========================

-- Crear la base de datos si no existe (ejecutar como superusuario)
-- CREATE DATABASE conglomerado_financiero;

-- Conectarse a la base de datos conglomerado_financiero antes de ejecutar el resto del script

DROP TABLE IF EXISTS movimientos;
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
    saldo_sol NUMERIC(15,2) NOT NULL DEFAULT 0,
    saldo_usd NUMERIC(15,2) NOT NULL DEFAULT 0,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    tipo VARCHAR(10) NOT NULL,
    moneda VARCHAR(10) NOT NULL DEFAULT 'SOL',
    riesgo VARCHAR(20),
    visitas INTEGER NOT NULL DEFAULT 0,
    descripcion VARCHAR(1000) NOT NULL,
    beneficio VARCHAR(1000),
    costo VARCHAR(200),
    plazo VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE movimientos (
    id SERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    producto_id BIGINT REFERENCES productos(id),
    tipo VARCHAR(20) NOT NULL,
    monto NUMERIC(15,2) NOT NULL,
    detalle VARCHAR(500),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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

INSERT INTO usuarios (nombre, login, clave, email, rol, saldo_sol, saldo_usd) VALUES
    ('Ana Inversionista', 'ana', '1234', 'ana@conglomerado.com', 'CLIENTE', 25000.00, 8000.00),
    ('Luis Emprendedor', 'luis', '1234', 'luis@conglomerado.com', 'CLIENTE', 15000.00, 5000.00),
    ('Equipo Corporativo', 'admin', 'admin', 'admin@conglomerado.com', 'ADMIN', 0.00, 0.00);

INSERT INTO productos (nombre, tipo, moneda, riesgo, descripcion, beneficio, costo, plazo, activo) VALUES
    ('IF Libre Disponibilidad Soles FMIV', 'FONDO', 'SOL', 'BAJO', 'Alternativa conservadora en soles. Invierte en renta fija.', 'Rentabilidad: 3.15% a 3.31%.', 'Moneda: Soles. Libre disponibilidad.', 'Sin plazo minimo.', TRUE),
    ('IF Mediano Plazo Soles FMIV', 'FONDO', 'SOL', 'MEDIO', 'Alternativa moderada en soles. Invierte en bonos.', 'Rentabilidad: 5.33%.', 'Moneda: Soles. Bonos locales e internacionales.', 'Minimo 3 anos.', TRUE),
    ('FDF IF Real Estate Student Accommodation FMIV', 'FONDO', 'USD', 'MEDIO', 'Inversion inmobiliaria en renta estudiantil global.', 'Rentabilidad: 4.83% con dividendo.', 'Moneda: Dolares. Inmuebles para estudiantes.', 'Minimo 3 anos.', TRUE),
    ('IF Futuro Seguro Dolares FMIV', 'FONDO', 'USD', 'MEDIO', 'Alternativa moderada en dolares. Mezcla de renta fija y acciones.', 'Rentabilidad: 10.74%.', 'Moneda: Dolares. Portafolio mixto.', 'Minimo 5 anos.', TRUE),
    ('IF Acciones FMIV', 'FONDO', 'SOL', 'ALTO', 'Alternativa audaz en soles. Invierte en acciones de bolsa peruana.', 'Rentabilidad: 20.73%.', 'Moneda: Soles. Acciones locales.', 'Minimo 5 anos.', TRUE),
    ('Seguro Vehicular', 'SEGURO', 'SOL', NULL, 'Cobertura integral del vehiculo. Protege contra colisiones, robo, danos y desastres naturales. Incluye responsabilidad civil.', 'Auxiliar mecanico 24/7, remolque y taller de confianza.', 'Desde S/ 60 mensuales.', 'Poliza anual renovable.', TRUE),
    ('SOAT', 'SEGURO', 'SOL', NULL, 'Seguro obligatorio para accidentes de transito. Cubre gastos medicos de terceros.', 'Indemnizacion por gastos medicos. Atencion en emergencia.', 'Desde S/ 55 a S/ 120.', 'Vigencia anual.', TRUE),
    ('Seguro de Salud Completo', 'SEGURO', 'SOL', NULL, 'Plan integral de salud. Cobertura hospitalaria, ambulatoria, maternidad y odontologia.', 'Consultas ilimitadas. Medicinas al 100% en red. Emergencia 24/7.', 'Desde S/ 280 mensual.', 'Vigencia anual renovable.', TRUE),
    ('Seguro de Vida', 'SEGURO', 'SOL', NULL, 'Proteccion ante fallecimiento e invalidez permanente. Suma asegurada flexible.', 'Indemnizacion por muerte. Cobertura de invalidez. Asistencia funeraria.', 'Desde S/ 95 mensual.', 'Poliza flexible 5 a 30 anos.', TRUE);

INSERT INTO contratos (usuario_id, producto_id, monto_invertido) VALUES
    (1, 1, 12000.00),
    (1, 3, 8000.00),
    (2, 2, 15000.00);

INSERT INTO solicitudes_informacion (usuario_id, producto_id, mensaje) VALUES
    (1, 4, 'Quiero saber requisitos para asegurar a mi familia.'),
    (2, 1, 'Cual es el monto minimo para abrir este fondo?');
