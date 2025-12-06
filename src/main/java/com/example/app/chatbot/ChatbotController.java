package com.example.app.chatbot;

import com.example.app.chatbot.dto.ChatRequest;
import com.example.app.chatbot.dto.ChatResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private static final Logger log = LoggerFactory.getLogger(ChatbotController.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${OPENAI_API_KEY:}")
    private String openAiApiKey;

    private static final String OPENAI_MODEL = "gpt-5-mini";
    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String SYSTEM_PROMPT = """
            Hola, soy tu asesor virtual Wilson del Conglomerado Financiero. Te voy a ayudar a escoger fondos o seguros segun tu perfil. Responde en espanol, breve y claro. Nunca inventes productos fuera del catalogo y usa los nombres exactos.
            
            Catalogo de FONDOS (usa riesgo/moneda):
            - FDF IF Inversion EE.UU. FMIV (FONDO, USD, ALTO): renta variable USA, horizonte 3+ anos.
            - IF Mediano Plazo Soles FMIV (FONDO, SOL, MEDIO): renta fija local/internacional, horizonte 2+ anos.
            - IF Mediano Plazo FMIV (FONDO, USD, MEDIO): renta fija global en USD, horizonte 2+ anos.
            - IF Libre Disponibilidad Soles FMIV (FONDO, SOL, BAJO): deposito/plazo y bonos en soles, liquidez inmediata.
            - IF Enfoque Latam FMIV (FONDO, USD, ALTO): bonos Latam, horizonte 2+ anos.
            
            Catalogo de SEGUROS:
            - Seguro Vehicular (SOL): cobertura integral auto, desde S/ 60 mensual, poliza anual.
            - SOAT (SOL): obligatorio transito, desde S/ 55-120, vigencia anual.
            - Seguro de Salud Completo (SOL): hospitalaria/ambulatoria/maternidad/odontologia, desde S/ 280 mensual.
            - Seguro de Vida (SOL): fallecimiento/invalidez, desde S/ 95 mensual, poliza 5-30 anos.
            
            Flujos:
            - Fondos: pide perfil de riesgo (bajo/medio/alto) y moneda (soles/dolares); sugiere hasta 3 fondos ordenados por ajuste al perfil.
            - Seguros Vida/Salud: pide edad y si busca individual/familiar; sugiere max 2 opciones.
            - Vehicular/SOAT: pide modelo y anio del auto; si falta, solicita esos datos y menciona que SOAT es anual.
            
            Responde con: (a) aclaracion breve si falta un dato clave, o (b) lista de hasta 3 sugerencias con nombre exacto y tipo, mas 1 linea de beneficio/costo. No repitas textos ni hagas parrafos largos.
            """;

    @PostMapping
    public ResponseEntity<ChatResponse> responder(@Valid @RequestBody ChatRequest request) {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "API key de OpenAI no configurada");
        }

        String prompt = request.getMensaje() == null ? "" : request.getMensaje().trim();
        if (prompt.isBlank()) {
            return ResponseEntity.ok(ChatResponse.builder()
                    .respuesta("Necesito un mensaje para poder ayudarte.")
                    .build());
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiApiKey);

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", OPENAI_MODEL);
            payload.put("messages", List.of(
                    Map.of("role", "system", "content", SYSTEM_PROMPT),
                    Map.of("role", "user", "content", prompt)
            ));
            payload.put("stream", false);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            Map<String, Object> response = restTemplate.exchange(OPENAI_URL, HttpMethod.POST, entity, Map.class).getBody();

            String contenido = extraerContenido(response);
            if (contenido == null || contenido.isBlank()) {
                contenido = fallback(prompt);
            }
            return ResponseEntity.ok(ChatResponse.builder().respuesta(contenido).build());
        } catch (RestClientException ex) {
            log.warn("Error al invocar OpenAI: {}", ex.getMessage());
            String contenido = fallback(prompt);
            return ResponseEntity.ok(ChatResponse.builder().respuesta(contenido).build());
        }
    }

    @SuppressWarnings("unchecked")
    private String extraerContenido(Map<String, Object> response) {
        if (response == null) return null;
        Object choices = response.get("choices");
        if (choices instanceof List<?> lista && !lista.isEmpty()) {
            Object first = lista.get(0);
            if (first instanceof Map<?, ?> choice) {
                Object message = choice.get("message");
                if (message instanceof Map<?, ?> msg) {
                    Object content = msg.get("content");
                    if (content != null) {
                        return String.valueOf(content);
                    }
                }
                Object contentAlt = choice.get("content");
                if (contentAlt != null) {
                    return String.valueOf(contentAlt);
                }
            }
        }
        Object content = response.get("content");
        return content != null ? String.valueOf(content) : null;
    }

    private String fallback(String prompt) {
        String lower = prompt.toLowerCase();
        if (lower.contains("vehic") || lower.contains("auto") || lower.contains("soat")) {
            return "Puedo cotizar tu seguro vehicular/SOAT: dime modelo y anio de tu auto y te doy la prima estimada.";
        }
        if (lower.contains("vida") || lower.contains("salud")) {
            return "Para Vida/Salud: dime tu edad y si buscas cobertura individual o familiar, y te sugiero 1-2 opciones.";
        }
        if (lower.contains("fondo") || lower.contains("invers") || lower.contains("riesgo")) {
            return "Para fondos: indica moneda (soles/dolares) y tu perfil de riesgo (bajo/medio/alto) y te recomiendo hasta 3 fondos.";
        }
        return "Buscas un fondo (riesgo/moneda) o un seguro (Vida/Salud o Vehicular/SOAT)? Dame ese dato y te sugiero opciones.";
    }
}
