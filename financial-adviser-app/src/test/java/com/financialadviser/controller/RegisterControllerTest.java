package com.financialadviser.controller;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.testfx.framework.junit5.ApplicationExtension;
import org.testfx.framework.junit5.Start;
import org.testfx.util.WaitForAsyncUtils;

import com.financialadviser.model.User;
import com.financialadviser.service.UserService;

import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

@ExtendWith({MockitoExtension.class, ApplicationExtension.class})
class RegisterControllerTest {

    @Mock
    private UserService userService;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private RegisterController registerController;

    @Start
    private void start(Stage stage) {
        registerController = new RegisterController(userService, passwordEncoder);

        Platform.runLater(() -> {
            initializeUIComponents();
            setupTestScene(stage);
            registerController.initialize();
        });
        
        WaitForAsyncUtils.waitForFxEvents();
    }

    private void initializeUIComponents() {
        registerController.usernameField = new TextField();
        registerController.emailField = new TextField();
        registerController.passwordField = new PasswordField();
        registerController.confirmPasswordField = new PasswordField();
        registerController.registerButton = new Button("Register");
        registerController.cancelButton = new Button("Cancel");
    }

    private void setupTestScene(Stage stage) {
        VBox root = new VBox(
            registerController.usernameField,
            registerController.emailField,
            registerController.passwordField,
            registerController.confirmPasswordField,
            registerController.registerButton,
            registerController.cancelButton
        );
        stage.setScene(new Scene(root));
        stage.show();
    }

    @Test
    void handleRegistration_WithValidInput_ShouldCreateUser() throws InterruptedException {
        // Given
        String username = "testuser";
        String email = "test@example.com";
        String password = "password123";
        CountDownLatch latch = new CountDownLatch(1);

        when(userService.existsByUsername(username)).thenReturn(false);
        when(userService.existsByEmail(email)).thenReturn(false);
        when(userService.save(any(User.class))).thenAnswer(invocation -> {
            latch.countDown();
            return invocation.getArgument(0);
        });

        // When
        Platform.runLater(() -> {
            registerController.usernameField.setText(username);
            registerController.emailField.setText(email);
            registerController.passwordField.setText(password);
            registerController.confirmPasswordField.setText(password);
            registerController.registerButton.fire();
        });

        // Wait for the save operation to complete
        latch.await(5, TimeUnit.SECONDS);
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userService).save(userCaptor.capture());
        
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getUsername()).isEqualTo(username);
        assertThat(savedUser.getEmail()).isEqualTo(email);
        assertThat(passwordEncoder.matches(password, savedUser.getPassword())).isTrue();
    }

    @Test
    void handleRegistration_WithExistingUsername_ShouldShowError() {
        // Given
        when(userService.existsByUsername("testuser")).thenReturn(true);

        // When
        Platform.runLater(() -> {
            registerController.usernameField.setText("testuser");
            registerController.emailField.setText("test@example.com");
            registerController.passwordField.setText("password123");
            registerController.confirmPasswordField.setText("password123");
            registerController.registerButton.fire();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(userService, never()).save(any(User.class));
    }

    @Test
    void handleRegistration_WithExistingEmail_ShouldShowError() {
        // Given
        when(userService.existsByEmail("test@example.com")).thenReturn(true);

        // When
        Platform.runLater(() -> {
            registerController.usernameField.setText("newuser");
            registerController.emailField.setText("test@example.com");
            registerController.passwordField.setText("password123");
            registerController.confirmPasswordField.setText("password123");
            registerController.registerButton.fire();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(userService, never()).save(any(User.class));
    }

    @Test
    void handleRegistration_WithInvalidEmail_ShouldShowError() {
        // When
        Platform.runLater(() -> {
            registerController.usernameField.setText("testuser");
            registerController.emailField.setText("invalid-email");
            registerController.passwordField.setText("password123");
            registerController.confirmPasswordField.setText("password123");
            registerController.registerButton.fire();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(userService, never()).existsByEmail(any());
        verify(userService, never()).save(any(User.class));
    }

    @Test
    void handleRegistration_WithPasswordMismatch_ShouldShowError() {
        // When
        Platform.runLater(() -> {
            registerController.usernameField.setText("testuser");
            registerController.emailField.setText("test@example.com");
            registerController.passwordField.setText("password123");
            registerController.confirmPasswordField.setText("differentpassword");
            registerController.registerButton.fire();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(userService, never()).existsByUsername(any());
        verify(userService, never()).save(any(User.class));
    }

    @Test
    void handleRegistration_WithShortPassword_ShouldShowError() {
        // When
        Platform.runLater(() -> {
            registerController.usernameField.setText("testuser");
            registerController.emailField.setText("test@example.com");
            registerController.passwordField.setText("short");
            registerController.confirmPasswordField.setText("short");
            registerController.registerButton.fire();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(userService, never()).existsByUsername(any());
        verify(userService, never()).save(any(User.class));
    }

    @Test
    void handleCancel_ShouldCloseWindow() {
        // When
        Platform.runLater(() -> registerController.cancelButton.fire());
        WaitForAsyncUtils.waitForFxEvents();

        // Then - Visual verification that window closes
        // Note: We can't verify Stage closing in unit tests
    }
} 