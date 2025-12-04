package com.example.app.solicitudes.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SolicitudInformacionAdminDTO {
    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioEmail;
    private Long productoId;
    private String productoNombre;
    private String mensaje;
    private LocalDateTime creadoEn;
}
