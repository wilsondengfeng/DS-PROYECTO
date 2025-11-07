package com.example.app.usuarios;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByLoginAndClaveAndActivoTrue(String login, String clave);

    Optional<Usuario> findByIdAndActivoTrue(Long id);
}
