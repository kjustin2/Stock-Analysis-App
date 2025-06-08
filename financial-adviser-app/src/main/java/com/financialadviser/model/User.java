package com.financialadviser.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String email;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "monthly_income")
    private BigDecimal monthlyIncome;

    @Column(name = "monthly_savings")
    private BigDecimal monthlySavings;

    @Column(name = "monthly_expenses")
    private BigDecimal monthlyExpenses;

    @Column(name = "emergency_fund")
    private BigDecimal emergencyFund;

    @Column(name = "other_assets")
    private BigDecimal otherAssets;

    @Column(name = "retirement_goal")
    private BigDecimal retirementGoal;

    @Column(name = "target_retirement_age")
    private Integer targetRetirementAge;

    @Column(name = "risk_tolerance")
    private Integer riskTolerance;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Investment> investments = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Debt> debts = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Goal> goals = new ArrayList<>();

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public BigDecimal getMonthlyIncome() {
        return monthlyIncome;
    }

    public void setMonthlyIncome(BigDecimal monthlyIncome) {
        this.monthlyIncome = monthlyIncome;
    }

    public BigDecimal getMonthlySavings() {
        return monthlySavings;
    }

    public void setMonthlySavings(BigDecimal monthlySavings) {
        this.monthlySavings = monthlySavings;
    }

    public BigDecimal getMonthlyExpenses() {
        return monthlyExpenses;
    }

    public void setMonthlyExpenses(BigDecimal monthlyExpenses) {
        this.monthlyExpenses = monthlyExpenses;
    }

    public BigDecimal getEmergencyFund() {
        return emergencyFund;
    }

    public void setEmergencyFund(BigDecimal emergencyFund) {
        this.emergencyFund = emergencyFund;
    }

    public BigDecimal getOtherAssets() {
        return otherAssets;
    }

    public void setOtherAssets(BigDecimal otherAssets) {
        this.otherAssets = otherAssets;
    }

    public BigDecimal getRetirementGoal() {
        return retirementGoal;
    }

    public void setRetirementGoal(BigDecimal retirementGoal) {
        this.retirementGoal = retirementGoal;
    }

    public Integer getTargetRetirementAge() {
        return targetRetirementAge;
    }

    public void setTargetRetirementAge(Integer targetRetirementAge) {
        this.targetRetirementAge = targetRetirementAge;
    }

    public Integer getRiskTolerance() {
        return riskTolerance;
    }

    public void setRiskTolerance(Integer riskTolerance) {
        this.riskTolerance = riskTolerance;
    }

    public List<Investment> getInvestments() {
        return investments;
    }

    public void setInvestments(List<Investment> investments) {
        this.investments = investments;
    }

    public List<Debt> getDebts() {
        return debts;
    }

    public void setDebts(List<Debt> debts) {
        this.debts = debts;
    }

    public List<Goal> getGoals() {
        return goals;
    }

    public void setGoals(List<Goal> goals) {
        this.goals = goals;
    }

    // Helper methods
    public void addInvestment(Investment investment) {
        investments.add(investment);
        investment.setUser(this);
    }

    public void removeInvestment(Investment investment) {
        investments.remove(investment);
        investment.setUser(null);
    }

    public void addDebt(Debt debt) {
        debts.add(debt);
        debt.setUser(this);
    }

    public void removeDebt(Debt debt) {
        debts.remove(debt);
        debt.setUser(null);
    }

    public void addGoal(Goal goal) {
        goals.add(goal);
        goal.setUser(this);
    }

    public void removeGoal(Goal goal) {
        goals.remove(goal);
        goal.setUser(null);
    }

    // Financial health calculations
    public double getSavingsRate() {
        if (monthlyIncome == null || monthlyIncome.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return getMonthlySavings()
            .divide(monthlyIncome, 4, BigDecimal.ROUND_HALF_UP)
            .doubleValue();
    }

    public BigDecimal getTotalInvestments() {
        return investments.stream()
            .map(Investment::getCurrentValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getTotalDebts() {
        return debts.stream()
            .map(Debt::getRemainingAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public double getDebtToIncomeRatio() {
        if (monthlyIncome == null || monthlyIncome.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        BigDecimal monthlyDebtPayments = debts.stream()
            .map(Debt::getMinimumPayment)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return monthlyDebtPayments
            .divide(monthlyIncome, 4, BigDecimal.ROUND_HALF_UP)
            .doubleValue();
    }
} 