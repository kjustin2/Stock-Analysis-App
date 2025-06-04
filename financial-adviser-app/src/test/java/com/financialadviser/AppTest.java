package com.financialadviser;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.Mockito.mock;
import org.springframework.context.ApplicationContext;
import org.testfx.api.FxRobot;
import org.testfx.framework.junit5.ApplicationExtension;
import org.testfx.framework.junit5.Start;
import org.testfx.util.WaitForAsyncUtils;

import com.financialadviser.controller.LoginController;
import com.financialadviser.service.UserService;

import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.TextField;
import javafx.stage.Stage;

@ExtendWith(ApplicationExtension.class)
public class AppTest {
    
    private Stage stage;
    private ApplicationContext mockContext;
    private LoginController loginController;
    private UserService mockUserService;

    @Start
    private void start(Stage stage) {
        this.stage = stage;
        setupMocks();
        
        Platform.runLater(() -> {
            try {
                FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/login.fxml"));
                loader.setControllerFactory(className -> {
                    if (className.equals(LoginController.class)) {
                        return loginController;
                    }
                    return mockContext.getBean(className);
                });
                
                Parent root = loader.load();
                Scene scene = new Scene(root);
                scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());
                
                stage.setTitle("Financial Adviser - Login");
                stage.setScene(scene);
                stage.show();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
        
        WaitForAsyncUtils.waitForFxEvents();
    }

    private void setupMocks() {
        mockContext = mock(ApplicationContext.class);
        mockUserService = mock(UserService.class);
        loginController = new LoginController(mockUserService, null, mockContext);
    }

    @Test
    void applicationStartup_ShouldLoadLoginWindow(FxRobot robot) {
        // Then
        assertThat(stage.getTitle()).isEqualTo("Financial Adviser - Login");
        assertThat(robot.lookup("#usernameField").queryAs(TextField.class)).isNotNull();
        assertThat(robot.lookup("#passwordField").queryAs(TextField.class)).isNotNull();
    }

    @Test
    void applicationStartup_WithMissingFXML_ShouldHandleError() {
        Platform.runLater(() -> {
            try {
                FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/nonexistent.fxml"));
                loader.load();
            } catch (Exception e) {
                assertThat(e).isInstanceOf(RuntimeException.class);
            }
        });
        WaitForAsyncUtils.waitForFxEvents();
    }

    @Test
    void applicationStartup_WithInvalidCSS_ShouldHandleError() {
        Platform.runLater(() -> {
            try {
                Scene scene = stage.getScene();
                scene.getStylesheets().add(getClass().getResource("/css/nonexistent.css").toExternalForm());
            } catch (Exception e) {
                assertThat(e).isInstanceOf(RuntimeException.class);
            }
        });
        WaitForAsyncUtils.waitForFxEvents();
    }
} 