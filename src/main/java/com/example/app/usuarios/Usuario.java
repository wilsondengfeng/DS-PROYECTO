package com.example.app.usuarios;

import com.example.app.usuarios.model.RolUsuario;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 20)
    private String login;

    @Column(nullable = false, length = 60)
    private String clave; // simple, en texto plano para el lab

    @Column(nullable = false, length = 120)
    private String email;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal saldoSol = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal saldoUsd = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RolUsuario rol;

    @Column(nullable = false)
    private boolean activo = true;
}
