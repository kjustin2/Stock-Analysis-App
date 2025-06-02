package com.financialadviser.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class BudgetCategoryTest {

    private Budget budget;
    private BudgetCategory category;
    private Transaction transaction;

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

        transaction = new Transaction();
        transaction.setId(1L);
        transaction.setDescription("Test Transaction");
        transaction.setAmount(new BigDecimal("100.00"));
        transaction.setType(Transaction.TransactionType.EXPENSE);
        transaction.setTransactionDate(LocalDateTime.now());
    }

    @Test
    void addTransaction_ShouldAddTransactionAndSetCategory() {
        category.addTransaction(transaction);

        assertThat(category.getTransactions()).contains(transaction);
        assertThat(transaction.getCategory()).isEqualTo(category);
    }

    @Test
    void removeTransaction_ShouldRemoveTransactionAndUnsetCategory() {
        category.addTransaction(transaction);
        category.removeTransaction(transaction);

        assertThat(category.getTransactions()).doesNotContain(transaction);
        assertThat(transaction.getCategory()).isNull();
    }

    @Test
    void gettersAndSetters_ShouldWorkCorrectly() {
        assertThat(category.getId()).isEqualTo(1L);
        assertThat(category.getName()).isEqualTo("Test Category");
        assertThat(category.getAllocatedAmount()).isEqualTo(new BigDecimal("500.00"));
        assertThat(category.getBudget()).isEqualTo(budget);
        assertThat(category.getTransactions()).isEmpty();
    }
} 