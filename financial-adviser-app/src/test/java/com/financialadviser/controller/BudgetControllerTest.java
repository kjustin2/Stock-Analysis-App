package com.financialadviser.controller;

import com.financialadviser.model.Budget;
import com.financialadviser.model.BudgetCategory;
import com.financialadviser.model.Transaction;
import com.financialadviser.model.User;
import com.financialadviser.service.BudgetService;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.testfx.framework.junit5.ApplicationExtension;
import org.testfx.framework.junit5.Start;
import org.testfx.util.WaitForAsyncUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith({MockitoExtension.class, ApplicationExtension.class})
class BudgetControllerTest {

    @Mock
    private BudgetService budgetService;

    private BudgetController budgetController;
    private User testUser;
    private Budget testBudget;
    private BudgetCategory testCategory;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testBudget = new Budget();
        testBudget.setId(1L);
        testBudget.setName("Test Budget");
        testBudget.setStartDate(LocalDate.now());
        testBudget.setEndDate(LocalDate.now().plusMonths(1));
        testBudget.setTotalAmount(BigDecimal.valueOf(5000));
        testBudget.setUser(testUser);

        testCategory = new BudgetCategory();
        testCategory.setId(1L);
        testCategory.setName("Test Category");
        testCategory.setAllocatedAmount(BigDecimal.valueOf(1000));
        testCategory.setBudget(testBudget);
    }

    @Start
    private void start(Stage stage) {
        budgetController = new BudgetController();
        budgetController.budgetService = budgetService;

        Platform.runLater(() -> {
            initializeUIComponents();
            setupTestScene(stage);
            budgetController.initialize();
        });
        
        WaitForAsyncUtils.waitForFxEvents();
    }

    private void initializeUIComponents() {
        budgetController.budgetTable = new TableView<>();
        budgetController.categoryTable = new TableView<>();
        budgetController.transactionTable = new TableView<>();
        budgetController.budgetDetailsPane = new VBox();
        
        budgetController.budgetNameField = new TextField();
        budgetController.startDatePicker = new DatePicker();
        budgetController.endDatePicker = new DatePicker();
        budgetController.totalAmountField = new TextField();
        
        budgetController.categoryNameField = new TextField();
        budgetController.categoryAmountField = new TextField();
        
        budgetController.transactionDescriptionField = new TextField();
        budgetController.transactionAmountField = new TextField();
        budgetController.transactionTypeCombo = new ComboBox<>();
        
        budgetController.totalSpentLabel = new Label();
        budgetController.remainingAmountLabel = new Label();

        // Initialize ObservableLists
        budgetController.budgets = FXCollections.observableArrayList();
        budgetController.categories = FXCollections.observableArrayList();
        budgetController.transactions = FXCollections.observableArrayList();
    }

    private void setupTestScene(Stage stage) {
        VBox root = new VBox(
            budgetController.budgetTable,
            budgetController.categoryTable,
            budgetController.transactionTable,
            budgetController.budgetDetailsPane
        );
        stage.setScene(new Scene(root));
        stage.show();
    }

    @Test
    void setCurrentUser_ShouldLoadUserBudgets() {
        // Given
        List<Budget> budgets = List.of(testBudget);
        when(budgetService.findByUser(testUser)).thenReturn(budgets);

        // When
        Platform.runLater(() -> budgetController.setCurrentUser(testUser));
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(budgetService).findByUser(testUser);
        assertThat(budgetController.budgetTable.getItems()).containsExactly(testBudget);
    }

    @Test
    void handleCreateBudget_WithValidInput_ShouldCreateNewBudget() {
        // Given
        budgetController.setCurrentUser(testUser);
        when(budgetService.createBudget(any(), any(), any(), any(), any())).thenReturn(testBudget);

        // When
        Platform.runLater(() -> {
            budgetController.budgetNameField.setText("Test Budget");
            budgetController.startDatePicker.setValue(LocalDate.now());
            budgetController.endDatePicker.setValue(LocalDate.now().plusMonths(1));
            budgetController.totalAmountField.setText("5000");
            budgetController.handleCreateBudget();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(budgetService).createBudget(
            eq(testUser),
            eq("Test Budget"),
            eq(LocalDate.now()),
            eq(LocalDate.now().plusMonths(1)),
            eq(BigDecimal.valueOf(5000))
        );
    }

    @Test
    void handleCreateBudget_WithInvalidInput_ShouldNotCreateBudget() {
        // When
        Platform.runLater(() -> {
            budgetController.budgetNameField.setText("");
            budgetController.startDatePicker.setValue(null);
            budgetController.endDatePicker.setValue(null);
            budgetController.totalAmountField.setText("0");
            budgetController.handleCreateBudget();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(budgetService, never()).createBudget(any(), any(), any(), any(), any());
    }

    @Test
    void handleAddCategory_WithValidInput_ShouldAddNewCategory() {
        // Given
        when(budgetService.addCategory(any(), any(), any())).thenReturn(testCategory);
        
        // When
        Platform.runLater(() -> {
            budgetController.selectedBudget = testBudget;
            budgetController.categoryNameField.setText("Test Category");
            budgetController.categoryAmountField.setText("1000");
            budgetController.handleAddCategory();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(budgetService).addCategory(
            eq(testBudget),
            eq("Test Category"),
            eq(BigDecimal.valueOf(1000))
        );
    }

    @Test
    void handleAddCategory_WithoutSelectedBudget_ShouldNotAddCategory() {
        // When
        Platform.runLater(() -> {
            budgetController.selectedBudget = null;
            budgetController.categoryNameField.setText("Test Category");
            budgetController.categoryAmountField.setText("1000");
            budgetController.handleAddCategory();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(budgetService, never()).addCategory(any(), any(), any());
    }

    @Test
    void handleAddTransaction_WithValidInput_ShouldAddNewTransaction() {
        // Given
        Transaction testTransaction = new Transaction();
        testTransaction.setId(1L);
        testTransaction.setDescription("Test Transaction");
        testTransaction.setAmount(BigDecimal.valueOf(100));
        testTransaction.setType(Transaction.TransactionType.EXPENSE);
        testTransaction.setTransactionDate(LocalDateTime.now());

        when(budgetService.addTransaction(any(), any(), any(), any(), any())).thenReturn(testTransaction);

        // When
        Platform.runLater(() -> {
            budgetController.selectedBudget = testBudget;
            budgetController.selectedCategory = testCategory;
            budgetController.transactionDescriptionField.setText("Test Transaction");
            budgetController.transactionAmountField.setText("100");
            budgetController.transactionTypeCombo.setValue(Transaction.TransactionType.EXPENSE);
            budgetController.handleAddTransaction();
        });
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(budgetService).addTransaction(
            eq(testBudget),
            eq(testCategory),
            eq("Test Transaction"),
            eq(BigDecimal.valueOf(100)),
            eq(Transaction.TransactionType.EXPENSE)
        );
    }

    @Test
    void onBudgetSelected_ShouldUpdateCategoriesAndSummary() {
        // Given
        List<BudgetCategory> categories = List.of(testCategory);
        when(budgetService.findCategoriesByBudget(testBudget)).thenReturn(categories);
        when(budgetService.calculateTotalSpent(testBudget)).thenReturn(BigDecimal.valueOf(500));
        when(budgetService.calculateRemainingAmount(testBudget)).thenReturn(BigDecimal.valueOf(4500));

        // When
        Platform.runLater(() -> budgetController.onBudgetSelected(testBudget));
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(budgetService).findCategoriesByBudget(testBudget);
        verify(budgetService).calculateTotalSpent(testBudget);
        verify(budgetService).calculateRemainingAmount(testBudget);
        
        assertThat(budgetController.categoryTable.getItems()).containsExactly(testCategory);
        assertThat(budgetController.totalSpentLabel.getText()).contains("500");
        assertThat(budgetController.remainingAmountLabel.getText()).contains("4500");
    }

    @Test
    void onCategorySelected_ShouldUpdateTransactions() {
        // Given
        Transaction testTransaction = new Transaction();
        testTransaction.setDescription("Test Transaction");
        testTransaction.setAmount(BigDecimal.valueOf(100));
        testTransaction.setType(Transaction.TransactionType.EXPENSE);
        List<Transaction> transactions = List.of(testTransaction);
        
        when(budgetService.findTransactionsByCategory(testCategory)).thenReturn(transactions);

        // When
        Platform.runLater(() -> budgetController.onCategorySelected(testCategory));
        WaitForAsyncUtils.waitForFxEvents();

        // Then
        verify(budgetService).findTransactionsByCategory(testCategory);
        assertThat(budgetController.transactionTable.getItems()).containsExactly(testTransaction);
    }
}