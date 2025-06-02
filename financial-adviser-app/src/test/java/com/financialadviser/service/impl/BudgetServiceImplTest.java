package com.financialadviser.service.impl;

import com.financialadviser.model.Budget;
import com.financialadviser.model.BudgetCategory;
import com.financialadviser.model.Transaction;
import com.financialadviser.model.User;
import com.financialadviser.repository.BudgetRepository;
import com.financialadviser.repository.BudgetCategoryRepository;
import com.financialadviser.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetServiceImplTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private BudgetCategoryRepository categoryRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private BudgetServiceImpl budgetService;

    private User testUser;
    private Budget testBudget;
    private BudgetCategory testCategory;
    private Transaction testTransaction;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testBudget = new Budget();
        testBudget.setId(1L);
        testBudget.setUser(testUser);
        testBudget.setName("Test Budget");
        testBudget.setStartDate(LocalDate.now());
        testBudget.setEndDate(LocalDate.now().plusMonths(1));
        testBudget.setTotalAmount(new BigDecimal("1000.00"));

        testCategory = new BudgetCategory();
        testCategory.setId(1L);
        testCategory.setBudget(testBudget);
        testCategory.setName("Test Category");
        testCategory.setAllocatedAmount(new BigDecimal("500.00"));

        testTransaction = new Transaction();
        testTransaction.setId(1L);
        testTransaction.setBudget(testBudget);
        testTransaction.setCategory(testCategory);
        testTransaction.setDescription("Test Transaction");
        testTransaction.setAmount(new BigDecimal("100.00"));
        testTransaction.setType(Transaction.TransactionType.EXPENSE);
        testTransaction.setTransactionDate(LocalDateTime.now());
    }

    @Test
    void createBudget_ShouldCreateAndReturnNewBudget() {
        when(budgetRepository.save(any(Budget.class))).thenReturn(testBudget);

        Budget result = budgetService.createBudget(
            testUser,
            "Test Budget",
            LocalDate.now(),
            LocalDate.now().plusMonths(1),
            new BigDecimal("1000.00")
        );

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Test Budget");
        assertThat(result.getUser()).isEqualTo(testUser);
        verify(budgetRepository).save(any(Budget.class));
    }

    @Test
    void findById_ShouldReturnBudget() {
        when(budgetRepository.findById(1L)).thenReturn(Optional.of(testBudget));

        Optional<Budget> result = budgetService.findById(1L);

        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(testBudget);
    }

    @Test
    void findByUser_ShouldReturnUserBudgets() {
        when(budgetRepository.findByUser(testUser)).thenReturn(Arrays.asList(testBudget));

        List<Budget> results = budgetService.findByUser(testUser);

        assertThat(results).hasSize(1);
        assertThat(results.get(0)).isEqualTo(testBudget);
    }

    @Test
    void addCategory_ShouldCreateAndReturnNewCategory() {
        when(categoryRepository.save(any(BudgetCategory.class))).thenReturn(testCategory);

        BudgetCategory result = budgetService.addCategory(
            testBudget,
            "Test Category",
            new BigDecimal("500.00")
        );

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Test Category");
        assertThat(result.getBudget()).isEqualTo(testBudget);
        verify(categoryRepository).save(any(BudgetCategory.class));
    }

    @Test
    void findCategoriesByBudget_ShouldReturnCategories() {
        when(categoryRepository.findByBudget(testBudget)).thenReturn(Arrays.asList(testCategory));

        List<BudgetCategory> results = budgetService.findCategoriesByBudget(testBudget);

        assertThat(results).hasSize(1);
        assertThat(results.get(0)).isEqualTo(testCategory);
    }

    @Test
    void addTransaction_ShouldCreateAndReturnNewTransaction() {
        when(transactionRepository.save(any(Transaction.class))).thenReturn(testTransaction);

        Transaction result = budgetService.addTransaction(
            testBudget,
            testCategory,
            "Test Transaction",
            new BigDecimal("100.00"),
            Transaction.TransactionType.EXPENSE
        );

        assertThat(result).isNotNull();
        assertThat(result.getDescription()).isEqualTo("Test Transaction");
        assertThat(result.getAmount()).isEqualTo(new BigDecimal("100.00"));
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void findTransactionsByBudget_ShouldReturnTransactions() {
        when(transactionRepository.findByBudgetOrderByTransactionDateDesc(testBudget))
            .thenReturn(Arrays.asList(testTransaction));

        List<Transaction> results = budgetService.findTransactionsByBudget(testBudget);

        assertThat(results).hasSize(1);
        assertThat(results.get(0)).isEqualTo(testTransaction);
    }

    @Test
    void calculateTotalSpent_ShouldReturnCorrectAmount() {
        Transaction expense1 = new Transaction();
        expense1.setType(Transaction.TransactionType.EXPENSE);
        expense1.setAmount(new BigDecimal("100.00"));

        Transaction expense2 = new Transaction();
        expense2.setType(Transaction.TransactionType.EXPENSE);
        expense2.setAmount(new BigDecimal("200.00"));

        Transaction income = new Transaction();
        income.setType(Transaction.TransactionType.INCOME);
        income.setAmount(new BigDecimal("500.00"));

        when(transactionRepository.findByBudgetOrderByTransactionDateDesc(testBudget))
            .thenReturn(Arrays.asList(expense1, expense2, income));

        BigDecimal result = budgetService.calculateTotalSpent(testBudget);

        assertThat(result).isEqualTo(new BigDecimal("300.00"));
    }

    @Test
    void calculateRemainingAmount_ShouldReturnCorrectAmount() {
        testBudget.setTotalAmount(new BigDecimal("1000.00"));

        Transaction expense = new Transaction();
        expense.setType(Transaction.TransactionType.EXPENSE);
        expense.setAmount(new BigDecimal("300.00"));

        when(transactionRepository.findByBudgetOrderByTransactionDateDesc(testBudget))
            .thenReturn(Arrays.asList(expense));

        BigDecimal result = budgetService.calculateRemainingAmount(testBudget);

        assertThat(result).isEqualTo(new BigDecimal("700.00"));
    }

    @Test
    void calculateCategorySpent_ShouldReturnCorrectAmount() {
        Transaction expense1 = new Transaction();
        expense1.setType(Transaction.TransactionType.EXPENSE);
        expense1.setAmount(new BigDecimal("150.00"));

        Transaction expense2 = new Transaction();
        expense2.setType(Transaction.TransactionType.EXPENSE);
        expense2.setAmount(new BigDecimal("250.00"));

        when(transactionRepository.findByCategory(testCategory))
            .thenReturn(Arrays.asList(expense1, expense2));

        BigDecimal result = budgetService.calculateCategorySpent(testCategory);

        assertThat(result).isEqualTo(new BigDecimal("400.00"));
    }

    @Test
    void calculateCategoryRemaining_ShouldReturnCorrectAmount() {
        testCategory.setAllocatedAmount(new BigDecimal("500.00"));

        Transaction expense = new Transaction();
        expense.setType(Transaction.TransactionType.EXPENSE);
        expense.setAmount(new BigDecimal("300.00"));

        when(transactionRepository.findByCategory(testCategory))
            .thenReturn(Arrays.asList(expense));

        BigDecimal result = budgetService.calculateCategoryRemaining(testCategory);

        assertThat(result).isEqualTo(new BigDecimal("200.00"));
    }
} 