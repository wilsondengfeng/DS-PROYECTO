package com.example.app.producto;

import com.example.app.producto.dto.ProductoDetalleDTO;
import com.example.app.producto.dto.ProductoRequestDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/productos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProductoAdminController {

    private final ProductoAdminService adminService;

    @GetMapping
    public List<ProductoDetalleDTO> listar(@RequestParam(defaultValue = "false") boolean incluirInactivos) {
        return adminService.listar(incluirInactivos);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoDetalleDTO crear(@Valid @RequestBody ProductoRequestDTO dto) {
        return adminService.crear(dto);
    }

    @PutMapping("/{id}")
    public ProductoDetalleDTO actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequestDTO dto) {
        return adminService.actualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void retirar(@PathVariable Long id) {
        adminService.retirar(id);
    }
}
