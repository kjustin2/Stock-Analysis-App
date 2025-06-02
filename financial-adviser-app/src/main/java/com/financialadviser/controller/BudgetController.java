package com.financialadviser.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;

import com.financialadviser.model.Budget;
import com.financialadviser.model.BudgetCategory;
import com.financialadviser.model.Transaction;
import com.financialadviser.model.User;
import com.financialadviser.service.BudgetService;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ComboBox;
import javafx.scene.control.DatePicker;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;

@Controller
public class BudgetController {
    private static final Logger logger = LogManager.getLogger(BudgetController.class);

    @FXML
    TableView<Budget> budgetTable;
    
    @FXML
    TableView<BudgetCategory> categoryTable;
    
    @FXML
    TableView<Transaction> transactionTable;
    
    @FXML
    TextField budgetNameField;
    
    @FXML
    DatePicker startDatePicker;
    
    @FXML
    DatePicker endDatePicker;
    
    @FXML
    TextField totalAmountField;
    
    @FXML
    TextField categoryNameField;
    
    @FXML
    TextField categoryAmountField;
    
    @FXML
    TextField transactionDescriptionField;
    
    @FXML
    TextField transactionAmountField;
    
    @FXML
    ComboBox<Transaction.TransactionType> transactionTypeCombo;
    
    @FXML
    Label totalSpentLabel;
    
    @FXML
    Label remainingAmountLabel;
    
    @FXML
    VBox budgetDetailsPane;

    @Autowired
    BudgetService budgetService;

    Budget selectedBudget;
    BudgetCategory selectedCategory;
    private User currentUser;

    ObservableList<Budget> budgets;
    ObservableList<BudgetCategory> categories;
    ObservableList<Transaction> transactions;

    @FXML
    public void initialize() {
        setupTables();
        setupComboBoxes();
        setupEventHandlers();
        budgetDetailsPane.setDisable(true);
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
        loadUserBudgets();
    }

    private void setupTables() {
        // Budget table columns
        TableColumn<Budget, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(
            cellData.getValue().getName()));

