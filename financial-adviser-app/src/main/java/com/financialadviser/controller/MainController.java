package com.financialadviser.controller;

import java.net.URL;
import java.util.ResourceBundle;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Controller;

import com.financialadviser.model.User;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Alert;
import javafx.scene.control.Label;
import javafx.scene.control.MenuBar;
import javafx.scene.control.TabPane;

@Controller
public class MainController implements Initializable {
    private static final Logger logger = LogManager.getLogger(MainController.class);

    @FXML MenuBar menuBar;
    @FXML TabPane contentTabPane;
    @FXML Label statusLabel;

    @Autowired BudgetController budgetController;
    @Autowired DashboardController dashboardController;
    @Autowired InvestmentController investmentController;
    @Autowired DebtController debtController;
    @Autowired GoalController goalController;
    @Autowired ApplicationContext applicationContext;

    private User currentUser;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        logger.info("Initializing main controller");
    }

    @FXML
    void handleSettings() {
        // TODO: Implement settings dialog
        logger.info("Settings menu item clicked");
    }

    @FXML
    void handleExit() {
        logger.info("Application exit requested");
        javafx.application.Platform.exit();
    }

    @FXML
    void handleAbout() {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("About Financial Adviser");
        alert.setHeaderText("Financial Adviser Application");
        alert.setContentText("Version 1.0\n\nA comprehensive financial planning tool to help you manage your finances, investments, debts, and financial goals.");
        alert.showAndWait();
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
        budgetController.setCurrentUser(user);
        dashboardController.setCurrentUser(user);
        investmentController.setCurrentUser(user);
        debtController.setCurrentUser(user);
        goalController.setCurrentUser(user);
        updateStatusBar();
        logger.info("User session started: {}", user.getUsername());
    }

    private void updateStatusBar() {
        statusLabel.setText("Logged in as: " + currentUser.getUsername());
    }
} 