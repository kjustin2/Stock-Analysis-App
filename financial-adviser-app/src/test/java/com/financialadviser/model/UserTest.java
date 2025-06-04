package com.financialadviser.model;

import java.time.LocalDate;

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
        assertThat(user.getPassword()).isEqualTo("password123"); // Password is not encrypted in the model layer
        assertThat(user.getEmail()).isEqualTo("test@example.com");
        assertThat(user.getInvestments()).isEmpty();
    }

    @Test
    void addInvestment_ShouldAddInvestmentAndSetUser() {
        Investment investment = new Investment("AAPL", 10.0, 150.0, LocalDate.now(), "STOCKS");
        investment.setId(1L);

        user.addInvestment(investment);

        assertThat(user.getInvestments()).contains(investment);
        assertThat(investment.getUser()).isEqualTo(user);
    }

    @Test
    void removeInvestment_ShouldRemoveInvestmentAndUnsetUser() {
        Investment investment = new Investment("AAPL", 10.0, 150.0, LocalDate.now(), "STOCKS");
        investment.setId(1L);

        user.addInvestment(investment);
        user.removeInvestment(investment);

        assertThat(user.getInvestments()).doesNotContain(investment);
        assertThat(investment.getUser()).isNull();
    }
} 