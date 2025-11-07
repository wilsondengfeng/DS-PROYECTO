package com.example.app.empleado;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {

    // Buscar por nombre (ignora mayúsculas/minúsculas)
    List<Empleado> findByNombreContainingIgnoreCase(String nombre);

    // Buscar por cargo (opcional)
    List<Empleado> findByCargoContainingIgnoreCase(String cargo);

    // Buscar empleados con salario mayor a cierto monto (opcional)
    List<Empleado> findBySalarioGreaterThan(BigDecimal salario);
}
