package com.example.app.producto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @Query("""
            SELECT p FROM Producto p
            WHERE (:tipo IS NULL OR p.tipo = :tipo)
              AND (:soloActivos = false OR p.activo = true)
              AND (
                    :texto IS NULL
                    OR LOWER(p.nombre) LIKE %:texto%
                    OR LOWER(p.descripcion) LIKE %:texto%
                    OR LOWER(p.beneficio) LIKE %:texto%
                  )
            ORDER BY p.nombre
            """)
    List<Producto> buscarCatalogo(@Param("tipo") TipoProducto tipo,
                                  @Param("soloActivos") boolean soloActivos,
                                  @Param("texto") String texto);

    List<Producto> findAllByActivo(boolean activo);
}

