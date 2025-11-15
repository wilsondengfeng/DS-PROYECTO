package com.example.app.contratos;

import com.example.app.producto.Producto;
import com.example.app.usuarios.Usuario;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "contratos")
@Data
@NoArgsConstructor
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Column(name = "monto_invertido", nullable = false, precision = 15, scale = 2)
    private BigDecimal montoInvertido;

    @Column(nullable = false)
    private LocalDateTime creadoEn = LocalDateTime.now();
}
