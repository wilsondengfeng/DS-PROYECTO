package com.example.app.movimientos;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {
    List<Movimiento> findByUsuarioIdOrderByCreadoEnDesc(Long usuarioId);
}
