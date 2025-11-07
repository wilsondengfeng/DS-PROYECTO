package com.example.app.producto;

import com.example.app.common.exception.ResourceNotFoundException;
import com.example.app.producto.dto.ProductoDetalleDTO;
import com.example.app.producto.dto.ProductoResumenDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;

    @Transactional(readOnly = true)
    public List<ProductoResumenDTO> buscarCatalogo(TipoProducto tipo,
                                                   NivelRiesgo riesgo,
                                                   BigDecimal costoMax,
                                                   BigDecimal rendimientoMin,
                                                   String cobertura) {
        return productoRepository
                .filtrarCatalogo(tipo, riesgo, costoMax, rendimientoMin, cobertura)
                .stream()
                .map(this::toResumen)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductoDetalleDTO obtenerDetalle(Long id) {
        Producto producto = productoRepository.findById(id)
                .filter(Producto::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
        producto.registrarVista();
        return toDetalle(productoRepository.save(producto));
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
        productos.stream().filter(Producto::isActivo).forEach(Producto::registrarComparacion);
        productoRepository.saveAll(productos);
        return productos.stream().map(this::toDetalle).collect(Collectors.toList());
    }

    public ProductoResumenDTO toResumen(Producto producto) {
        return ProductoResumenDTO.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .tipo(producto.getTipo())
                .riesgo(producto.getRiesgo())
                .costo(producto.getCosto())
                .rendimiento(producto.getRendimiento())
                .cobertura(producto.getCobertura())
                .resumen(producto.getResumen())
                .documentoUrl(producto.getDocumentoUrl())
                .build();
    }

    public ProductoDetalleDTO toDetalle(Producto producto) {
        return ProductoDetalleDTO.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .tipo(producto.getTipo())
                .descripcionCorta(producto.getDescripcionCorta())
                .riesgo(producto.getRiesgo())
                .costo(producto.getCosto())
                .rendimiento(producto.getRendimiento())
                .cobertura(producto.getCobertura())
                .resumen(producto.getResumen())
                .beneficios(producto.getBeneficios())
                .exclusiones(producto.getExclusiones())
                .documentoUrl(producto.getDocumentoUrl())
                .activo(producto.isActivo())
                .vistas(producto.getVistas())
                .comparaciones(producto.getComparaciones())
                .solicitudesInformacion(producto.getSolicitudesInformacion())
                .build();
    }
}
