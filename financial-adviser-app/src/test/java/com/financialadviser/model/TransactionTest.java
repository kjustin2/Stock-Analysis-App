package com.financialadviser.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class TransactionTest {

    private Budget budget;
    private BudgetCategory category;
    private Transaction transaction;
    private LocalDateTime transactionDate;

    @BeforeEach
    void setUp() {
        budget = new Budget();
        budget.setId(1L);
        budget.setName("Test Budget");
        budget.setStartDate(LocalDate.now());
        budget.setEndDate(LocalDate.now().plusMonths(1));
        budget.setTotalAmount(new BigDecimal("1000.00"));

        category = new BudgetCategory();
        category.setId(1L);
        category.setName("Test Category");
        category.setAllocatedAmount(new BigDecimal("500.00"));
        category.setBudget(budget);

        transactionDate = LocalDateTime.now();
        transaction = new Transaction();
        transaction.setId(1L);
        transaction.setDescription("Test Transaction");
        transaction.setAmount(new BigDecimal("100.00"));
        transaction.setType(Transaction.TransactionType.EXPENSE);
        transaction.setTransactionDate(transactionDate);
        transaction.setBudget(budget);
        transaction.setCategory(category);
    }

    @Test
    void gettersAndSetters_ShouldWorkCorrectly() {
        assertThat(transaction.getId()).isEqualTo(1L);
        assertThat(transaction.getDescription()).isEqualTo("Test Transaction");
        assertThat(transaction.getAmount()).isEqualTo(new BigDecimal("100.00"));
        assertThat(transaction.getType()).isEqualTo(Transaction.TransactionType.EXPENSE);
        assertThat(transaction.getTransactionDate()).isEqualTo(transactionDate);
        assertThat(transaction.getBudget()).isEqualTo(budget);
        assertThat(transaction.getCategory()).isEqualTo(category);
    }

    @Test
    void transactionType_ShouldHaveCorrectValues() {
        assertThat(Transaction.TransactionType.values()).containsExactly(
            Transaction.TransactionType.INCOME,
            Transaction.TransactionType.EXPENSE
        );
    }

    @Test
    void setBudget_ShouldUpdateBudgetReference() {
        Budget newBudget = new Budget();
        newBudget.setId(2L);
        newBudget.setName("New Budget");

        transaction.setBudget(newBudget);
        assertThat(transaction.getBudget()).isEqualTo(newBudget);
    }

    @Test
    void setCategory_ShouldUpdateCategoryReference() {
        BudgetCategory newCategory = new BudgetCategory();
        newCategory.setId(2L);
        newCategory.setName("New Category");

        transaction.setCategory(newCategory);
        assertThat(transaction.getCategory()).isEqualTo(newCategory);
    }
} 