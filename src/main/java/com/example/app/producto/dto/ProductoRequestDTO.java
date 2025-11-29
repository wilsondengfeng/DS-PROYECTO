package com.example.app.producto.dto;

import com.example.app.producto.TipoProducto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductoRequestDTO {
    @NotBlank
    @Size(max = 120)
    private String nombre;

    @NotNull
    private TipoProducto tipo;

    @NotBlank
    @Size(max = 500)
    private String descripcion;

    @NotBlank
    @Size(max = 10)
    private String moneda;

    @Size(max = 500)
    private String beneficio;

    @Size(max = 100)
    private String costo;

    @Size(max = 100)
    private String plazo;

    @Size(max = 20)
    private String riesgo;

    private Boolean activo;
}
