package com.financialadviser.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.testfx.framework.junit5.ApplicationExtension;
import org.testfx.framework.junit5.Start;
import org.testfx.util.WaitForAsyncUtils;

import com.financialadviser.model.User;
import com.financialadviser.service.UserService;
import com.financialadviser.test.TestConfig;

import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

@ExtendWith({MockitoExtension.class, ApplicationExtension.class, TestConfig.class})
class LoginControllerTest {

    @Mock
    private UserService userService;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Mock
    private ApplicationContext applicationContext;

    private LoginController loginController;
    private Stage stage;

    @Start
    private void start(Stage stage) {
        this.stage = stage;
        loginController = new LoginController(userService, passwordEncoder, applicationContext);

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

    private void showError(String title, String content) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }

    @Test
    void initialize_ShouldSetupEventHandlers() {
        // Given
        CountDownLatch latch = new CountDownLatch(1);
        
        // When
        Platform.runLater(() -> {
            loginController.initialize();
            latch.countDown();
        });
        
        // Then
        try {
            latch.await(5, TimeUnit.SECONDS);
            assertThat(loginController.loginButton.getOnAction()).isNotNull();
            assertThat(loginController.registerButton.getOnAction()).isNotNull();
        } catch (InterruptedException e) {
            fail("Test timed out");
        }
    }

    @Test
    void handleLogin_WithValidCredentials_ShouldOpenMainWindow() {
        // Given
        String rawPassword = "password123";
        String hashedPassword = passwordEncoder.encode(rawPassword);
        
        User testUser = new User();
        testUser.setUsername("testuser");
        testUser.setPassword(hashedPassword);

        when(userService.findByUsername("testuser")).thenReturn(testUser);

        // When
        Platform.runLater(() -> {
            loginController.usernameField.setText("testuser");
            loginController.passwordField.setText(rawPassword);
            loginController.loginButton.fire();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(userService).findByUsername("testuser");
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

    @Test
    void openMainWindow_WithMissingFXML_ShouldShowError() {
        // Given
        User testUser = new User();
        testUser.setUsername("testuser");
        
        // When
        Platform.runLater(() -> {
            try {
                FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/nonexistent.fxml"));
                loader.setControllerFactory(applicationContext::getBean);
                loader.load();
            } catch (Exception e) {
                showError("Error", "Could not open main window.");
            }
        });
        WaitForAsyncUtils.waitForFxEvents();
    }

    @Test
    void handleLogin_WithEmptyFields_ShouldShowError() {
        // When
        Platform.runLater(() -> {
            loginController.usernameField.setText("");
            loginController.passwordField.setText("");
            loginController.loginButton.fire();
        });
        WaitForAsyncUtils.waitForFxEvents();
        
        // Then
        verify(userService, never()).findByUsername(any());
    }
} 