package com.financialadviser.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.financialadviser.model.User;

@Service
public class PredictionService {
    
    @Autowired
    private FinancialAnalysisService financialAnalysisService;
    
    private static final BigDecimal MONTHS_PER_YEAR = BigDecimal.valueOf(12);
    
    /**
     * Project retirement savings based on current savings rate and expected returns
     */
    public Map<String, Object> projectRetirementSavings(User user) {
        Map<String, Object> projection = new HashMap<>();
        
        if (user.getBirthDate() == null || user.getTargetRetirementAge() == null) {
            projection.put("error", "Birth date and target retirement age required");
            return projection;
        }
        
        int currentAge = Period.between(user.getBirthDate(), LocalDate.now()).getYears();
        int yearsToRetirement = user.getTargetRetirementAge() - currentAge;
        
        if (yearsToRetirement <= 0) {
            projection.put("error", "Already at or past retirement age");
            return projection;
        }
        
        BigDecimal currentSavings = user.getOtherAssets() != null ? user.getOtherAssets() : BigDecimal.ZERO;
        BigDecimal monthlySavings = user.getMonthlySavings() != null ? user.getMonthlySavings() : BigDecimal.ZERO;
        BigDecimal expectedReturn = financialAnalysisService.getExpectedReturnRate(user);
        
        // Calculate future value with compound interest
        BigDecimal futureValue = calculateFutureValue(currentSavings, monthlySavings, expectedReturn, yearsToRetirement);
        
        // Calculate required retirement income (80% of current income)
        BigDecimal currentIncome = user.getMonthlyIncome() != null ? user.getMonthlyIncome() : BigDecimal.ZERO;
        BigDecimal requiredRetirementIncome = currentIncome.multiply(BigDecimal.valueOf(0.8));
        BigDecimal requiredRetirementSavings = requiredRetirementIncome.multiply(BigDecimal.valueOf(300)); // 25 years * 12 months
        
        projection.put("currentAge", currentAge);
        projection.put("yearsToRetirement", yearsToRetirement);
        projection.put("currentSavings", currentSavings);
        projection.put("monthlySavings", monthlySavings);
        projection.put("expectedReturn", expectedReturn);
        projection.put("projectedSavings", futureValue);
        projection.put("requiredSavings", requiredRetirementSavings);
        projection.put("savingsGap", requiredRetirementSavings.subtract(futureValue));
        projection.put("onTrack", futureValue.compareTo(requiredRetirementSavings) >= 0);
        
        return projection;
    }
    
