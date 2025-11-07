package com.example.app.producto.dto;

import com.example.app.producto.NivelRiesgo;
import com.example.app.producto.TipoProducto;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class ProductoResumenDTO {
    Long id;
    String nombre;
    TipoProducto tipo;
    NivelRiesgo riesgo;
    BigDecimal costo;
    BigDecimal rendimiento;
    String cobertura;
    String resumen;
    String documentoUrl;
}
