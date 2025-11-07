package com.example.app.seguridad;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String usuario;
    @NotBlank
    private String clave;
}
