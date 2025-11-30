package com.example.app.contratos.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ContratoSolicitudDTO {

    @NotNull(message = "Debes indicar un monto a invertir")
    @DecimalMin(value = "0.00", message = "El monto debe ser 0 o mayor")
    @Digits(integer = 13, fraction = 2, message = "El monto excede el limite permitido")
    private BigDecimal monto;
}
