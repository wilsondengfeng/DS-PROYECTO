package com.example.app.producto.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ComparacionRequestDTO {
    @NotEmpty
    private List<Long> productoIds;
}
