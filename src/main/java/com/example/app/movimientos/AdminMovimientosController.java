package com.example.app.movimientos;

import com.example.app.movimientos.dto.MovimientoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/movimientos")
public class AdminMovimientosController {

    @Autowired
    private MovimientoRepository movimientoRepository;

    @GetMapping
    public ResponseEntity<List<MovimientoDTO>> listarPorUsuario(@RequestParam(required = false) Long usuarioId) {
        List<Movimiento> movs;
        if (usuarioId == null) {
            movs = movimientoRepository.findAll();
        } else {
            movs = movimientoRepository.findByUsuarioIdOrderByCreadoEnDesc(usuarioId);
        }

        List<MovimientoDTO> dtos = movs.stream().map(m -> MovimientoDTO.builder()
                .id(m.getId())
                .usuarioId(m.getUsuario() != null ? m.getUsuario().getId() : null)
                .usuarioNombre(m.getUsuario() != null ? m.getUsuario().getNombre() : null)
                .productoId(m.getProducto() != null ? m.getProducto().getId() : null)
                .productoNombre(m.getProducto() != null ? m.getProducto().getNombre() : null)
                .tipo(m.getTipo())
                .monto(m.getMonto())
                .detalle(m.getDetalle())
                .creadoEn(m.getCreadoEn())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
