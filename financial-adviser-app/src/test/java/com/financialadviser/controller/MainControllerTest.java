package com.financialadviser.controller;

import com.financialadviser.model.User;
import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.control.MenuBar;
import javafx.scene.control.TabPane;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.testfx.framework.junit5.ApplicationExtension;
import org.testfx.framework.junit5.Start;

import static org.testfx.assertions.api.Assertions.assertThat;

@ExtendWith({MockitoExtension.class, ApplicationExtension.class})
public class MainControllerTest {

    @Mock
    private BudgetController budgetController;

    private MainController mainController;

    @Start
    private void start(Stage stage) {
        mainController = new MainController();
        mainController.budgetController = budgetController;

        // Initialize the UI components
        Platform.runLater(() -> {
            mainController.mainPane = new BorderPane();
            mainController.menuBar = new MenuBar();
            mainController.contentTabPane = new TabPane();
            mainController.statusLabel = new Label();
            
            mainController.mainPane.setTop(mainController.menuBar);
            mainController.mainPane.setCenter(mainController.contentTabPane);
            mainController.mainPane.setBottom(mainController.statusLabel);
            
            stage.setScene(new Scene(mainController.mainPane));
            stage.show();
            
            // Set up tabs and menu
            mainController.initialize(null, null);
        });
    }

    @Test
    void openDashboard_ShouldSelectFirstTab() {
        Platform.runLater(() -> {
            mainController.openDashboard();
            assertThat(mainController.contentTabPane.getSelectionModel().getSelectedIndex()).isEqualTo(0);
        });
    }

    @Test
    void openBudget_ShouldSelectSecondTab() {
        Platform.runLater(() -> {
            mainController.openBudget();
            assertThat(mainController.contentTabPane.getSelectionModel().getSelectedIndex()).isEqualTo(1);
        });
    }

    @Test
    void openInvestments_ShouldSelectThirdTab() {
        Platform.runLater(() -> {
            mainController.openInvestments();
            assertThat(mainController.contentTabPane.getSelectionModel().getSelectedIndex()).isEqualTo(2);
        });
    }

    @Test
    void openDebts_ShouldSelectFourthTab() {
        Platform.runLater(() -> {
            mainController.openDebts();
            assertThat(mainController.contentTabPane.getSelectionModel().getSelectedIndex()).isEqualTo(3);
        });
    }

    @Test
    void openGoals_ShouldSelectFifthTab() {
        Platform.runLater(() -> {
            mainController.openGoals();
            assertThat(mainController.contentTabPane.getSelectionModel().getSelectedIndex()).isEqualTo(4);
        });
    }

    @Test
    void setCurrentUser_ShouldUpdateBudgetControllerAndStatusBar() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        Platform.runLater(() -> {
            mainController.setCurrentUser(user);
            assertThat(mainController.statusLabel.getText()).contains("testuser");
        });
    }
} 