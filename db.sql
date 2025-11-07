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

INSERT INTO productos (nombre, tipo, riesgo, descripcion, beneficio, costo, plazo, activo) VALUES
    ('Fondo Crecimiento Joven', 'FONDO', 'BAJO', 'Fondo mutuo diversificado para primeras inversiones con aportes accesibles.', U&'Acompa\00F1amiento digital y rebalanceo autom\00E1tico.', 'Aporte mensual desde S/ 150', U&'Plazo sugerido: 3 a 5 a\00F1os', TRUE),
    ('Fondo Patrimonial Plus', 'FONDO', 'BAJO', U&'Portafolio conservador orientado a metas familiares y preservaci\00F3n de capital.', U&'Asesor\00EDa personalizada y reinversi\00F3n de dividendos.', 'Aporte mensual desde S/ 300', U&'Plazo sugerido: 5 a\00F1os a m\00E1s', TRUE),
    ('Fondo Liquidez Empresarial', 'FONDO', 'BAJO', U&'Liquidez diaria dise\00F1ada para tesorer\00EDas corporativas.', 'Retiros ilimitados sin penalidad.', U&'Aporte m\00EDnimo desde S/ 5,000', U&'Disponible a 30 d\00EDas renovables', TRUE),
    ('Fondo Infraestructura Andina', 'FONDO', 'MEDIO', U&'Veh\00EDculo de inversi\00F3n en proyectos de energ\00EDa y transporte.', U&'Ingresos recurrentes indexados al IPC.', 'Aporte desde S/ 25,000', U&'Plazo sugerido: 7 a 12 a\00F1os', TRUE),
    ('Fondo Tech Disruptivo', 'FONDO', 'ALTO', U&'Exposici\00F3n a startups latinoamericanas en etapa growth.', U&'Potencial alto de valorizaci\00F3n.', 'Aporte mensual desde S/ 500', U&'Plazo sugerido: 5 a\00F1os', TRUE),
    (U&'Fondo Dividendos S\00F3lidos', 'FONDO', 'BAJO', U&'Portafolio de acciones defensivas con pago trimestral asegurado.', U&'Flujo constante para metas de ingreso pasivo.', 'Aporte desde S/ 1,000', U&'Plazo sugerido: 4 a\00F1os', TRUE),
    ('Fondo Horizonte Verde', 'FONDO', 'MEDIO', U&'Inversi\00F3n ESG en bonos verdes y proyectos de impacto.', U&'Certificaciones ambientales y reporte trimestral.', 'Aporte desde S/ 800', U&'Plazo sugerido: 6 a 10 a\00F1os', TRUE),
    (U&'Fondo Multiactivo Din\00E1mico', 'FONDO', 'MEDIO', U&'Estrategia balanceada que rota entre renta fija y variable.', U&'Reducci\00F3n de volatilidad con coberturas activas.', 'Aporte desde S/ 2,000', U&'Horizonte recomendado: 3 a\00F1os', TRUE),
    ('Fondo Pymes Regional', 'FONDO', 'ALTO', U&'Apoyo a cadenas productivas de PYMES exportadoras.', U&'Participaci\00F3n en utilidades y acompa\00F1amiento financiero.', 'Ticket desde S/ 4,000', U&'Plazo sugerido: 2 a 6 a\00F1os', TRUE),
    (U&'Fondo Visi\00F3n Global', 'FONDO', 'MEDIO', U&'\00CDndice global diversificado con cobertura cambiaria.', U&'Acceso a 15 pa\00EDses desde una sola cuenta.', 'Aporte mensual desde S/ 250', U&'Plazo sugerido: 5 a\00F1os o m\00E1s', TRUE),
    ('Seguro Vida Integral', 'SEGURO', NULL, U&'Cobertura integral de vida y salud para adultos j\00F3venes.', 'Telemedicina, asistencias y cobertura familiar.', 'Prima mensual desde S/ 120', U&'Contrataci\00F3n anual renovable', TRUE),
    (U&'Seguro Aut\00F3nomos Protegidos', 'SEGURO', NULL, U&'Protecci\00F3n flexible para independientes con foco en accidentes.', U&'Reembolsos \00E1giles y asistencias 24/7.', 'Prima mensual desde S/ 160', U&'Contrataci\00F3n anual renovable', TRUE),
    (U&'Seguro Salud Familiar Plus', 'SEGURO', NULL, U&'Cobertura integral hospitalaria y ambulatoria para todo el hogar.', U&'Red de cl\00EDnicas premium y telemedicina ilimitada.', 'Prima mensual desde S/ 180', 'Contrato anual renovable', TRUE),
    ('Seguro Auto Ejecutivo', 'SEGURO', NULL, U&'Protecci\00F3n total para flotas de ejecutivos y gerentes.', U&'Auto de reemplazo y asistencia en carretera 24/7.', 'Prima mensual desde S/ 220', 'Contrato anual renovable', TRUE),
    ('Seguro Hogar Premium', 'SEGURO', NULL, U&'Cobertura contra incendios, robos y da\00F1os por agua.', U&'Incluye asistencia de urgencia y monitoreo IoT.', 'Prima mensual desde S/ 95', 'Contrato anual renovable', TRUE),
    (U&'Seguro Educaci\00F3n Segura', 'SEGURO', NULL, U&'Plan de estudio garantizado para hijos desde inicial hasta universidad.', U&'Fondo educacional liberado ante siniestros del titular.', 'Prima mensual desde S/ 150', U&'Plazo flexible: 5 a 18 a\00F1os', TRUE),
    ('Seguro Viaje Corporativo', 'SEGURO', NULL, U&'Cobertura mundial para misiones comerciales y eventos.', U&'Incluye cancelaci\00F3n, asistencia m\00E9dica y evacuaci\00F3n.', 'Prima anual desde S/ 1,200', 'Cobertura por viaje o anual', TRUE),
    ('Seguro Cyber Empresas', 'SEGURO', NULL, U&'Protecci\00F3n ante brechas de datos y ataques ransomware.', U&'Respuesta forense, abogados y comunicaci\00F3n de crisis.', 'Prima mensual desde S/ 600', 'Contrato anual renovable', TRUE),
    (U&'Seguro Renta Hospitalaria', 'SEGURO', NULL, U&'Indemnizaci\00F3n diaria por hospitalizaci\00F3n prolongada.', U&'Dep\00F3sito directo al beneficiario en 24 horas.', 'Prima mensual desde S/ 70', 'Contrato anual renovable', TRUE),
    (U&'Seguro Mascotas Total', 'SEGURO', NULL, U&'Cobertura veterinaria para perros y gatos de todas las razas.', U&'Consultas ilimitadas, vacunas y responsabilidad civil.', 'Prima mensual desde S/ 55', 'Contrato anual renovable', TRUE);

INSERT INTO contratos (usuario_id, producto_id) VALUES
    (1, 1),
    (1, 3),
    (2, 2);

INSERT INTO solicitudes_informacion (usuario_id, producto_id, mensaje) VALUES
    (1, 4, 'Quiero saber requisitos para asegurar a mi familia.'),
    (2, 1, U&'\00BFCu\00E1l es el monto m\00EDnimo para abrir este fondo?');
