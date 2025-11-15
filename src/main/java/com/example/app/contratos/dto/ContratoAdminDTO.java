package com.example.app.contratos.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class ContratoAdminDTO {
    Long id;
    Long usuarioId;
    String usuarioNombre;
    String usuarioEmail;
    Long productoId;
    String productoNombre;
    String tipo;
    String riesgo;
    String costo;
    BigDecimal montoInvertido;
    LocalDateTime creadoEn;
}
