package com.financialadviser;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.financialadviser.model.User;
import com.financialadviser.service.FinancialAnalysisService;
import com.financialadviser.service.PredictionService;

@SpringBootTest
class FinancialPlannerApplicationTests {

    @Autowired
    private FinancialAnalysisService financialAnalysisService;

    @Autowired
    private PredictionService predictionService;

    @Test
    void contextLoads() {
        assertNotNull(financialAnalysisService);
        assertNotNull(predictionService);
    }

    @Test
    void testFinancialAnalysisService() {
        User user = createSampleUser();
        
        int healthScore = financialAnalysisService.calculateFinancialHealthScore(user);
        assertTrue(healthScore >= 0 && healthScore <= 100);
        
        double debtRatio = financialAnalysisService.calculateDebtToIncomeRatio(user);
        assertTrue(debtRatio >= 0);
        
        double savingsRate = financialAnalysisService.calculateSavingsRate(user);
        assertTrue(savingsRate >= 0);
    }

    @Test
    void testPredictionService() {
        User user = createSampleUser();
        
        var retirementProjection = predictionService.projectRetirementSavings(user);
        assertNotNull(retirementProjection);
        
        var debtProjection = predictionService.projectDebtPayoff(user);
        assertNotNull(debtProjection);
        
        var tenYearProjection = predictionService.generate10YearProjection(user);
        assertNotNull(tenYearProjection);
        assertTrue(tenYearProjection.size() == 10);
    }

    private User createSampleUser() {
        User user = new User();
        user.setMonthlyIncome(BigDecimal.valueOf(5000));
        user.setMonthlyExpenses(BigDecimal.valueOf(3500));
        user.setMonthlySavings(BigDecimal.valueOf(1000));
        user.setEmergencyFund(BigDecimal.valueOf(15000));
        user.setOtherAssets(BigDecimal.valueOf(25000));
        user.setBirthDate(LocalDate.of(1985, 6, 15));
        user.setTargetRetirementAge(65);
        user.setRiskTolerance(3);
        return user;
    }
} 