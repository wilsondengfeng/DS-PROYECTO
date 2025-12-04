package com.example.app.contratos.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TipoMetricDTO {
    private String tipo;
    private BigDecimal totalContratado;
}
