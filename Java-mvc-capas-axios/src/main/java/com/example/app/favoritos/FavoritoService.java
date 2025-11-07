package com.example.app.favoritos;

import com.example.app.common.exception.ResourceNotFoundException;
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
public class FavoritoService {

    private final FavoritoRepository favoritoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final ProductoService productoService;

    @Transactional(readOnly = true)
    public List<ProductoResumenDTO> listar(Long usuarioId) {
        validarCliente(usuarioId);
        return favoritoRepository.findByUsuarioId(usuarioId).stream()
                .map(Favorito::getProducto)
                .filter(Producto::isActivo)
                .map(productoService::toResumen)
                .collect(Collectors.toList());
    }

    @Transactional
    public void agregar(Long usuarioId, Long productoId) {
        Usuario usuario = validarCliente(usuarioId);
        Producto producto = productoRepository.findById(productoId)
                .filter(Producto::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no disponible"));
        if (favoritoRepository.existsByUsuarioIdAndProductoId(usuarioId, productoId)) {
            return;
        }
        Favorito favorito = new Favorito();
        favorito.setUsuario(usuario);
        favorito.setProducto(producto);
        favoritoRepository.save(favorito);
    }

    @Transactional
    public void eliminar(Long usuarioId, Long productoId) {
        validarCliente(usuarioId);
        favoritoRepository.deleteByUsuarioIdAndProductoId(usuarioId, productoId);
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
