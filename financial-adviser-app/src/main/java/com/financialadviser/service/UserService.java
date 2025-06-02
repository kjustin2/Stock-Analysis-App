package com.financialadviser.service;

import com.financialadviser.model.User;
import java.util.List;
import java.util.Optional;

public interface UserService {
    User save(User user);
    Optional<User> findById(Long id);
    User findByUsername(String username);
    User findByEmail(String email);
    List<User> findAll();
    void delete(User user);
    void deleteById(Long id);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
} 