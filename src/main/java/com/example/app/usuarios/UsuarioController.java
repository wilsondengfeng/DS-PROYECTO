package com.example.app.usuarios;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> crearUsuario(@RequestBody Usuario usuario) {
        try {
            if (usuario.getLogin() == null || usuario.getLogin().isBlank()) {
                return ResponseEntity.badRequest().body("El login es requerido");
            }

            if (usuarioRepository.existsByLogin(usuario.getLogin())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Ya existe un usuario con ese login");
            }

            if (usuario.getSaldoSol() == null) {
                usuario.setSaldoSol(BigDecimal.ZERO);
            }
            if (usuario.getSaldoUsd() == null) {
                usuario.setSaldoUsd(BigDecimal.ZERO);
            }

            Usuario nuevoUsuario = usuarioRepository.save(usuario);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoUsuario);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error al crear usuario: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/saldo")
    public ResponseEntity<?> obtenerSaldo(@PathVariable Long id,
                                          @RequestParam(defaultValue = "SOL") String moneda) {
        return usuarioRepository.findByIdAndActivoTrue(id)
            .map(u -> ResponseEntity.ok(Map.<String, Object>of(
                    "saldo", getSaldoPorMoneda(u, moneda),
                    "moneda", moneda.toUpperCase())))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.<String, Object>of("mensaje", "Usuario no encontrado o inactivo")));
    }

    @PostMapping("/{id}/depositos")
    public ResponseEntity<?> depositar(@PathVariable Long id,
                                       @RequestParam(defaultValue = "SOL") String moneda,
                                       @RequestBody MovimientoSaldoRequest req) {
        if (req == null || req.getMonto() == null || req.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.<String, Object>of("mensaje", "Monto invalido"));
        }

        return usuarioRepository.findByIdAndActivoTrue(id)
            .map(u -> {
                BigDecimal saldoActual = getSaldoPorMoneda(u, moneda).add(req.getMonto());
                setSaldoPorMoneda(u, moneda, saldoActual);
                usuarioRepository.save(u);
                return ResponseEntity.ok(Map.<String, Object>of("saldo", saldoActual, "moneda", moneda.toUpperCase()));
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.<String, Object>of("mensaje", "Usuario no encontrado o inactivo")));
    }

    @PostMapping("/{id}/retiros")
    public ResponseEntity<?> retirar(@PathVariable Long id,
                                     @RequestParam(defaultValue = "SOL") String moneda,
                                     @RequestBody MovimientoSaldoRequest req) {
        if (req == null || req.getMonto() == null || req.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.<String, Object>of("mensaje", "Monto invalido"));
        }

        return usuarioRepository.findByIdAndActivoTrue(id)
            .map(u -> {
                BigDecimal saldoActual = getSaldoPorMoneda(u, moneda);
                if (saldoActual.compareTo(req.getMonto()) < 0) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.<String, Object>of("mensaje", "Saldo insuficiente"));
                }
                saldoActual = saldoActual.subtract(req.getMonto());
                setSaldoPorMoneda(u, moneda, saldoActual);
                usuarioRepository.save(u);
                return ResponseEntity.ok(Map.<String, Object>of("saldo", saldoActual, "moneda", moneda.toUpperCase()));
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.<String, Object>of("mensaje", "Usuario no encontrado o inactivo")));
    }

    @Data
    private static class MovimientoSaldoRequest {
        private BigDecimal monto;
    }

    private BigDecimal getSaldoPorMoneda(Usuario u, String moneda) {
        if ("USD".equalsIgnoreCase(moneda)) {
            return u.getSaldoUsd() == null ? BigDecimal.ZERO : u.getSaldoUsd();
        }
        return u.getSaldoSol() == null ? BigDecimal.ZERO : u.getSaldoSol();
    }

    private void setSaldoPorMoneda(Usuario u, String moneda, BigDecimal valor) {
        if ("USD".equalsIgnoreCase(moneda)) {
            u.setSaldoUsd(valor);
        } else {
            u.setSaldoSol(valor);
        }
    }
}
