package com.example.app.solicitudes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SolicitudInformacionRequestDTO {
    @NotNull
    private Long productoId;

    @NotBlank
    private String mensaje;
}
