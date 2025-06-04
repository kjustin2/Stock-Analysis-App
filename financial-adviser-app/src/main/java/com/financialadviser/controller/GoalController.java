package com.financialadviser.controller;

import java.math.BigDecimal;
import java.net.URL;
import java.time.LocalDate;
import java.util.List;
import java.util.ResourceBundle;
import java.util.stream.Collectors;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;

import com.financialadviser.model.Goal;
import com.financialadviser.model.User;
import com.financialadviser.service.GoalService;
import com.financialadviser.viewmodel.GoalViewModel;

import javafx.beans.binding.Bindings;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.chart.PieChart;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.ComboBox;
import javafx.scene.control.DatePicker;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressBar;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.VBox;

@Controller
public class GoalController implements Initializable {
    private static final Logger logger = LogManager.getLogger(GoalController.class);

    @FXML private TextField goalNameField;
    @FXML private TextField targetAmountField;
    @FXML private TextField currentAmountField;
    @FXML private DatePicker deadlinePicker;
    @FXML private ComboBox<String> priorityCombo;

    @FXML private TableView<GoalViewModel> goalTable;
    @FXML private TableColumn<GoalViewModel, String> nameColumn;
    @FXML private TableColumn<GoalViewModel, Double> targetColumn;
    @FXML private TableColumn<GoalViewModel, Double> currentColumn;
    @FXML private TableColumn<GoalViewModel, LocalDate> deadlineColumn;
    @FXML private TableColumn<GoalViewModel, Double> progressColumn;

    @FXML private PieChart goalDistributionChart;
    @FXML private ProgressBar overallProgressBar;
    @FXML private Label totalTargetLabel;
    @FXML private Label totalCurrentLabel;
    @FXML private Label averageProgressLabel;

    @FXML private ProgressBar progressBar;
    @FXML private Label monthlyContributionLabel;
    @FXML private Label daysRemainingLabel;
    @FXML private VBox goalDetailsPane;

    private final GoalService goalService;
    private User currentUser;
    private GoalViewModel selectedGoal;
    private ObservableList<GoalViewModel> goals;

