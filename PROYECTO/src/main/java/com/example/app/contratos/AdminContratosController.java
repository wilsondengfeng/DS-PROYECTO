package com.example.app.contratos;

import com.example.app.contratos.dto.ContratoAdminDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/contratos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminContratosController {

    private final ContratoService contratoService;

    @GetMapping
    public List<ContratoAdminDTO> listarContratos() {
        return contratoService.listarTodos();
    }
}
