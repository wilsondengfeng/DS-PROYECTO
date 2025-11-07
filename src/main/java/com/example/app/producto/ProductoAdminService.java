package com.example.app.producto;

import com.example.app.common.exception.ResourceNotFoundException;
import com.example.app.producto.dto.ProductoDetalleDTO;
import com.example.app.producto.dto.ProductoRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoAdminService {

    private final ProductoRepository productoRepository;
    private final ProductoService productoService;

    @Transactional(readOnly = true)
    public List<ProductoDetalleDTO> listar(boolean incluirInactivos) {
        List<Producto> productos = incluirInactivos
                ? productoRepository.findAll()
                : productoRepository.findAllByActivo(true);
        return productos.stream()
                .map(productoService::toDetalle)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductoDetalleDTO crear(ProductoRequestDTO dto) {
        Producto producto = new Producto();
        aplicarCambios(producto, dto);
        return productoService.toDetalle(productoRepository.save(producto));
    }

    @Transactional(readOnly = true)
    public ProductoDetalleDTO obtener(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
        return productoService.toDetalle(producto);
    }

    @Transactional
    public ProductoDetalleDTO actualizar(Long id, ProductoRequestDTO dto) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
        aplicarCambios(producto, dto);
        return productoService.toDetalle(productoRepository.save(producto));
    }

    @Transactional
    public void retirar(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    private void aplicarCambios(Producto producto, ProductoRequestDTO dto) {
        producto.setNombre(dto.getNombre());
        producto.setTipo(dto.getTipo());
        producto.setDescripcion(dto.getDescripcion());
        producto.setBeneficio(dto.getBeneficio());
        producto.setCosto(dto.getCosto());
        producto.setPlazo(dto.getPlazo());
        if (dto.getTipo() == TipoProducto.FONDO) {
            producto.setRiesgo(normalizarRiesgo(dto.getRiesgo()));
        } else {
            producto.setRiesgo(null);
        }
        if (dto.getActivo() != null) {
            producto.setActivo(dto.getActivo());
        } else if (producto.getId() == null) {
            producto.setActivo(true);
        }
    }

    private String normalizarRiesgo(String riesgo) {
        if (riesgo == null) {
            return null;
        }
        String valor = riesgo.trim().toUpperCase();
        Set<String> permitidos = Set.of("BAJO", "MEDIO", "ALTO");
        return permitidos.contains(valor) ? valor : null;
    }
}
