package com.financialadviser.model;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class UserTest {

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPassword("password123");
        user.setEmail("test@example.com");
    }

    @Test
    void gettersAndSetters_ShouldWorkCorrectly() {
        assertThat(user.getId()).isEqualTo(1L);
        assertThat(user.getUsername()).isEqualTo("testuser");
        assertThat(user.getPassword()).isEqualTo("password123");
        assertThat(user.getEmail()).isEqualTo("test@example.com");
        assertThat(user.getBudgets()).isEmpty();
    }

    @Test
    void addBudget_ShouldAddBudgetAndSetUser() {
        Budget budget = new Budget();
        budget.setId(1L);
        budget.setName("Test Budget");

        user.addBudget(budget);

        assertThat(user.getBudgets()).contains(budget);
        assertThat(budget.getUser()).isEqualTo(user);
    }

    @Test
    void removeBudget_ShouldRemoveBudgetAndUnsetUser() {
        Budget budget = new Budget();
        budget.setId(1L);
        budget.setName("Test Budget");

        user.addBudget(budget);
        user.removeBudget(budget);

        assertThat(user.getBudgets()).doesNotContain(budget);
        assertThat(budget.getUser()).isNull();
    }
} 