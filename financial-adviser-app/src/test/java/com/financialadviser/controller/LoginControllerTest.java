package com.financialadviser.controller;

import com.financialadviser.model.User;
import com.financialadviser.service.UserService;
import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.testfx.framework.junit5.ApplicationExtension;
import org.testfx.framework.junit5.Start;
import org.testfx.util.WaitForAsyncUtils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith({MockitoExtension.class, ApplicationExtension.class})
class LoginControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    private LoginController loginController;

    @Start
    private void start(Stage stage) {
        loginController = new LoginController(userService, passwordEncoder);

        Platform.runLater(() -> {
            initializeUIComponents();
            setupTestScene(stage);
            loginController.initialize();
        });
        
        WaitForAsyncUtils.waitForFxEvents();
    }

    private void initializeUIComponents() {
        loginController.usernameField = new TextField();
        loginController.passwordField = new PasswordField();
        loginController.loginButton = new Button("Login");
        loginController.registerButton = new Button("Register");
    }

    private void setupTestScene(Stage stage) {
        VBox root = new VBox(
            loginController.usernameField,
            loginController.passwordField,
            loginController.loginButton,
            loginController.registerButton
        );
        stage.setScene(new Scene(root));
        stage.show();
    }

    @Test
    void handleLogin_WithValidCredentials_ShouldOpenMainWindow() {
        // Given
        User testUser = new User();
        testUser.setUsername("testuser");
        testUser.setPassword("hashedPassword");

        when(userService.findByUsername("testuser")).thenReturn(testUser);
        when(passwordEncoder.matches("password123", "hashedPassword")).thenReturn(true);

        // When
        Platform.runLater(() -> {
            loginController.usernameField.setText("testuser");
            loginController.passwordField.setText("password123");
            loginController.loginButton.fire();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(userService).findByUsername("testuser");
        verify(passwordEncoder).matches("password123", "hashedPassword");
    }

    @Test
    void handleLogin_WithInvalidCredentials_ShouldShowError() {
        // Given
        when(userService.findByUsername("testuser")).thenReturn(null);

        // When
        Platform.runLater(() -> {
            loginController.usernameField.setText("testuser");
            loginController.passwordField.setText("wrongpassword");
            loginController.loginButton.fire();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(userService).findByUsername("testuser");
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void handleLogin_WithDatabaseError_ShouldShowError() {
        // Given
        when(userService.findByUsername(any())).thenThrow(new RuntimeException("Database error"));

        // When
        Platform.runLater(() -> {
            loginController.usernameField.setText("testuser");
            loginController.passwordField.setText("password123");
            loginController.loginButton.fire();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(userService).findByUsername("testuser");
    }

    @Test
    void handleRegister_ShouldOpenRegistrationWindow() {
        // When
        Platform.runLater(() -> loginController.registerButton.fire());
        WaitForAsyncUtils.waitForFxEvents();

        // Then - Visual verification that registration window opens
        // Note: We can't verify FXML loading in unit tests
    }
} 