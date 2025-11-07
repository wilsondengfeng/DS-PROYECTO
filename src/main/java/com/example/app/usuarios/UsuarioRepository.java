package com.example.app.usuarios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByLoginAndClaveAndActivoTrue(String login, String clave);
    Optional<Usuario> findByIdAndActivoTrue(Long id);
    boolean existsByLogin(String login);
}
