package com.example.app.producto.dto;

import lombok.Value;

@Value
public class MetricasProductoDTO {
    Long productoId;
    long vistas;
    long comparaciones;
    long solicitudesInformacion;
}
