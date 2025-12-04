package com.example.app.solicitudes;

import com.example.app.solicitudes.dto.SolicitudInformacionAdminDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/solicitudes")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminSolicitudesController {

    private final SolicitudInformacionRepository repository;

    @GetMapping
    @Transactional(readOnly = true)
    public List<SolicitudInformacionAdminDTO> listar() {
        return repository.findAll().stream().map(s ->
                SolicitudInformacionAdminDTO.builder()
                        .id(s.getId())
                        .usuarioId(s.getUsuario().getId())
                        .usuarioNombre(s.getUsuario().getNombre())
                        .usuarioEmail(s.getUsuario().getEmail())
                        .productoId(s.getProducto().getId())
                        .productoNombre(s.getProducto().getNombre())
                        .mensaje(s.getMensaje())
                        .creadoEn(s.getCreadoEn())
                        .build()
        ).collect(Collectors.toList());
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
