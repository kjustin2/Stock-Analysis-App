package com.financialadviser.controller;

import java.math.BigDecimal;
import java.net.URL;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.ResourceBundle;
import java.util.stream.Collectors;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;

import com.financialadviser.model.Debt;
import com.financialadviser.model.User;
import com.financialadviser.service.DebtService;
import com.financialadviser.viewmodel.DebtViewModel;

import javafx.beans.binding.Bindings;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.chart.LineChart;
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
public class DebtController implements Initializable {
    private static final Logger logger = LogManager.getLogger(DebtController.class);

    @FXML private TextField debtDescriptionField;
    @FXML private TextField debtAmountField;
    @FXML private TextField interestRateField;
    @FXML private TextField minimumPaymentField;
    @FXML private ComboBox<String> debtTypeCombo;

    @FXML private TableView<DebtViewModel> debtTable;
    @FXML private TableColumn<DebtViewModel, String> descriptionColumn;
    @FXML private TableColumn<DebtViewModel, Number> amountColumn;
    @FXML private TableColumn<DebtViewModel, Number> interestRateColumn;
    @FXML private TableColumn<DebtViewModel, Number> minimumPaymentColumn;
    @FXML private TableColumn<DebtViewModel, Number> remainingColumn;

    @FXML private PieChart debtDistributionChart;
    @FXML private LineChart<String, Number> payoffChart;
    @FXML private ComboBox<String> payoffStrategyCombo;
    @FXML private TextField extraPaymentField;

    @FXML private Label totalDebtLabel;
    @FXML private Label totalMonthlyLabel;
    @FXML private Label totalInterestLabel;
    @FXML private Label debtFreeDateLabel;

    @FXML private DatePicker startDatePicker;
    @FXML private ProgressBar payoffProgressBar;
    @FXML private Label monthlyInterestLabel;
    @FXML private Label monthsToPayoffLabel;
    @FXML private VBox debtDetailsPane;

    private final DebtService debtService;
    private User currentUser;
    private DebtViewModel selectedDebt;
    private ObservableList<DebtViewModel> debts;

