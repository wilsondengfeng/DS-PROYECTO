package com.example.app.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatRequest {
    @NotBlank(message = "El mensaje no puede ir vacio")
    private String mensaje;
    private Long usuarioId;
}
