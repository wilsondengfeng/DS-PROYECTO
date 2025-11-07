package com.example.app.solicitudes;

import com.example.app.common.exception.ResourceNotFoundException;
import com.example.app.producto.Producto;
import com.example.app.producto.ProductoRepository;
import com.example.app.solicitudes.dto.SolicitudInformacionRequestDTO;
import com.example.app.usuarios.Usuario;
import com.example.app.usuarios.UsuarioRepository;
import com.example.app.usuarios.model.RolUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SolicitudInformacionService {

    private final SolicitudInformacionRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;

    @Transactional
    public void registrar(Long usuarioId, SolicitudInformacionRequestDTO dto) {
        Usuario usuario = usuarioRepository.findByIdAndActivoTrue(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        if (usuario.getRol() != RolUsuario.CLIENTE) {
            throw new IllegalArgumentException("El usuario no es un cliente");
        }
        Producto producto = productoRepository.findById(dto.getProductoId())
                .filter(Producto::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no disponible"));

        SolicitudInformacion solicitud = new SolicitudInformacion();
        solicitud.setUsuario(usuario);
        solicitud.setProducto(producto);
        solicitud.setMensaje(dto.getMensaje());
        repository.save(solicitud);
    }
}
