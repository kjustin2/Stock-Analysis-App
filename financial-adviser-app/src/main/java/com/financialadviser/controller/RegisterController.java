package com.financialadviser.controller;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;

import com.financialadviser.model.User;
import com.financialadviser.service.UserService;

import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.stage.Stage;

@Controller
public class RegisterController {
    private static final Logger logger = LogManager.getLogger(RegisterController.class);

    @FXML
    TextField usernameField;

    @FXML
    TextField emailField;

    @FXML
    PasswordField passwordField;

    @FXML
    PasswordField confirmPasswordField;

    @FXML
    Button registerButton;

    @FXML
    Button cancelButton;

    private UserService userService;
    private PasswordEncoder passwordEncoder;

    // Default constructor for FXML loader
    public RegisterController() {
    }

    @Autowired
    public RegisterController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    @FXML
    public void initialize() {
        registerButton.setOnAction(event -> handleRegistration());
        cancelButton.setOnAction(event -> handleCancel());
    }

    private void handleRegistration() {
        String username = usernameField.getText();
        String email = emailField.getText();
        String password = passwordField.getText();
        String confirmPassword = confirmPasswordField.getText();

        if (!validateInput(username, email, password, confirmPassword)) {
            return;
        }

        try {
            if (userService.existsByUsername(username)) {
                showError("Registration Error", "Username already exists.");
                return;
            }

            if (userService.existsByEmail(email)) {
                showError("Registration Error", "Email already registered.");
                return;
            }

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));

            userService.save(user);
            logger.info("User registered successfully: {}", username);
            showSuccess("Registration Successful", "You can now log in with your credentials.");
            closeWindow();
        } catch (Exception e) {
            logger.error("Error during registration", e);
            showError("Registration Error", "An error occurred during registration. Please try again.");
        }
    }

    private boolean validateInput(String username, String email, String password, String confirmPassword) {
        if (username.isEmpty() || email.isEmpty() || password.isEmpty() || confirmPassword.isEmpty()) {
            showError("Validation Error", "All fields are required.");
            return false;
        }

        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            showError("Validation Error", "Invalid email format.");
            return false;
        }

        if (password.length() < 8) {
            showError("Validation Error", "Password must be at least 8 characters long.");
            return false;
        }

        if (!password.equals(confirmPassword)) {
            showError("Validation Error", "Passwords do not match.");
            return false;
        }

        return true;
    }

    private void handleCancel() {
        closeWindow();
    }

    private void closeWindow() {
        Stage stage = (Stage) cancelButton.getScene().getWindow();
        stage.close();
    }

    private void showError(String title, String content) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }

    private void showSuccess(String title, String content) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }
} 