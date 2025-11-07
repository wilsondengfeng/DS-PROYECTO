package com.example.app.producto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @Query("""
            SELECT p FROM Producto p
            WHERE (:tipo IS NULL OR p.tipo = :tipo)
              AND (:riesgo IS NULL OR p.riesgo = :riesgo)
              AND (:costoMax IS NULL OR p.costo <= :costoMax)
              AND (:rendimientoMin IS NULL OR p.rendimiento >= :rendimientoMin)
              AND (:cobertura IS NULL OR LOWER(p.cobertura) LIKE LOWER(CONCAT('%', :cobertura, '%')))
              AND p.activo = true
            """)
    List<Producto> filtrarCatalogo(@Param("tipo") TipoProducto tipo,
                                   @Param("riesgo") NivelRiesgo riesgo,
                                   @Param("costoMax") BigDecimal costoMax,
                                   @Param("rendimientoMin") BigDecimal rendimientoMin,
                                   @Param("cobertura") String cobertura);

    List<Producto> findAllByActivo(boolean activo);
}
