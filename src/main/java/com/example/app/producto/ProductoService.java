package com.example.app.producto;

import com.example.app.common.exception.ResourceNotFoundException;
import com.example.app.producto.dto.ProductoDetalleDTO;
import com.example.app.producto.dto.ProductoResumenDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;

    @Transactional(readOnly = true)
    public List<ProductoResumenDTO> buscarCatalogo(TipoProducto tipo,
                                                   String texto,
                                                   boolean soloActivos) {
        String filtro = (texto == null || texto.isBlank()) ? null : texto.toLowerCase();
        return productoRepository
                .buscarCatalogo(tipo, soloActivos, filtro)
                .stream()
                .map(this::toResumen)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductoDetalleDTO obtenerDetalle(Long id) {
        Producto producto = productoRepository.findById(id)
                .filter(Producto::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
        return toDetalle(producto);
    }

    @Transactional
    public List<ProductoDetalleDTO> comparar(Set<Long> ids) {
        if (ids.size() < 2) {
            throw new IllegalArgumentException("Se requieren al menos dos productos para comparar");
        }
        List<Producto> productos = productoRepository.findAllById(ids);
        if (productos.size() != ids.size() || productos.stream().anyMatch(p -> !p.isActivo())) {
            throw new ResourceNotFoundException("Algún producto no existe o fue retirado");
        }
        TipoProducto tipo = productos.get(0).getTipo();
        if (productos.stream().anyMatch(p -> p.getTipo() != tipo)) {
            throw new IllegalArgumentException("Solo se pueden comparar productos del mismo tipo");
        }
        return productos.stream().map(this::toDetalle).collect(Collectors.toList());
    }

    public ProductoResumenDTO toResumen(Producto producto) {
        ProductoResumenDTO dto = new ProductoResumenDTO();
        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setTipo(producto.getTipo());
        dto.setMoneda(producto.getMoneda());
        dto.setRiesgo(producto.getRiesgo());
        dto.setResumen(producto.getDescripcion());
        dto.setDescripcion(producto.getDescripcion());
        dto.setBeneficio(producto.getBeneficio());
        dto.setCosto(producto.getCosto());
        dto.setPlazo(producto.getPlazo());
        dto.setActivo(producto.isActivo());
        return dto;
    }

    public ProductoDetalleDTO toDetalle(Producto producto) {
        return ProductoDetalleDTO.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .tipo(producto.getTipo())
                .moneda(producto.getMoneda())
                .riesgo(producto.getRiesgo())
                .descripcion(producto.getDescripcion())
                .beneficio(producto.getBeneficio())
                .costo(producto.getCosto())
                .plazo(producto.getPlazo())
                .activo(producto.isActivo())
                .build();
    }
}