    /**
     * Project debt payoff timeline
     */
    public Map<String, Object> projectDebtPayoff(User user) {
        Map<String, Object> projection = new HashMap<>();
        
        if (user.getDebts() == null || user.getDebts().isEmpty()) {
            projection.put("totalDebt", BigDecimal.ZERO);
            projection.put("monthsToPayoff", 0);
            projection.put("totalInterest", BigDecimal.ZERO);
            return projection;
        }
        
        BigDecimal totalDebt = user.getDebts().stream()
            .map(debt -> debt.getRemainingAmount() != null ? debt.getRemainingAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal totalMinimumPayment = user.getDebts().stream()
            .map(debt -> debt.getMinimumPayment() != null ? debt.getMinimumPayment() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calculate average interest rate weighted by debt amount
        BigDecimal weightedInterestSum = user.getDebts().stream()
            .map(debt -> {
                BigDecimal amount = debt.getRemainingAmount() != null ? debt.getRemainingAmount() : BigDecimal.ZERO;
                BigDecimal rate = debt.getInterestRate() != null ? debt.getInterestRate() : BigDecimal.ZERO;
                return amount.multiply(rate);
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal averageInterestRate = totalDebt.compareTo(BigDecimal.ZERO) > 0 
            ? weightedInterestSum.divide(totalDebt, 4, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        // Calculate payoff timeline
        int monthsToPayoff = calculateDebtPayoffMonths(totalDebt, totalMinimumPayment, averageInterestRate);
        BigDecimal totalInterest = totalMinimumPayment.multiply(BigDecimal.valueOf(monthsToPayoff)).subtract(totalDebt);
        
        projection.put("totalDebt", totalDebt);
        projection.put("monthsToPayoff", monthsToPayoff);
        projection.put("totalInterest", totalInterest.max(BigDecimal.ZERO));
        projection.put("averageInterestRate", averageInterestRate);
        projection.put("totalMinimumPayment", totalMinimumPayment);
        
        return projection;
    }
    
    /**
     * Generate 10-year financial projection
     */
    public List<Map<String, Object>> generate10YearProjection(User user) {
        List<Map<String, Object>> projection = new ArrayList<>();
        
        BigDecimal currentSavings = user.getOtherAssets() != null ? user.getOtherAssets() : BigDecimal.ZERO;
        BigDecimal monthlySavings = user.getMonthlySavings() != null ? user.getMonthlySavings() : BigDecimal.ZERO;
        BigDecimal expectedReturn = financialAnalysisService.getExpectedReturnRate(user);
        BigDecimal currentNetWorth = financialAnalysisService.calculateNetWorth(user);
        
        for (int year = 1; year <= 10; year++) {
            Map<String, Object> yearProjection = new HashMap<>();
            
            BigDecimal projectedSavings = calculateFutureValue(currentSavings, monthlySavings, expectedReturn, year);
            BigDecimal projectedNetWorth = currentNetWorth.add(projectedSavings.subtract(currentSavings));
            
            yearProjection.put("year", year);
            yearProjection.put("projectedSavings", projectedSavings);
            yearProjection.put("projectedNetWorth", projectedNetWorth);
            yearProjection.put("age", user.getBirthDate() != null ? 
                Period.between(user.getBirthDate(), LocalDate.now()).getYears() + year : null);
            
            projection.add(yearProjection);
        }
        
        return projection;
    }
    
    /**
     * Calculate future value with compound interest and regular contributions
     */
    private BigDecimal calculateFutureValue(BigDecimal presentValue, BigDecimal monthlyContribution, 
                                          BigDecimal annualRate, int years) {
        BigDecimal monthlyRate = annualRate.divide(MONTHS_PER_YEAR, 10, RoundingMode.HALF_UP);
        int totalMonths = years * 12;
        
        // Future value of present amount
        BigDecimal futureValuePresent = presentValue.multiply(
            BigDecimal.ONE.add(monthlyRate).pow(totalMonths)
        );
        
        // Future value of annuity (monthly contributions)
        BigDecimal futureValueAnnuity = BigDecimal.ZERO;
        if (monthlyRate.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal factor = BigDecimal.ONE.add(monthlyRate).pow(totalMonths).subtract(BigDecimal.ONE);
            futureValueAnnuity = monthlyContribution.multiply(factor.divide(monthlyRate, 10, RoundingMode.HALF_UP));
        } else {
            futureValueAnnuity = monthlyContribution.multiply(BigDecimal.valueOf(totalMonths));
        }
        
        return futureValuePresent.add(futureValueAnnuity);
    }
    
    /**
     * Calculate months to pay off debt
     */
    private int calculateDebtPayoffMonths(BigDecimal principal, BigDecimal monthlyPayment, BigDecimal annualRate) {
        if (monthlyPayment.compareTo(BigDecimal.ZERO) <= 0) {
            return Integer.MAX_VALUE;
        }
        
        BigDecimal monthlyRate = annualRate.divide(MONTHS_PER_YEAR, 10, RoundingMode.HALF_UP);
        
        if (monthlyRate.compareTo(BigDecimal.ZERO) <= 0) {
            return principal.divide(monthlyPayment, 0, RoundingMode.CEILING).intValue();
        }
        
        BigDecimal monthlyInterest = principal.multiply(monthlyRate);
        if (monthlyPayment.compareTo(monthlyInterest) <= 0) {
            return Integer.MAX_VALUE; // Will never be paid off
        }
        
        // Using loan amortization formula
        double r = monthlyRate.doubleValue();
        double P = principal.doubleValue();
        double PMT = monthlyPayment.doubleValue();
        
        double n = -Math.log(1 - (r * P) / PMT) / Math.log(1 + r);
        return (int) Math.ceil(n);
    }
    
    /**
     * Calculate projected annual retirement income
     */
    public Map<String, Object> calculateRetirementIncome(User user, Object allocationBreakdown) {
        Map<String, Object> incomeProjection = new HashMap<>();
        
        // Get projected retirement savings
        Map<String, Object> retirementProjection = projectRetirementSavings(user);
        BigDecimal projectedSavings = (BigDecimal) retirementProjection.get("projectedSavings");
        
        if (projectedSavings == null) {
            projectedSavings = BigDecimal.ZERO;
        }
        
        // Calculate 4% withdrawal rule for investment income
        BigDecimal investmentIncome = projectedSavings.multiply(BigDecimal.valueOf(0.04));
        
        // Estimate Social Security (simplified calculation)
        BigDecimal currentIncome = user.getMonthlyIncome() != null ? user.getMonthlyIncome() : BigDecimal.ZERO;
        BigDecimal annualIncome = currentIncome.multiply(MONTHS_PER_YEAR);
        BigDecimal socialSecurity = calculateSocialSecurityEstimate(annualIncome);
        
        // Other income (pensions, part-time work, etc.) - placeholder
        BigDecimal otherIncome = BigDecimal.ZERO;
        
        BigDecimal totalAnnualIncome = investmentIncome.add(socialSecurity).add(otherIncome);
        
        incomeProjection.put("investmentIncome", investmentIncome);
        incomeProjection.put("socialSecurity", socialSecurity);
        incomeProjection.put("otherIncome", otherIncome);
        incomeProjection.put("totalAnnual", totalAnnualIncome);
        
        return incomeProjection;
    }
    
    /**
     * Simplified Social Security benefit estimation
     */
    private BigDecimal calculateSocialSecurityEstimate(BigDecimal annualIncome) {
        // Simplified calculation - actual SS calculation is much more complex
        // This assumes full retirement age and uses 2024 bend points
        
        BigDecimal maxTaxableWage = BigDecimal.valueOf(160200); // 2024 limit
        BigDecimal effectiveIncome = annualIncome.min(maxTaxableWage);
        
        // Simplified benefit calculation (roughly 40% of average income)
        BigDecimal estimatedBenefit = effectiveIncome.multiply(BigDecimal.valueOf(0.40));
        
        // Cap at reasonable maximum
        BigDecimal maxBenefit = BigDecimal.valueOf(48000); // Approximate 2024 max
        return estimatedBenefit.min(maxBenefit);
    }
}
