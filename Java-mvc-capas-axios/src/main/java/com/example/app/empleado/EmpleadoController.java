package com.example.app.empleado;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empleados")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmpleadoController {

    private final EmpleadoService empleadoService;

    // GET - Obtener todos los empleados
    @GetMapping
    public ResponseEntity<List<EmpleadoDTO>> obtenerTodos() {
        List<EmpleadoDTO> empleados = empleadoService.obtenerTodos();
        return ResponseEntity.ok(empleados);
    }

    // GET - Obtener empleado por ID
    @GetMapping("/{id}")
    public ResponseEntity<EmpleadoDTO> obtenerPorId(@PathVariable Long id) {
        EmpleadoDTO empleado = empleadoService.obtenerPorId(id);
        return ResponseEntity.ok(empleado);
    }

    // POST - Crear nuevo empleado
    @PostMapping
    public ResponseEntity<EmpleadoDTO> crear(@Valid @RequestBody EmpleadoDTO empleadoDTO) {
        EmpleadoDTO nuevo = empleadoService.crear(empleadoDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
    }

    // PUT - Actualizar empleado
    @PutMapping("/{id}")
    public ResponseEntity<EmpleadoDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody EmpleadoDTO empleadoDTO) {
        EmpleadoDTO actualizado = empleadoService.actualizar(id, empleadoDTO);
        return ResponseEntity.ok(actualizado);
    }

    // DELETE - Eliminar empleado
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        empleadoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // GET - Buscar por nombre (o parte del nombre)
    @GetMapping("/buscar")
    public ResponseEntity<List<EmpleadoDTO>> buscarPorNombre(@RequestParam String nombre) {
        List<EmpleadoDTO> empleados = empleadoService.buscarPorNombre(nombre);
        return ResponseEntity.ok(empleados);
    }
}
