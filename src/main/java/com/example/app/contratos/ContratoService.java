package com.example.app.contratos;

import com.example.app.common.exception.ResourceNotFoundException;
import com.example.app.contratos.dto.ContratoAdminDTO;
import com.example.app.producto.Producto;
import com.example.app.producto.ProductoRepository;
import com.example.app.producto.ProductoService;
import com.example.app.producto.dto.ProductoResumenDTO;
import com.example.app.usuarios.Usuario;
import com.example.app.usuarios.UsuarioRepository;
import com.example.app.usuarios.model.RolUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContratoService {

    private final ContratoRepository contratoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final ProductoService productoService;

    @Transactional(readOnly = true)
    public List<ProductoResumenDTO> listar(Long usuarioId) {
        validarCliente(usuarioId);
        return contratoRepository.findByUsuarioId(usuarioId).stream()
                .map(Contrato::getProducto)
                .filter(Producto::isActivo)
                .map(productoService::toResumen)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContratoAdminDTO> listarTodos() {
        return contratoRepository.findAll().stream()
                .map(contrato -> ContratoAdminDTO.builder()
                        .id(contrato.getId())
                        .usuarioId(contrato.getUsuario().getId())
                        .usuarioNombre(contrato.getUsuario().getNombre())
                        .usuarioEmail(contrato.getUsuario().getEmail())
                        .productoId(contrato.getProducto().getId())
                        .productoNombre(contrato.getProducto().getNombre())
                        .tipo(contrato.getProducto().getTipo().name())
                        .riesgo(contrato.getProducto().getRiesgo())
                        .costo(contrato.getProducto().getCosto())
                        .creadoEn(contrato.getCreadoEn())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void contratar(Long usuarioId, Long productoId) {
        Usuario usuario = validarCliente(usuarioId);
        Producto producto = productoRepository.findById(productoId)
                .filter(Producto::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no disponible"));
        if (contratoRepository.existsByUsuarioIdAndProductoId(usuarioId, productoId)) {
            return;
        }
        Contrato contrato = new Contrato();
        contrato.setUsuario(usuario);
        contrato.setProducto(producto);
        contratoRepository.save(contrato);
    }

    @Transactional
    public void eliminarContrato(Long usuarioId, Long productoId) {
        validarCliente(usuarioId);
        contratoRepository.deleteByUsuarioIdAndProductoId(usuarioId, productoId);
    }

    @Transactional(readOnly = true)
    public boolean tieneContrato(Long usuarioId, Long productoId) {
        validarCliente(usuarioId);
        return contratoRepository.existsByUsuarioIdAndProductoId(usuarioId, productoId);
    }

    private Usuario validarCliente(Long usuarioId) {
        Usuario usuario = usuarioRepository.findByIdAndActivoTrue(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        if (usuario.getRol() != RolUsuario.CLIENTE) {
            throw new IllegalArgumentException("El usuario no es un cliente");
        }
        return usuario;
    }
}
