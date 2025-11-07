package com.example.app.producto.dto;

import com.example.app.producto.NivelRiesgo;
import com.example.app.producto.TipoProducto;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class ProductoDetalleDTO {
    Long id;
    String nombre;
    TipoProducto tipo;
    String descripcionCorta;
    NivelRiesgo riesgo;
    BigDecimal costo;
    BigDecimal rendimiento;
    String cobertura;
    String resumen;
    String beneficios;
    String exclusiones;
    String documentoUrl;
    boolean activo;
    long vistas;
    long comparaciones;
    long solicitudesInformacion;
}
