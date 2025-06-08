package com.financialadviser.service;

import java.math.BigDecimal;
import java.util.Map;

import com.financialadviser.model.User;

public interface FinancialHealthService {
    // Core financial health indicators
    double calculateEmergencyFundHealth(User user);
    double calculateDebtToIncomeRatio(User user);
    double calculateSavingsRate(User user);
    double calculateNetWorth(User user);
    
    // Investment analysis
    Map<String, Double> getInvestmentAllocation(User user);
    double calculateInvestmentReturns(User user);
    
    // Retirement planning
    BigDecimal calculateRetirementProjection(User user);
    int calculateYearsToRetirement(User user);
    BigDecimal calculateRequiredMonthlySavings(User user);
    
    // Debt analysis
    Map<String, Double> getDebtDistribution(User user);
    BigDecimal calculateTotalMonthlyDebtPayments(User user);
    int calculateDebtFreeDate(User user);
    
    // Financial recommendations
    String[] getFinancialRecommendations(User user);
    Map<String, Object> getFinancialHealthSummary(User user);
} 