package com.sungkyul.cafeteria.user.repository;

import com.sungkyul.cafeteria.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByGoogleId(String googleId);

    boolean existsByGoogleId(String googleId);

    boolean existsByNicknameNormalizedAndIdNot(String nicknameNormalized, Long id);
}
