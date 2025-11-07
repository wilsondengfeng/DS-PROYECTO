package com.example.app.producto;

import com.example.app.common.exception.ResourceNotFoundException;
import com.example.app.producto.dto.MetricasProductoDTO;
import com.example.app.producto.dto.ProductoDetalleDTO;
import com.example.app.producto.dto.ProductoRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    @Transactional(readOnly = true)
    public MetricasProductoDTO metricas(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
        return new MetricasProductoDTO(
                producto.getId(),
                producto.getVistas(),
                producto.getComparaciones(),
                producto.getSolicitudesInformacion()
        );
    }

    private void aplicarCambios(Producto producto, ProductoRequestDTO dto) {
        producto.setNombre(dto.getNombre());
        producto.setTipo(dto.getTipo());
        producto.setDescripcionCorta(dto.getDescripcionCorta());
        producto.setRiesgo(dto.getRiesgo());
        producto.setCosto(dto.getCosto());
        producto.setRendimiento(dto.getRendimiento());
        producto.setCobertura(dto.getCobertura());
        producto.setResumen(dto.getResumen());
        producto.setBeneficios(dto.getBeneficios());
        producto.setExclusiones(dto.getExclusiones());
        producto.setDocumentoUrl(dto.getDocumentoUrl());
        if (producto.getId() == null) {
            producto.setActivo(true);
            producto.setVistas(0);
            producto.setComparaciones(0);
            producto.setSolicitudesInformacion(0);
        }
    }
}
