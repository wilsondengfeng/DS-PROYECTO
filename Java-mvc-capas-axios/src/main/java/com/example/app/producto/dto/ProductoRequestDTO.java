package com.example.app.producto.dto;

import com.example.app.producto.NivelRiesgo;
import com.example.app.producto.TipoProducto;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductoRequestDTO {
    @NotBlank
    @Size(max = 120)
    private String nombre;

    @NotNull
    private TipoProducto tipo;

    @NotBlank
    @Size(max = 200)
    private String descripcionCorta;

    @NotNull
    private NivelRiesgo riesgo;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal costo;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal rendimiento;

    @Size(max = 200)
    private String cobertura;

    @Size(max = 500)
    private String resumen;

    @Size(max = 500)
    private String beneficios;

    @Size(max = 500)
    private String exclusiones;

    @Size(max = 300)
    private String documentoUrl;
}
