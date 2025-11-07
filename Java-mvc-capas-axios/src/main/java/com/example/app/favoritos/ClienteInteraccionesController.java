package com.example.app.favoritos;

import com.example.app.producto.dto.ProductoResumenDTO;
import com.example.app.solicitudes.SolicitudInformacionService;
import com.example.app.solicitudes.dto.SolicitudInformacionRequestDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes/{clienteId}")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ClienteInteraccionesController {

    private final FavoritoService favoritoService;
    private final SolicitudInformacionService solicitudInformacionService;

    @GetMapping("/favoritos")
    public List<ProductoResumenDTO> favoritos(@PathVariable Long clienteId) {
        return favoritoService.listar(clienteId);
    }

    @PostMapping("/favoritos/{productoId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void agregarFavorito(@PathVariable Long clienteId, @PathVariable Long productoId) {
        favoritoService.agregar(clienteId, productoId);
    }

    @DeleteMapping("/favoritos/{productoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarFavorito(@PathVariable Long clienteId, @PathVariable Long productoId) {
        favoritoService.eliminar(clienteId, productoId);
    }

    @PostMapping("/solicitudes")
    @ResponseStatus(HttpStatus.CREATED)
    public void solicitarInformacion(@PathVariable Long clienteId,
                                     @Valid @RequestBody SolicitudInformacionRequestDTO dto) {
        solicitudInformacionService.registrar(clienteId, dto);
    }
}
