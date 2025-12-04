package com.example.app.contratos;

import com.example.app.contratos.dto.ProductoMetricDTO;
import com.example.app.contratos.dto.TipoMetricDTO;
import com.example.app.producto.ProductoRepository;
import com.example.app.producto.Producto;
import com.example.app.producto.TipoProducto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/metrics")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminMetricsController {

    private final ContratoRepository contratoRepository;
    private final ProductoRepository productoRepository;

    @GetMapping
    public Map<String, Object> metrics() {
        List<Producto> productos = productoRepository.findAll();

        // Sumas por producto
        List<Object[]> sumProd = contratoRepository.sumarPorProducto();
        Map<Long, BigDecimal> montoPorProducto = new HashMap<>();
        for (Object[] row : sumProd) {
            Long prodId = ((Number) row[0]).longValue();
            BigDecimal s = (BigDecimal) row[1];
            montoPorProducto.put(prodId, s);
        }

        // Sumas por tipo
        List<Object[]> sumTipo = contratoRepository.sumarPorTipo();
        Map<String, BigDecimal> montoPorTipo = new HashMap<>();
        for (Object[] row : sumTipo) {
            TipoProducto tipo = (TipoProducto) row[0];
            BigDecimal s = (BigDecimal) row[1];
            montoPorTipo.put(tipo.name(), s);
        }

        List<ProductoMetricDTO> productosMetrics = productos.stream().map(p ->
                ProductoMetricDTO.builder()
                        .productoId(p.getId())
                .productoNombre(p.getNombre())
                .tipo(p.getTipo() != null ? p.getTipo().name() : null)
                        .visitas(p.getVisitas())
                        .totalContratado(montoPorProducto.getOrDefault(p.getId(), BigDecimal.ZERO))
                        .build()
        ).collect(Collectors.toList());

        List<TipoMetricDTO> tipos = montoPorTipo.entrySet().stream()
                .map(e -> TipoMetricDTO.builder().tipo(e.getKey()).totalContratado(e.getValue()).build())
                .collect(Collectors.toList());

        BigDecimal totalContratado = montoPorProducto.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "productos", productosMetrics,
                "porTipo", tipos,
                "totalContratado", totalContratado
        );
    }
}
