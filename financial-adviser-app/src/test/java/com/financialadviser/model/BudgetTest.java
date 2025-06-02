package com.financialadviser.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class BudgetTest {

    private Budget budget;
    private User user;
    private BudgetCategory category;
    private Transaction transaction;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        budget = new Budget();
        budget.setId(1L);
        budget.setName("Test Budget");
        budget.setStartDate(LocalDate.now());
        budget.setEndDate(LocalDate.now().plusMonths(1));
        budget.setTotalAmount(new BigDecimal("1000.00"));
        budget.setUser(user);

        category = new BudgetCategory();
        category.setId(1L);
        category.setName("Test Category");
        category.setAllocatedAmount(new BigDecimal("500.00"));

        transaction = new Transaction();
        transaction.setId(1L);
        transaction.setDescription("Test Transaction");
        transaction.setAmount(new BigDecimal("100.00"));
        transaction.setType(Transaction.TransactionType.EXPENSE);
    }

    @Test
    void addCategory_ShouldAddCategoryAndSetBudget() {
        budget.addCategory(category);

        assertThat(budget.getCategories()).contains(category);
        assertThat(category.getBudget()).isEqualTo(budget);
    }

    @Test
    void removeCategory_ShouldRemoveCategoryAndUnsetBudget() {
        budget.addCategory(category);
        budget.removeCategory(category);

        assertThat(budget.getCategories()).doesNotContain(category);
        assertThat(category.getBudget()).isNull();
    }

    @Test
    void addTransaction_ShouldAddTransactionAndSetBudget() {
        budget.addTransaction(transaction);

        assertThat(budget.getTransactions()).contains(transaction);
        assertThat(transaction.getBudget()).isEqualTo(budget);
    }

    @Test
    void removeTransaction_ShouldRemoveTransactionAndUnsetBudget() {
        budget.addTransaction(transaction);
        budget.removeTransaction(transaction);

        assertThat(budget.getTransactions()).doesNotContain(transaction);
        assertThat(transaction.getBudget()).isNull();
    }

    @Test
    void gettersAndSetters_ShouldWorkCorrectly() {
        assertThat(budget.getId()).isEqualTo(1L);
        assertThat(budget.getName()).isEqualTo("Test Budget");
        assertThat(budget.getStartDate()).isEqualTo(LocalDate.now());
        assertThat(budget.getEndDate()).isEqualTo(LocalDate.now().plusMonths(1));
        assertThat(budget.getTotalAmount()).isEqualTo(new BigDecimal("1000.00"));
        assertThat(budget.getUser()).isEqualTo(user);
    }
} 