    @Autowired
    public DebtController(DebtService debtService) {
        this.debtService = debtService;
    }

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        setupTableColumns();
        setupDebtTypeCombo();
        setupPayoffStrategyCombo();
        setupBindings();
        debtDetailsPane.setDisable(true);
        updateDebtData();
    }

    private void setupTableColumns() {
        descriptionColumn.setCellValueFactory(new PropertyValueFactory<>("description"));
        amountColumn.setCellValueFactory(new PropertyValueFactory<>("totalAmount"));
        interestRateColumn.setCellValueFactory(new PropertyValueFactory<>("interestRate"));
        minimumPaymentColumn.setCellValueFactory(new PropertyValueFactory<>("minimumPayment"));
        remainingColumn.setCellValueFactory(new PropertyValueFactory<>("remainingAmount"));
    }

    private void setupDebtTypeCombo() {
        debtTypeCombo.setItems(FXCollections.observableArrayList(
            "Credit Card", "Student Loan", "Mortgage", "Auto Loan", "Personal Loan", "Other"
        ));
    }

    private void setupPayoffStrategyCombo() {
        payoffStrategyCombo.getItems().addAll(
            "Avalanche (Highest Interest First)",
            "Snowball (Lowest Balance First)"
        );
        payoffStrategyCombo.setValue("Avalanche (Highest Interest First)");
    }

    private void setupBindings() {
        payoffProgressBar.progressProperty().bind(
            Bindings.createDoubleBinding(() -> 
                selectedDebt != null ? selectedDebt.getPayoffProgress() : 0,
                debtTable.getSelectionModel().selectedItemProperty()
            )
        );

        monthlyInterestLabel.textProperty().bind(
            Bindings.createStringBinding(() ->
                selectedDebt != null ? String.format("Monthly Interest: $%.2f", 
                    selectedDebt.getMonthlyInterest()) : "",
                debtTable.getSelectionModel().selectedItemProperty()
            )
        );

        monthsToPayoffLabel.textProperty().bind(
            Bindings.createStringBinding(() -> {
                if (selectedDebt == null) return "";
                int months = selectedDebt.getMonthsToPayoff();
                if (months == Integer.MAX_VALUE) {
                    return "Will never be paid off with current payment";
                }
                return String.format("Months to payoff: %d", months);
            }, debtTable.getSelectionModel().selectedItemProperty())
        );
    }

    @FXML
    private void handleAddDebt() {
        try {
            String description = debtDescriptionField.getText();
            double totalAmount = Double.parseDouble(debtAmountField.getText());
            double interestRate = Double.parseDouble(interestRateField.getText());
            double minimumPayment = Double.parseDouble(minimumPaymentField.getText());
            String debtType = debtTypeCombo.getValue();

            if (description.isEmpty() || debtType == null) {
                showError("Invalid Input", "Please fill in all fields.");
                return;
            }

            Debt debt = new Debt();
            debt.setDescription(description);
            debt.setTotalAmount(BigDecimal.valueOf(totalAmount));
            debt.setInterestRate(BigDecimal.valueOf(interestRate));
            debt.setMinimumPayment(BigDecimal.valueOf(minimumPayment));
            debt.setDebtType(debtType);
            debt.setStartDate(LocalDate.now());
            debt.setRemainingAmount(BigDecimal.valueOf(totalAmount));
            debt.setUser(currentUser);

            debt = debtService.save(debt);
            debts.add(new DebtViewModel(debt));

            clearInputFields();
            updateDebtData();
            logger.info("Added new debt: {}", description);

        } catch (NumberFormatException e) {
            showError("Invalid Input", "Please enter valid numbers for amount, interest rate, and payment.");
            logger.error("Error parsing debt input", e);
        } catch (Exception e) {
            showError("Error", "Failed to add debt.");
            logger.error("Error adding debt", e);
        }
    }

    @FXML
    private void handleCalculatePayoff() {
        try {
            BigDecimal extraPayment = new BigDecimal(extraPaymentField.getText());
            String strategy = payoffStrategyCombo.getValue().startsWith("Avalanche") ? "avalanche" : "snowball";
            
            debtService.calculatePayoffStrategy(strategy, extraPayment);
            updateDebtData();
            logger.info("Calculated payoff strategy: {} with extra payment: ${}", strategy, extraPayment);

        } catch (NumberFormatException e) {
            showError("Invalid Input", "Please enter a valid number for extra payment.");
            logger.error("Error parsing extra payment input", e);
        } catch (Exception e) {
            showError("Error", "Failed to calculate payoff strategy.");
            logger.error("Error calculating payoff strategy", e);
        }
    }

    private void updateDebtData() {
        List<Debt> allDebts = debtService.findAll();
        debts = FXCollections.observableArrayList(
            allDebts.stream()
                .map(DebtViewModel::new)
                .collect(Collectors.toList())
        );
        debtTable.setItems(debts);
        debtDistributionChart.setData(debtService.getDebtDistribution());
        payoffChart.getData().setAll(debtService.getDebtReductionTrend());

        BigDecimal totalDebt = debtService.getTotalDebtAmount();
        BigDecimal monthlyPayment = debtService.getTotalMonthlyPayment();
        BigDecimal totalInterest = debtService.getTotalInterestPaid();
        LocalDate debtFreeDate = debtService.getProjectedDebtFreeDate();

        totalDebtLabel.setText(String.format("$%.2f", totalDebt.doubleValue()));
        totalMonthlyLabel.setText(String.format("$%.2f", monthlyPayment.doubleValue()));
        totalInterestLabel.setText(String.format("$%.2f", totalInterest.doubleValue()));
        debtFreeDateLabel.setText(debtFreeDate.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")));
    }

    private void clearInputFields() {
        debtDescriptionField.clear();
        debtAmountField.clear();
        interestRateField.clear();
        minimumPaymentField.clear();
        debtTypeCombo.setValue(null);
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
        loadUserDebts();
    }

    private void loadUserDebts() {
        List<Debt> userDebts = debtService.findByUser(currentUser);
        debts = FXCollections.observableArrayList(
            userDebts.stream()
                .map(DebtViewModel::new)
                .collect(Collectors.toList())
        );
        debtTable.setItems(debts);
    }

    private void onDebtSelected(DebtViewModel debt) {
        selectedDebt = debt;
        debtDetailsPane.setDisable(debt == null);

        if (debt != null) {
            debtDescriptionField.setText(debt.getDescription());
            debtAmountField.setText(String.format("%.2f", debt.getTotalAmount()));
            interestRateField.setText(String.format("%.2f", debt.getInterestRate()));
            minimumPaymentField.setText(String.format("%.2f", debt.getMinimumPayment()));
            debtTypeCombo.setValue(debt.getDebtType());
            startDatePicker.setValue(debt.getStartDate());
        } else {
            clearFields();
        }
    }

    @FXML
    void handleCreateDebt() {
        try {
            String description = debtDescriptionField.getText();
            double totalAmount = Double.parseDouble(debtAmountField.getText());
            double interestRate = Double.parseDouble(interestRateField.getText());
            double minimumPayment = Double.parseDouble(minimumPaymentField.getText());
            String debtType = debtTypeCombo.getValue();
            LocalDate startDate = startDatePicker.getValue();

            if (!validateInput(description, totalAmount, interestRate, minimumPayment, debtType, startDate)) {
                return;
            }

            Debt debt = new Debt();
            debt.setUser(currentUser);
            debt.setDescription(description);
            debt.setTotalAmount(BigDecimal.valueOf(totalAmount));
            debt.setInterestRate(BigDecimal.valueOf(interestRate));
            debt.setMinimumPayment(BigDecimal.valueOf(minimumPayment));
            debt.setDebtType(debtType);
            debt.setStartDate(startDate);
            debt.setRemainingAmount(BigDecimal.valueOf(totalAmount));

            debt = debtService.save(debt);
            debts.add(new DebtViewModel(debt));
            clearFields();
        } catch (NumberFormatException e) {
            showError("Invalid Input", "Please enter valid numbers for amounts and interest rate.");
        } catch (Exception e) {
            showError("Error", "Could not create debt: " + e.getMessage());
        }
    }

    @FXML
    void handleUpdateDebt() {
        if (selectedDebt == null) {
            showError("Error", "Please select a debt to update.");
            return;
        }

        try {
            String description = debtDescriptionField.getText();
            double totalAmount = Double.parseDouble(debtAmountField.getText());
            double interestRate = Double.parseDouble(interestRateField.getText());
            double minimumPayment = Double.parseDouble(minimumPaymentField.getText());
            String debtType = debtTypeCombo.getValue();
            LocalDate startDate = startDatePicker.getValue();

            if (!validateInput(description, totalAmount, interestRate, minimumPayment, debtType, startDate)) {
                return;
            }

            selectedDebt.setDescription(description);
            selectedDebt.setTotalAmount(BigDecimal.valueOf(totalAmount));
            selectedDebt.setInterestRate(BigDecimal.valueOf(interestRate));
            selectedDebt.setMinimumPayment(BigDecimal.valueOf(minimumPayment));
            selectedDebt.setDebtType(debtType);
            selectedDebt.setStartDate(startDate);

            selectedDebt.updateModel();
            debtService.save(selectedDebt.getModel());
            selectedDebt.updateFromModel();
            debtTable.refresh();
        } catch (NumberFormatException e) {
            showError("Invalid Input", "Please enter valid numbers for amounts and interest rate.");
        } catch (Exception e) {
            showError("Error", "Could not update debt: " + e.getMessage());
        }
    }

    @FXML
    void handleDeleteDebt() {
        if (selectedDebt == null) {
            showError("Error", "Please select a debt to delete.");
            return;
        }

        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Delete Debt");
        alert.setHeaderText("Delete " + selectedDebt.getDescription());
        alert.setContentText("Are you sure you want to delete this debt?");

        if (alert.showAndWait().orElse(ButtonType.CANCEL) == ButtonType.OK) {
            debtService.delete(selectedDebt.getModel());
            debts.remove(selectedDebt);
            selectedDebt = null;
            clearFields();
        }
    }

    private boolean validateInput(String description, double totalAmount, double interestRate, 
                                double minimumPayment, String debtType, LocalDate startDate) {
        if (description == null || description.trim().isEmpty()) {
            showError("Validation Error", "Description is required.");
            return false;
        }

        if (totalAmount <= 0) {
            showError("Validation Error", "Total amount must be greater than zero.");
            return false;
        }

        if (interestRate < 0) {
            showError("Validation Error", "Interest rate cannot be negative.");
            return false;
        }

        if (minimumPayment <= 0) {
            showError("Validation Error", "Minimum payment must be greater than zero.");
            return false;
        }

        if (debtType == null || debtType.trim().isEmpty()) {
            showError("Validation Error", "Debt type is required.");
            return false;
        }

        if (startDate == null) {
            showError("Validation Error", "Start date is required.");
            return false;
        }

        return true;
    }

    private void clearFields() {
        debtDescriptionField.clear();
        debtAmountField.clear();
        interestRateField.clear();
        minimumPaymentField.clear();
        debtTypeCombo.setValue(null);
        startDatePicker.setValue(null);
    }
} 