package com.example.app.seguridad;

import com.example.app.usuarios.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UsuarioRepository repo;

    public Optional<LoginResponse> login(String login, String clave){
        return repo.findByLoginAndClaveAndActivoTrue(login, clave)
                .map(usuario -> new LoginResponse(
                        usuario.getId(),
                        usuario.getNombre(),
                        usuario.getEmail(),
                        usuario.getRol()
                ));
    }
}
