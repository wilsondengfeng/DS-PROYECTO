package com.example.app.producto;

import com.example.app.producto.dto.ComparacionRequestDTO;
import com.example.app.producto.dto.ProductoDetalleDTO;
import com.example.app.producto.dto.ProductoResumenDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/clientes/productos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ClienteCatalogoController {

    private final ProductoService productoService;

    @GetMapping
    public List<ProductoResumenDTO> catalogo(@RequestParam(required = false) TipoProducto tipo,
                                             @RequestParam(required = false) NivelRiesgo riesgo,
                                             @RequestParam(required = false) BigDecimal costoMax,
                                             @RequestParam(required = false) BigDecimal rendimientoMin,
                                             @RequestParam(required = false) String cobertura) {
        return productoService.buscarCatalogo(tipo, riesgo, costoMax, rendimientoMin, cobertura);
    }

    @GetMapping("/{id}")
    public ProductoDetalleDTO detalle(@PathVariable Long id) {
        return productoService.obtenerDetalle(id);
    }

    @PostMapping("/comparar")
    public List<ProductoDetalleDTO> comparar(@Valid @RequestBody ComparacionRequestDTO requestDTO) {
        return productoService.comparar(Set.copyOf(requestDTO.getProductoIds()));
    }
}
