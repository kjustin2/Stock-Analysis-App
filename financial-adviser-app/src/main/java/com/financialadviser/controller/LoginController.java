package com.financialadviser.controller;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;

import com.financialadviser.model.User;
import com.financialadviser.service.UserService;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.stage.Stage;

@Controller
public class LoginController {
    private static final Logger logger = LogManager.getLogger(LoginController.class);

    @FXML
    TextField usernameField;

    @FXML
    PasswordField passwordField;

    @FXML
    Button loginButton;

    @FXML
    Button registerButton;

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationContext applicationContext;

    @Autowired
    public LoginController(UserService userService, PasswordEncoder passwordEncoder, ApplicationContext applicationContext) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.applicationContext = applicationContext;
    }

    @FXML
    public void initialize() {
        loginButton.setOnAction(event -> handleLogin());
        registerButton.setOnAction(event -> handleRegister());
    }

    private void handleLogin() {
        String username = usernameField.getText();
        String password = passwordField.getText();

        if (username.isEmpty() || password.isEmpty()) {
            showError("Validation Error", "Username and password are required.");
            return;
        }

        try {
            User user = userService.findByUsername(username);
            if (user != null && passwordEncoder.matches(password, user.getPassword())) {
                logger.info("User {} logged in successfully", username);
                openMainWindow(user);
            } else {
                showError("Invalid credentials", "Username or password is incorrect.");
                logger.warn("Failed login attempt for username: {}", username);
            }
        } catch (Exception e) {
            logger.error("Error during login", e);
            showError("Login Error", "An error occurred during login. Please try again.");
        }
    }

    private void handleRegister() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/register.fxml"));
            loader.setControllerFactory(applicationContext::getBean);
            Parent root = loader.load();
            Stage stage = new Stage();
            stage.setTitle("Register New User");
            stage.setScene(new Scene(root));
            stage.show();
        } catch (Exception e) {
            logger.error("Error opening registration window", e);
            showError("Error", "Could not open registration window.");
        }
    }

    private void openMainWindow(User user) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/main.fxml"));
            loader.setControllerFactory(applicationContext::getBean);
            Parent root = loader.load();
            
            MainController mainController = loader.getController();
            mainController.setCurrentUser(user);
            
            Stage stage = (Stage) loginButton.getScene().getWindow();
            stage.setScene(new Scene(root));
            stage.setTitle("Financial Adviser - " + user.getUsername());
            stage.show();
        } catch (Exception e) {
            logger.error("Error opening main window", e);
            showError("Error", "Could not open main window.");
        }
    }

    private void showError(String title, String content) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }
} 