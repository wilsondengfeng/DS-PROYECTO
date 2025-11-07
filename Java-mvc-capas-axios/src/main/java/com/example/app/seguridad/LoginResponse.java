package com.example.app.seguridad;

import com.example.app.usuarios.model.RolUsuario;
import lombok.Value;

@Value
public class LoginResponse {
    Long id;
    String nombre;
    String email;
    RolUsuario rol;
}
