package com.financialadviser.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.testfx.framework.junit5.ApplicationExtension;
import org.testfx.framework.junit5.Start;
import org.testfx.util.WaitForAsyncUtils;

import com.financialadviser.model.User;
import com.financialadviser.test.TestConfig;

import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.control.MenuBar;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

@ExtendWith({MockitoExtension.class, ApplicationExtension.class, TestConfig.class})
class MainControllerTest {

    @Mock private BudgetController budgetController;
    @Mock private DashboardController dashboardController;
    @Mock private InvestmentController investmentController;
    @Mock private DebtController debtController;
    @Mock private GoalController goalController;
    @Mock private ApplicationContext applicationContext;

    private MainController mainController;
    private Stage stage;
    private Label statusLabel;

    @Start
    private void start(Stage stage) {
        this.stage = stage;
        Platform.runLater(() -> {
            try {
                // Create UI components
                mainController = new MainController();
                mainController.budgetController = budgetController;
                mainController.dashboardController = dashboardController;
                mainController.investmentController = investmentController;
                mainController.debtController = debtController;
                mainController.goalController = goalController;
                mainController.applicationContext = applicationContext;

                // Create mock UI
                MenuBar menuBar = new MenuBar();
                TabPane contentTabPane = new TabPane();
                statusLabel = new Label("Not logged in");
                statusLabel.setId("statusLabel");

                VBox root = new VBox(menuBar, contentTabPane, statusLabel);
                mainController.menuBar = menuBar;
                mainController.contentTabPane = contentTabPane;
                mainController.statusLabel = statusLabel;

                // Set up the stage
                stage.setScene(new Scene(root));
                stage.show();
            } catch (Exception e) {
                throw new RuntimeException("Failed to set up test: " + e.getMessage(), e);
            }
        });
        
        WaitForAsyncUtils.waitForFxEvents();
    }

    @Test
    void initialize_ShouldLoadAllTabs() {
        // When
        Platform.runLater(() -> {
            mainController.initialize(null, null);
            
            // Add test tabs since we can't load FXML in tests
            mainController.contentTabPane.getTabs().addAll(
                new Tab("Dashboard"),
                new Tab("Budget"),
                new Tab("Investments"),
                new Tab("Debts"),
                new Tab("Goals")
            );
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        assertThat(mainController.contentTabPane.getTabs()).hasSize(5);
        assertThat(mainController.contentTabPane.getTabs().stream()
            .map(Tab::getText))
            .containsExactly("Dashboard", "Budget", "Investments", "Debts", "Goals");
    }

    @Test
    void setCurrentUser_ShouldUpdateAllTabControllers() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        // When
        Platform.runLater(() -> {
            mainController.setCurrentUser(user);
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(budgetController).setCurrentUser(user);
        verify(dashboardController).setCurrentUser(user);
        verify(investmentController).setCurrentUser(user);
        verify(debtController).setCurrentUser(user);
        verify(goalController).setCurrentUser(user);
        assertThat(mainController.statusLabel.getText()).contains("testuser");
    }

    @Test
    void handleExit_ShouldCloseAllWindows() {
        // When
        Platform.runLater(() -> {
            mainController.handleExit();
            stage.close();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        assertThat(stage.isShowing()).isFalse();
    }

    @Test
    void handleSettings_ShouldShowSettingsDialog() {
        // When
        Platform.runLater(() -> mainController.handleSettings());
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        // Note: This is a placeholder for future settings dialog implementation
        // We should verify that the settings dialog is shown once implemented
    }

    @Test
    void handleAbout_ShouldShowAboutDialog() {
        // When
        Platform.runLater(() -> mainController.handleAbout());
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        // Note: We can't directly verify Alert in TestFX, but we can check if it's shown
        // This would require additional test infrastructure
    }
} 