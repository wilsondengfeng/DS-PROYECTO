# Proyecto Diseño de Software

Aplicacion full-stack con Spring Boot (Java 17) y frontend HTML/JS/CSS.

## Prerrequisitos
- Java 17+
- Maven 3.9+
- Docker + Docker Compose 

## Configuracion
- Base de datos: Postgres (ver `src/main/resources/application-postgres.properties`).
- Seed opcional: `db.sql`.
- Clave OpenAI: variable de entorno `OPENAI_API_KEY`.

## Ejecutar (Docker)
1. Exporta la clave: `$env:OPENAI_API_KEY="tu_clave"` (PowerShell) o usa `.env` con `OPENAI_API_KEY=tu_clave`.
2. Levanta: `docker compose up --build -d`.
3. App en `http://localhost:8081`.

## Ejecutar (local)
1. Configura Postgres y credenciales en `application-postgres.properties` o `application.properties`.
2. (Opcional) importa `db.sql`.
3. `mvn spring-boot:run` (perfil activo por defecto: `postgres`).

## Endpoints clave
- Backend: `src/main/java/com/example/app`.
- Chatbot: `POST /api/chatbot` (usa `OPENAI_API_KEY`).
- Frontend: `src/main/resources/static` (`index.html`, `cliente.html`, etc.).

## Scripts utiles
- Compilar sin tests: `mvn -q -DskipTests compile`.
- Paquete: `mvn -q -DskipTests package`.
- Logs contenedor app: `docker compose logs -f app`.

## Notas
- Usa ASCII en textos para evitar problemas de codificacion en el UI.
- No commitear claves; usa variables de entorno.
