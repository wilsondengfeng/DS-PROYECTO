package com.example.app.contratos;

import com.example.app.contratos.dto.ContratoSolicitudDTO;
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
public class ClienteContratosController {

    private final ContratoService contratoService;
    private final SolicitudInformacionService solicitudInformacionService;

    @GetMapping("/contratos")
    public List<ProductoResumenDTO> contratos(@PathVariable Long clienteId) {
        return contratoService.listar(clienteId);
    }

    @PostMapping("/contratos/{productoId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void contratar(@PathVariable Long clienteId,
                          @PathVariable Long productoId,
                          @Valid @RequestBody ContratoSolicitudDTO solicitud) {
        contratoService.contratar(clienteId, productoId, solicitud.getMonto());
    }

    @DeleteMapping("/contratos/{productoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarContrato(@PathVariable Long clienteId, @PathVariable Long productoId) {
        contratoService.eliminarContrato(clienteId, productoId);
    }

    @PostMapping("/solicitudes")
    @ResponseStatus(HttpStatus.CREATED)
    public void solicitarInformacion(@PathVariable Long clienteId,
                                     @Valid @RequestBody SolicitudInformacionRequestDTO dto) {
        solicitudInformacionService.registrar(clienteId, dto);
    }
}
