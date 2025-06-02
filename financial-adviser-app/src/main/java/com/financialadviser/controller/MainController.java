package com.financialadviser.controller;

import java.net.URL;
import java.util.ResourceBundle;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;

import com.financialadviser.model.User;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Alert;
import javafx.scene.control.Label;
import javafx.scene.control.Menu;
import javafx.scene.control.MenuBar;
import javafx.scene.control.MenuItem;
import javafx.scene.control.SeparatorMenuItem;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.layout.BorderPane;

@Controller
public class MainController implements Initializable {
    private static final Logger logger = LogManager.getLogger(MainController.class);

    @FXML
    BorderPane mainPane;

    @FXML
    MenuBar menuBar;

    @FXML
    TabPane contentTabPane;

    @FXML
    Label statusLabel;

    @FXML
    TabPane tabPane;

    @FXML
    Label statusBar;

    @Autowired
    BudgetController budgetController;

    private User currentUser;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        logger.info("Initializing main controller");
        setupMenuBar();
        setupTabs();
    }

    private void setupMenuBar() {
        Menu fileMenu = new Menu("File");
        MenuItem exportItem = new MenuItem("Export Data");
        MenuItem importItem = new MenuItem("Import Data");
        MenuItem exitItem = new MenuItem("Exit");
        fileMenu.getItems().addAll(exportItem, importItem, new SeparatorMenuItem(), exitItem);

        Menu viewMenu = new Menu("View");
        MenuItem dashboardItem = new MenuItem("Dashboard");
        MenuItem budgetItem = new MenuItem("Budget");
        MenuItem investmentsItem = new MenuItem("Investments");
        MenuItem debtsItem = new MenuItem("Debts");
        MenuItem goalsItem = new MenuItem("Goals");
        viewMenu.getItems().addAll(dashboardItem, budgetItem, investmentsItem, debtsItem, goalsItem);

        Menu helpMenu = new Menu("Help");
        MenuItem aboutItem = new MenuItem("About");
        helpMenu.getItems().add(aboutItem);

        menuBar.getMenus().addAll(fileMenu, viewMenu, helpMenu);

        // Add menu item handlers
        exitItem.setOnAction(e -> handleExit());
        dashboardItem.setOnAction(e -> openDashboard());
        budgetItem.setOnAction(e -> openBudget());
        investmentsItem.setOnAction(e -> openInvestments());
        debtsItem.setOnAction(e -> openDebts());
        goalsItem.setOnAction(e -> openGoals());
        aboutItem.setOnAction(e -> showAboutDialog());
    }

    private void setupTabs() {
        Tab dashboardTab = new Tab("Dashboard");
        dashboardTab.setClosable(false);
        // TODO: Add dashboard content

        Tab budgetTab = new Tab("Budget");
        budgetTab.setClosable(false);
        // TODO: Add budget content

        Tab investmentsTab = new Tab("Investments");
        investmentsTab.setClosable(false);
        // TODO: Add investments content

        Tab debtsTab = new Tab("Debts");
        debtsTab.setClosable(false);
        // TODO: Add debts content

        Tab goalsTab = new Tab("Goals");
        goalsTab.setClosable(false);
        // TODO: Add goals content

        contentTabPane.getTabs().addAll(
            dashboardTab,
            budgetTab,
            investmentsTab,
            debtsTab,
            goalsTab
        );
    }

    private void handleExit() {
        logger.info("Application exit requested");
        javafx.application.Platform.exit();
    }

    void openDashboard() {
        contentTabPane.getSelectionModel().select(0);
    }

    void openBudget() {
        contentTabPane.getSelectionModel().select(1);
    }

    void openInvestments() {
        contentTabPane.getSelectionModel().select(2);
    }

    void openDebts() {
        contentTabPane.getSelectionModel().select(3);
    }

    void openGoals() {
        contentTabPane.getSelectionModel().select(4);
    }

    private void showAboutDialog() {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("About Financial Adviser");
        alert.setHeaderText("Financial Adviser Application");
        alert.setContentText("Version 1.0\n\nA comprehensive financial planning tool to help you manage your finances, investments, debts, and financial goals.");
        alert.showAndWait();
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
        budgetController.setCurrentUser(user);
        updateStatusBar();
        logger.info("User session started: {}", user.getUsername());
    }

    private void updateStatusBar() {
        statusLabel.setText("Logged in as: " + currentUser.getUsername());
    }
} 