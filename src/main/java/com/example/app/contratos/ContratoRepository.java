package com.example.app.contratos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {
    List<Contrato> findByUsuarioId(Long usuarioId);

    boolean existsByUsuarioIdAndProductoId(Long usuarioId, Long productoId);

    Optional<Contrato> findByUsuarioIdAndProductoId(Long usuarioId, Long productoId);

    void deleteByUsuarioIdAndProductoId(Long usuarioId, Long productoId);

    @Query("SELECT c.producto.id, SUM(c.montoInvertido) FROM Contrato c GROUP BY c.producto.id")
    List<Object[]> sumarPorProducto();

    @Query("SELECT c.producto.tipo, SUM(c.montoInvertido) FROM Contrato c GROUP BY c.producto.tipo")
    List<Object[]> sumarPorTipo();
}
