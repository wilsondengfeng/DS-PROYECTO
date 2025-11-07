package com.example.app.empleado;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmpleadoService {

    private final EmpleadoRepository repo;

    // 🔹 Obtener todos los empleados
    public List<EmpleadoDTO> obtenerTodos() {
        return repo.findAll()
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    // 🔹 Obtener un empleado por ID
    public EmpleadoDTO obtenerPorId(Long id) {
        Empleado emp = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        return convertirADTO(emp);
    }

    // 🔹 Crear nuevo empleado
    public EmpleadoDTO crear(EmpleadoDTO dto) {
        Empleado nuevo = convertirAEntidad(dto);
        Empleado guardado = repo.save(nuevo);
        return convertirADTO(guardado);
    }

    // 🔹 Actualizar un empleado existente
    public EmpleadoDTO actualizar(Long id, EmpleadoDTO dto) {
        Empleado emp = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        emp.setNombre(dto.getNombre());
        emp.setApellido(dto.getApellido());
        emp.setEmail(dto.getEmail());
        emp.setTelefono(dto.getTelefono());
        emp.setFechaContratacion(dto.getFechaContratacion());
        emp.setSalario(dto.getSalario());
        emp.setCargo(dto.getCargo());
        emp.setDepartamentoId(dto.getDepartamentoId());

        return convertirADTO(repo.save(emp));
    }

    // 🔹 Eliminar empleado
    public void eliminar(Long id) {
        repo.deleteById(id);
    }

    // 🔹 Buscar por nombre (ignora mayúsculas/minúsculas)
    public List<EmpleadoDTO> buscarPorNombre(String nombre) {
        return repo.findByNombreContainingIgnoreCase(nombre)
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    // 🔹 Conversión Entidad → DTO
    private EmpleadoDTO convertirADTO(Empleado e) {
        return new EmpleadoDTO(
                e.getId(),
                e.getNombre(),
                e.getApellido(),
                e.getEmail(),
                e.getTelefono(),
                e.getFechaContratacion(),
                e.getSalario(),
                e.getCargo(),
                e.getDepartamentoId()
        );
    }

    // 🔹 Conversión DTO → Entidad
    private Empleado convertirAEntidad(EmpleadoDTO dto) {
        Empleado e = new Empleado();
        e.setId(dto.getId());
        e.setNombre(dto.getNombre());
        e.setApellido(dto.getApellido());
        e.setEmail(dto.getEmail());
        e.setTelefono(dto.getTelefono());
        e.setFechaContratacion(dto.getFechaContratacion());
        e.setSalario(dto.getSalario());
        e.setCargo(dto.getCargo());
        e.setDepartamentoId(dto.getDepartamentoId());
        return e;
    }
}
