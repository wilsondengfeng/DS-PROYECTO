package com.example.app.producto;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(length = 20)
    private String riesgo;

    @Column(nullable = false, length = 500)
    private String descripcion;

    @Column(length = 500)
    private String beneficio;

    @Column(length = 100)
    private String costo;

    @Column(length = 100)
    private String plazo;

    @Column(nullable = false)
    private boolean activo = true;
}
