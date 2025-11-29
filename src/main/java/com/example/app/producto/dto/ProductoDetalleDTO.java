package com.example.app.producto.dto;

import com.example.app.producto.TipoProducto;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProductoDetalleDTO {
    Long id;
    String nombre;
    TipoProducto tipo;
    String moneda;
    String riesgo;
    String descripcion;
    String beneficio;
    String costo;
    String plazo;
    boolean activo;
}
