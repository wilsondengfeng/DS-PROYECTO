package com.example.app.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
@AllArgsConstructor
public class ChatResponse {
    String respuesta;
}
