package com.financialadviser;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import com.financialadviser.config.AppConfig;

public class App extends Application {
    private static final Logger logger = LogManager.getLogger(App.class);
    private static ApplicationContext applicationContext;

    @Override
    public void start(Stage primaryStage) {
        try {
            // Load the login FXML file
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/login.fxml"));
            
            // Set the controller factory to use Spring beans
            loader.setControllerFactory(applicationContext::getBean);
            
            Parent root = loader.load();
            Scene scene = new Scene(root);
            
            // Add CSS
            scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());
            
            primaryStage.setTitle("Financial Adviser - Login");
            primaryStage.setScene(scene);
            primaryStage.show();
            
            logger.info("Application started successfully");
        } catch (Exception e) {
            logger.error("Error starting application", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public void init() {
        try {
            // Initialize Spring context
            applicationContext = new AnnotationConfigApplicationContext(AppConfig.class);
            logger.info("Spring context initialized");
        } catch (Exception e) {
            logger.error("Error initializing Spring context", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public void stop() {
        try {
            // Close Spring context
            ((AnnotationConfigApplicationContext) applicationContext).close();
            logger.info("Application stopped successfully");
        } catch (Exception e) {
            logger.error("Error stopping application", e);
            throw new RuntimeException(e);
        }
    }

    public static void main(String[] args) {
        launch(args);
    }
} 