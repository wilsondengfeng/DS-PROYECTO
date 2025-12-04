package com.example.app.contratos.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductoMetricDTO {
    private Long productoId;
    private String productoNombre;
    private String tipo;
    private Integer visitas;
    private BigDecimal totalContratado;
}