    @Autowired
    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        setupTableColumns();
        setupPriorityCombo();
        setupBindings();
        goalDetailsPane.setDisable(true);
        updateGoalData();
    }

    private void setupTableColumns() {
        nameColumn.setCellValueFactory(new PropertyValueFactory<>("name"));
        targetColumn.setCellValueFactory(new PropertyValueFactory<>("targetAmount"));
        currentColumn.setCellValueFactory(new PropertyValueFactory<>("currentAmount"));
        deadlineColumn.setCellValueFactory(new PropertyValueFactory<>("deadline"));
        progressColumn.setCellValueFactory(new PropertyValueFactory<>("progress"));
    }

    private void setupPriorityCombo() {
        priorityCombo.getItems().addAll(
            "High",
            "Medium",
            "Low"
        );
    }

    private void setupBindings() {
        progressBar.progressProperty().bind(
            Bindings.createDoubleBinding(() -> 
                selectedGoal != null ? selectedGoal.getProgress() : 0,
                goalTable.getSelectionModel().selectedItemProperty()
            )
        );

        monthlyContributionLabel.textProperty().bind(
            Bindings.createStringBinding(() ->
                selectedGoal != null ? String.format("Monthly Contribution Needed: $%.2f", 
                    selectedGoal.getMonthlyContribution()) : "",
                goalTable.getSelectionModel().selectedItemProperty()
            )
        );

        daysRemainingLabel.textProperty().bind(
            Bindings.createStringBinding(() ->
                selectedGoal != null ? String.format("Days Remaining: %d", 
                    selectedGoal.getDaysRemaining()) : "",
                goalTable.getSelectionModel().selectedItemProperty()
            )
        );
    }

    @FXML
    private void handleAddGoal() {
        try {
            String name = goalNameField.getText();
            double targetAmount = Double.parseDouble(targetAmountField.getText());
            double currentAmount = Double.parseDouble(currentAmountField.getText());
            LocalDate deadline = deadlinePicker.getValue();
            String priority = priorityCombo.getValue();

            if (name.isEmpty() || deadline == null || priority == null) {
                showError("Invalid Input", "Please fill in all fields.");
                return;
            }

            Goal goal = new Goal();
            goal.setName(name);
            goal.setTargetAmount(BigDecimal.valueOf(targetAmount));
            goal.setCurrentAmount(BigDecimal.valueOf(currentAmount));
            goal.setDeadline(deadline);
            goal.setPriority(priority);
            goal.setUser(currentUser);

            goal = goalService.save(goal);
            goals.add(new GoalViewModel(goal));
            clearInputFields();
            updateGoalData();
            logger.info("Added new goal: {}", name);

        } catch (NumberFormatException e) {
            showError("Invalid Input", "Please enter valid numbers for target and current amounts.");
            logger.error("Error parsing goal input", e);
        } catch (Exception e) {
            showError("Error", "Failed to add goal.");
            logger.error("Error adding goal", e);
        }
    }

    private void updateGoalData() {
        loadUserGoals();

        double totalTarget = goalService.getTotalTargetAmount();
        double totalCurrent = goalService.getTotalCurrentAmount();
        double averageProgress = goalService.getAverageProgress();

        totalTargetLabel.setText(String.format("$%.2f", totalTarget));
        totalCurrentLabel.setText(String.format("$%.2f", totalCurrent));
        averageProgressLabel.setText(String.format("%.1f%%", averageProgress * 100));
        overallProgressBar.setProgress(averageProgress);
    }

    private void clearInputFields() {
        goalNameField.clear();
        targetAmountField.clear();
        currentAmountField.clear();
        deadlinePicker.setValue(null);
        priorityCombo.setValue(null);
    }

    private void showError(String title, String content) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
        loadUserGoals();
    }

    private void loadUserGoals() {
        List<Goal> userGoals = goalService.findByUser(currentUser);
        goals = FXCollections.observableArrayList(
            userGoals.stream()
                .map(GoalViewModel::new)
                .collect(Collectors.toList())
        );
        goalTable.setItems(goals);
    }

    private void onGoalSelected(GoalViewModel goal) {
        selectedGoal = goal;
        goalDetailsPane.setDisable(goal == null);

        if (goal != null) {
            nameColumn.setText(goal.getName());
            targetColumn.setText(String.format("%.2f", goal.getTargetAmount()));
            currentColumn.setText(String.format("%.2f", goal.getCurrentAmount()));
            deadlineColumn.setText(goal.getDeadline().toString());
            progressColumn.setText(String.format("%.1f%%", goal.getProgress() * 100));
        } else {
            clearFields();
        }
    }

    @FXML
    void handleUpdateGoal() {
        if (selectedGoal == null) {
            showError("Error", "Please select a goal to update.");
            return;
        }

        try {
            String name = goalNameField.getText();
            double targetAmount = Double.parseDouble(targetAmountField.getText());
            double currentAmount = Double.parseDouble(currentAmountField.getText());
            LocalDate deadline = deadlinePicker.getValue();
            String priority = priorityCombo.getValue();

            if (!validateInput(name, targetAmount, currentAmount, deadline, priority)) {
                return;
            }

            selectedGoal.setName(name);
            selectedGoal.setTargetAmount(targetAmount);
            selectedGoal.setCurrentAmount(currentAmount);
            selectedGoal.setDeadline(deadline);
            selectedGoal.setPriority(priority);

            selectedGoal.updateModel();
            goalService.save(selectedGoal.getModel());
            selectedGoal.updateFromModel();
            goalTable.refresh();
        } catch (NumberFormatException e) {
            showError("Invalid Input", "Please enter valid numbers for amounts.");
        } catch (Exception e) {
            showError("Error", "Could not update goal: " + e.getMessage());
        }
    }

    @FXML
    void handleDeleteGoal() {
        if (selectedGoal == null) {
            showError("Error", "Please select a goal to delete.");
            return;
        }

        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Delete Goal");
        alert.setHeaderText("Delete " + selectedGoal.getName());
        alert.setContentText("Are you sure you want to delete this goal?");

        if (alert.showAndWait().orElse(ButtonType.CANCEL) == ButtonType.OK) {
            goalService.delete(selectedGoal.getModel());
            goals.remove(selectedGoal);
            selectedGoal = null;
            clearFields();
        }
    }

    private boolean validateInput(String name, double targetAmount, double currentAmount, 
                                LocalDate deadline, String priority) {
        if (name == null || name.trim().isEmpty()) {
            showError("Validation Error", "Name is required.");
            return false;
        }

        if (targetAmount <= 0) {
            showError("Validation Error", "Target amount must be greater than zero.");
            return false;
        }

        if (currentAmount < 0) {
            showError("Validation Error", "Current amount cannot be negative.");
            return false;
        }

        if (deadline == null) {
            showError("Validation Error", "Deadline is required.");
            return false;
        }

        if (deadline.isBefore(LocalDate.now())) {
            showError("Validation Error", "Deadline must be in the future.");
            return false;
        }

        if (priority == null || priority.trim().isEmpty()) {
            showError("Validation Error", "Priority is required.");
            return false;
        }

        return true;
    }

    private void clearFields() {
        goalNameField.clear();
        targetAmountField.clear();
        currentAmountField.clear();
        deadlinePicker.setValue(null);
        priorityCombo.setValue(null);
    }
} 