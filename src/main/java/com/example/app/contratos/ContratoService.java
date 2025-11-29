package com.example.app.contratos;

import com.example.app.common.exception.ResourceNotFoundException;
import com.example.app.contratos.dto.ContratoAdminDTO;
import com.example.app.producto.Producto;
import com.example.app.producto.ProductoRepository;
import com.example.app.producto.ProductoService;
import com.example.app.producto.TipoProducto;
import com.example.app.producto.dto.ProductoResumenDTO;
import com.example.app.usuarios.Usuario;
import com.example.app.usuarios.UsuarioRepository;
import com.example.app.usuarios.model.RolUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
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
                .filter(contrato -> contrato.getProducto().isActivo())
                .map(contrato -> {
                    ProductoResumenDTO dto = productoService.toResumen(contrato.getProducto());
                    dto.setMontoInvertido(contrato.getMontoInvertido());
                    return dto;
                })
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
                        .montoInvertido(contrato.getMontoInvertido())
                        .creadoEn(contrato.getCreadoEn())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void contratar(Long usuarioId, Long productoId, BigDecimal montoInvertido) {
        Usuario usuario = validarCliente(usuarioId);
        Producto producto = productoRepository.findById(productoId)
                .filter(Producto::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no disponible"));

        // Para SEGUROS el monto es fijo, no se ajusta saldo ni se admite aumento/disminución
        boolean esSeguro = producto.getTipo() == TipoProducto.SEGURO;

        BigDecimal montoNormalizado = normalizarMonto(montoInvertido);
        Optional<Contrato> contratoExistente = contratoRepository.findByUsuarioIdAndProductoId(usuarioId, productoId);
        if (contratoExistente.isPresent()) {
            if (esSeguro) {
                throw new IllegalArgumentException("Los seguros tienen prima fija, no se puede ajustar el monto");
            }
            BigDecimal anterior = contratoExistente.get().getMontoInvertido();
            BigDecimal diferencia = montoNormalizado.subtract(anterior);
            if (diferencia.compareTo(BigDecimal.ZERO) > 0) {
                // aumentar inversión (monto recibido es el nuevo total)
                if (obtenerSaldoPorMoneda(usuario, producto.getMoneda()).compareTo(diferencia) < 0) {
                    throw new IllegalArgumentException("Saldo insuficiente para aumentar la inversiA3n");
                }
                setSaldoPorMoneda(usuario, producto.getMoneda(),
                        obtenerSaldoPorMoneda(usuario, producto.getMoneda()).subtract(diferencia));
                usuarioRepository.save(usuario);
            } else if (diferencia.compareTo(BigDecimal.ZERO) < 0) {
                // disminuir inversión: se devuelve la diferencia al saldo
                setSaldoPorMoneda(usuario, producto.getMoneda(),
                        obtenerSaldoPorMoneda(usuario, producto.getMoneda()).add(diferencia.abs()));
                usuarioRepository.save(usuario);
            }
            contratoExistente.get().setMontoInvertido(montoNormalizado);
            contratoRepository.save(contratoExistente.get());
            return;
        }
        if (!esSeguro && obtenerSaldoPorMoneda(usuario, producto.getMoneda()).compareTo(montoNormalizado) < 0) {
            throw new IllegalArgumentException("Saldo insuficiente para contratar este producto");
        }
        if (!esSeguro) {
            setSaldoPorMoneda(usuario, producto.getMoneda(),
                    obtenerSaldoPorMoneda(usuario, producto.getMoneda()).subtract(montoNormalizado));
            usuarioRepository.save(usuario);
        }
        Contrato contrato = new Contrato();
        contrato.setUsuario(usuario);
        contrato.setProducto(producto);
        contrato.setMontoInvertido(montoNormalizado);
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

    private BigDecimal obtenerSaldoPorMoneda(Usuario usuario, String moneda) {
        if ("USD".equalsIgnoreCase(moneda)) {
            return usuario.getSaldoUsd() == null ? BigDecimal.ZERO : usuario.getSaldoUsd();
        }
        return usuario.getSaldoSol() == null ? BigDecimal.ZERO : usuario.getSaldoSol();
    }

    private void setSaldoPorMoneda(Usuario usuario, String moneda, BigDecimal valor) {
        if ("USD".equalsIgnoreCase(moneda)) {
            usuario.setSaldoUsd(valor);
        } else {
            usuario.setSaldoSol(valor);
        }
    }

    private BigDecimal normalizarMonto(BigDecimal monto) {
        if (monto == null) {
            throw new IllegalArgumentException("Debes indicar un monto a invertir");
        }
        BigDecimal montoNormalizado = monto.setScale(2, RoundingMode.HALF_UP);
        if (montoNormalizado.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El monto debe ser mayor o igual a 0.00");
        }
        return montoNormalizado;
    }
}
