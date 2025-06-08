package com.financialadviser.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.financialadviser.model.User;

@Service
public class FinancialHealthServiceImpl implements FinancialHealthService {
    
    @Override
    public double calculateEmergencyFundHealth(User user) {
        if (user.getMonthlyExpenses() == null || user.getMonthlyExpenses().compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        
        BigDecimal emergencyFund = user.getEmergencyFund() != null ? user.getEmergencyFund() : BigDecimal.ZERO;
        BigDecimal monthsOfExpenses = emergencyFund.divide(user.getMonthlyExpenses(), 2, RoundingMode.HALF_UP);
        
        // Ideal is 6 months of expenses
        double healthPercentage = Math.min(monthsOfExpenses.doubleValue() / 6.0 * 100, 100.0);
        return healthPercentage;
    }
    
    @Override
    public double calculateDebtToIncomeRatio(User user) {
        if (user.getMonthlyIncome() == null || user.getMonthlyIncome().compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        
        // For now, assume no debt data available, return 0
        // In a full implementation, this would calculate total monthly debt payments / monthly income
        return 0.0;
    }
    
    @Override
    public double calculateSavingsRate(User user) {
        if (user.getMonthlyIncome() == null || user.getMonthlyIncome().compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        
        BigDecimal monthlyExpenses = user.getMonthlyExpenses() != null ? user.getMonthlyExpenses() : BigDecimal.ZERO;
        BigDecimal monthlySavings = user.getMonthlyIncome().subtract(monthlyExpenses);
        
        if (monthlySavings.compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        
        return monthlySavings.divide(user.getMonthlyIncome(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();
    }
    
    @Override
    public double calculateNetWorth(User user) {
        BigDecimal assets = BigDecimal.ZERO;
        
        // Add emergency fund
        if (user.getEmergencyFund() != null) {
            assets = assets.add(user.getEmergencyFund());
        }
        
        // Add other assets
        if (user.getOtherAssets() != null) {
            assets = assets.add(user.getOtherAssets());
        }
        
        // For now, assume no liabilities data available
        // In a full implementation, this would subtract total debts
        
        return assets.doubleValue();
    }
    
    @Override
    public Map<String, Double> getInvestmentAllocation(User user) {
        Map<String, Double> allocation = new HashMap<>();
        allocation.put("stocks", 0.0);
        allocation.put("bonds", 0.0);
        allocation.put("cash", 100.0);
        return allocation;
    }
    
    @Override
    public double calculateInvestmentReturns(User user) {
        return 0.0;
    }
    
    @Override
    public BigDecimal calculateRetirementProjection(User user) {
        return BigDecimal.ZERO;
    }
    
    @Override
    public int calculateYearsToRetirement(User user) {
        if (user.getTargetRetirementAge() != null && user.getBirthDate() != null) {
            int currentAge = java.time.LocalDate.now().getYear() - user.getBirthDate().getYear();
            return Math.max(0, user.getTargetRetirementAge() - currentAge);
        }
        return 0;
    }
    
    @Override
    public BigDecimal calculateRequiredMonthlySavings(User user) {
        return BigDecimal.ZERO;
    }
    
    @Override
    public Map<String, Double> getDebtDistribution(User user) {
        Map<String, Double> distribution = new HashMap<>();
        distribution.put("total", 0.0);
        return distribution;
    }
    
    @Override
    public BigDecimal calculateTotalMonthlyDebtPayments(User user) {
        return BigDecimal.ZERO;
    }
    
    @Override
    public int calculateDebtFreeDate(User user) {
        return 0;
    }
    
    @Override
    public String[] getFinancialRecommendations(User user) {
        return new String[]{"Start building an emergency fund", "Track your monthly expenses", "Consider investing for long-term growth"};
    }
    
    @Override
    public Map<String, Object> getFinancialHealthSummary(User user) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("emergencyFundHealth", calculateEmergencyFundHealth(user));
        summary.put("savingsRate", calculateSavingsRate(user));
        summary.put("netWorth", calculateNetWorth(user));
        summary.put("recommendations", getFinancialRecommendations(user));
        return summary;
    }
} 