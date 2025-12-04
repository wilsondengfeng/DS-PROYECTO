package com.example.app.producto.dto;

import com.example.app.producto.TipoProducto;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductoResumenDTO {
    private Long id;
    private String nombre;
    private TipoProducto tipo;
    private String moneda;
    private String riesgo;
    private String resumen;
    private String descripcion;
    private String beneficio;
    private String costo;
    private String plazo;
    private boolean activo;
    private BigDecimal montoInvertido;
    private Integer visitas;
}
