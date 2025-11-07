package com.example.app.producto;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "productos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoProducto tipo;

    @Column(nullable = false, length = 200)
    private String descripcionCorta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NivelRiesgo riesgo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costo;

    @Column(precision = 5, scale = 2)
    private BigDecimal rendimiento;

    @Column(length = 200)
    private String cobertura;

    @Column(length = 500)
    private String resumen;

    @Column(length = 500)
    private String beneficios;

    @Column(length = 500)
    private String exclusiones;

    @Column(length = 300)
    private String documentoUrl;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(nullable = false)
    private long vistas = 0;

    @Column(nullable = false)
    private long comparaciones = 0;

    @Column(nullable = false, name = "solicitudes_informacion")
    private long solicitudesInformacion = 0;

    public void registrarVista() {
        this.vistas += 1;
    }

    public void registrarComparacion() {
        this.comparaciones += 1;
    }

    public void registrarSolicitud() {
        this.solicitudesInformacion += 1;
    }
}
