package com.financialadviser.service.impl;

import com.financialadviser.model.User;
import com.financialadviser.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("hashedPassword");
    }

    @Test
    void save_ShouldSaveAndReturnUser() {
        // Given
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User savedUser = userService.save(testUser);

        // Then
        assertThat(savedUser).isEqualTo(testUser);
        verify(userRepository).save(testUser);
    }

    @Test
    void findById_ShouldReturnUser() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        Optional<User> foundUser = userService.findById(1L);

        // Then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get()).isEqualTo(testUser);
    }

    @Test
    void findByUsername_ShouldReturnUser() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(testUser);

        // When
        User foundUser = userService.findByUsername("testuser");

        // Then
        assertThat(foundUser).isEqualTo(testUser);
    }

    @Test
    void findByEmail_ShouldReturnUser() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(testUser);

        // When
        User foundUser = userService.findByEmail("test@example.com");

        // Then
        assertThat(foundUser).isEqualTo(testUser);
    }

    @Test
    void findAll_ShouldReturnAllUsers() {
        // Given
        User anotherUser = new User();
        anotherUser.setId(2L);
        anotherUser.setUsername("anotheruser");

        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser, anotherUser));

        // When
        List<User> users = userService.findAll();

        // Then
        assertThat(users).hasSize(2);
        assertThat(users).contains(testUser, anotherUser);
    }

    @Test
    void delete_ShouldDeleteUser() {
        // When
        userService.delete(testUser);

        // Then
        verify(userRepository).delete(testUser);
    }

    @Test
    void deleteById_ShouldDeleteUserById() {
        // When
        userService.deleteById(1L);

        // Then
        verify(userRepository).deleteById(1L);
    }

    @Test
    void existsByUsername_ShouldReturnTrue_WhenUsernameExists() {
        // Given
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        // When
        boolean exists = userService.existsByUsername("testuser");

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    void existsByUsername_ShouldReturnFalse_WhenUsernameDoesNotExist() {
        // Given
        when(userRepository.existsByUsername("nonexistent")).thenReturn(false);

        // When
        boolean exists = userService.existsByUsername("nonexistent");

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    void existsByEmail_ShouldReturnTrue_WhenEmailExists() {
        // Given
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // When
        boolean exists = userService.existsByEmail("test@example.com");

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    void existsByEmail_ShouldReturnFalse_WhenEmailDoesNotExist() {
        // Given
        when(userRepository.existsByEmail("nonexistent@example.com")).thenReturn(false);

        // When
        boolean exists = userService.existsByEmail("nonexistent@example.com");

        // Then
        assertThat(exists).isFalse();
    }
} 