        TableColumn<Budget, LocalDate> startDateCol = new TableColumn<>("Start Date");
        startDateCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(
            cellData.getValue().getStartDate()));

        TableColumn<Budget, LocalDate> endDateCol = new TableColumn<>("End Date");
        endDateCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(
            cellData.getValue().getEndDate()));

        TableColumn<Budget, String> amountCol = new TableColumn<>("Total Amount");
        amountCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(
            cellData.getValue().getTotalAmount().toString()));

        budgetTable.getColumns().addAll(nameCol, startDateCol, endDateCol, amountCol);

        // Category table columns
        TableColumn<BudgetCategory, String> categoryNameCol = new TableColumn<>("Category");
        categoryNameCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(
            cellData.getValue().getName()));

        TableColumn<BudgetCategory, String> allocatedCol = new TableColumn<>("Allocated");
        allocatedCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(
            cellData.getValue().getAllocatedAmount().toString()));

        categoryTable.getColumns().addAll(categoryNameCol, allocatedCol);

        // Transaction table columns
        TableColumn<Transaction, String> descCol = new TableColumn<>("Description");
        descCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(
            cellData.getValue().getDescription()));

        TableColumn<Transaction, String> transAmountCol = new TableColumn<>("Amount");
        transAmountCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(
            cellData.getValue().getAmount().toString()));

        TableColumn<Transaction, String> typeCol = new TableColumn<>("Type");
        typeCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(
            cellData.getValue().getType().toString()));

        transactionTable.getColumns().addAll(descCol, transAmountCol, typeCol);
    }

    private void setupComboBoxes() {
        transactionTypeCombo.setItems(FXCollections.observableArrayList(
            Transaction.TransactionType.values()));
    }

    private void setupEventHandlers() {
        budgetTable.getSelectionModel().selectedItemProperty().addListener(
            (obs, oldSelection, newSelection) -> onBudgetSelected(newSelection));

        categoryTable.getSelectionModel().selectedItemProperty().addListener(
            (obs, oldSelection, newSelection) -> onCategorySelected(newSelection));
    }

    private void loadUserBudgets() {
        try {
            List<Budget> userBudgets = budgetService.findByUser(currentUser);
            budgets = FXCollections.observableArrayList(userBudgets);
            budgetTable.setItems(budgets);
        } catch (Exception e) {
            logger.error("Error loading user budgets", e);
            showError("Error", "Could not load budgets.");
        }
    }

    @FXML
    void handleCreateBudget() {
        try {
            String name = budgetNameField.getText();
            LocalDate startDate = startDatePicker.getValue();
            LocalDate endDate = endDatePicker.getValue();
            BigDecimal amount = new BigDecimal(totalAmountField.getText());

            if (!validateBudgetInput(name, startDate, endDate, amount)) {
                return;
            }

            Budget budget = budgetService.createBudget(currentUser, name, startDate, endDate, amount);
            budgets.add(budget);
            clearBudgetFields();
            logger.info("Budget created successfully: {}", name);
        } catch (Exception e) {
            logger.error("Error creating budget", e);
            showError("Error", "Could not create budget.");
        }
    }

    @FXML
    void handleAddCategory() {
        try {
            if (selectedBudget == null) {
                showError("Error", "Please select a budget first.");
                return;
            }

            String name = categoryNameField.getText();
            BigDecimal amount = new BigDecimal(categoryAmountField.getText());

            if (!validateCategoryInput(name, amount)) {
                return;
            }

            BudgetCategory category = budgetService.addCategory(selectedBudget, name, amount);
            categories.add(category);
            clearCategoryFields();
            logger.info("Category added successfully: {}", name);
        } catch (Exception e) {
            logger.error("Error adding category", e);
            showError("Error", "Could not add category.");
        }
    }

    @FXML
    void handleAddTransaction() {
        try {
            if (selectedBudget == null || selectedCategory == null) {
                showError("Error", "Please select a budget and category first.");
                return;
            }

            String description = transactionDescriptionField.getText();
            BigDecimal amount = new BigDecimal(transactionAmountField.getText());
            Transaction.TransactionType type = transactionTypeCombo.getValue();

            if (!validateTransactionInput(description, amount, type)) {
                return;
            }

            Transaction transaction = budgetService.addTransaction(
                selectedBudget, selectedCategory, description, amount, type);
            transactions.add(transaction);
            updateBudgetSummary();
            clearTransactionFields();
            logger.info("Transaction added successfully: {}", description);
        } catch (Exception e) {
            logger.error("Error adding transaction", e);
            showError("Error", "Could not add transaction.");
        }
    }

    void onBudgetSelected(Budget budget) {
        selectedBudget = budget;
        budgetDetailsPane.setDisable(budget == null);

        if (budget != null) {
            categories = FXCollections.observableArrayList(
                budgetService.findCategoriesByBudget(budget));
            categoryTable.setItems(categories);
            updateBudgetSummary();
        } else {
            categories.clear();
            transactions.clear();
        }
    }

    void onCategorySelected(BudgetCategory category) {
        selectedCategory = category;
        if (category != null) {
            transactions = FXCollections.observableArrayList(
                budgetService.findTransactionsByCategory(category));
            transactionTable.setItems(transactions);
        } else {
            transactions.clear();
        }
    }

    private void updateBudgetSummary() {
        if (selectedBudget != null) {
            BigDecimal totalSpent = budgetService.calculateTotalSpent(selectedBudget);
            BigDecimal remaining = budgetService.calculateRemainingAmount(selectedBudget);
            
            totalSpentLabel.setText(String.format("Total Spent: $%.2f", totalSpent));
            remainingAmountLabel.setText(String.format("Remaining: $%.2f", remaining));
        }
    }

    private boolean validateBudgetInput(String name, LocalDate startDate, LocalDate endDate, BigDecimal amount) {
        if (name.isEmpty() || startDate == null || endDate == null) {
            showError("Validation Error", "All fields are required.");
            return false;
        }

        if (endDate.isBefore(startDate)) {
            showError("Validation Error", "End date must be after start date.");
            return false;
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            showError("Validation Error", "Amount must be greater than zero.");
            return false;
        }

        return true;
    }

    private boolean validateCategoryInput(String name, BigDecimal amount) {
        if (name.isEmpty()) {
            showError("Validation Error", "Category name is required.");
            return false;
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            showError("Validation Error", "Amount must be greater than zero.");
            return false;
        }

        return true;
    }

    private boolean validateTransactionInput(String description, BigDecimal amount, Transaction.TransactionType type) {
        if (description.isEmpty() || type == null) {
            showError("Validation Error", "All fields are required.");
            return false;
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            showError("Validation Error", "Amount must be greater than zero.");
            return false;
        }

        return true;
    }

    private void clearBudgetFields() {
        budgetNameField.clear();
        startDatePicker.setValue(null);
        endDatePicker.setValue(null);
        totalAmountField.clear();
    }

    private void clearCategoryFields() {
        categoryNameField.clear();
        categoryAmountField.clear();
    }

    private void clearTransactionFields() {
        transactionDescriptionField.clear();
        transactionAmountField.clear();
        transactionTypeCombo.setValue(null);
    }

    private void showError(String title, String content) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }
} 