package com.example.app.movimientos.dto;

import com.example.app.movimientos.MovimientoTipo;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class MovimientoDTO {
    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private Long productoId;
    private String productoNombre;
    private MovimientoTipo tipo;
    private BigDecimal monto;
    private String detalle;
    private LocalDateTime creadoEn;
}
