package com.financialadviser.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "debts")
@Data
@NoArgsConstructor
public class Debt {
    public enum DebtType {
        MORTGAGE,
        STUDENT_LOAN,
        CAR_LOAN,
        CREDIT_CARD,
        PERSONAL_LOAN,
        OTHER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private BigDecimal remainingAmount;

    @Column(nullable = false)
    private BigDecimal minimumPayment;

    @Column(nullable = false)
    private BigDecimal interestRate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DebtType debtType;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column
    private LocalDate targetPayoffDate;

    public Debt(String description, DebtType debtType, BigDecimal totalAmount, BigDecimal minimumPayment, BigDecimal interestRate) {
        this.description = description;
        this.debtType = debtType;
        this.totalAmount = totalAmount;
        this.remainingAmount = totalAmount;
        this.minimumPayment = minimumPayment;
        this.interestRate = interestRate;
        this.startDate = LocalDate.now();
    }

    // Calculated fields
    public BigDecimal getMonthlyInterest() {
        return remainingAmount.multiply(interestRate.divide(BigDecimal.valueOf(12), 4, RoundingMode.HALF_UP));
    }

    public Integer getMonthsToPayoff() {
        if (minimumPayment.compareTo(getMonthlyInterest()) <= 0) {
            return Integer.MAX_VALUE; // Will never be paid off
        }

        BigDecimal monthlyRate = interestRate.divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);
        BigDecimal principal = remainingAmount;
        BigDecimal payment = minimumPayment;

        // Using the loan amortization formula: n = -log(1 - (r*P)/PMT) / log(1 + r)
        double r = monthlyRate.doubleValue();
        double P = principal.doubleValue();
        double PMT = payment.doubleValue();

        if (r == 0) {
            return (int) Math.ceil(P / PMT);
        }

        double n = -Math.log(1 - (r * P) / PMT) / Math.log(1 + r);
        return (int) Math.ceil(n);
    }

    public double getPayoffProgress() {
        if (totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return BigDecimal.ONE.subtract(
            remainingAmount.divide(totalAmount, 4, RoundingMode.HALF_UP)
        ).doubleValue();
    }

    public BigDecimal getTotalInterestPaid() {
        BigDecimal totalPayments = minimumPayment.multiply(BigDecimal.valueOf(getMonthsToPayoff()));
        return totalPayments.subtract(totalAmount).max(BigDecimal.ZERO);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(BigDecimal remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public BigDecimal getMinimumPayment() {
        return minimumPayment;
    }

    public void setMinimumPayment(BigDecimal minimumPayment) {
        this.minimumPayment = minimumPayment;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public DebtType getDebtType() {
        return debtType;
    }

    public void setDebtType(DebtType debtType) {
        this.debtType = debtType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getTargetPayoffDate() {
        return targetPayoffDate;
    }

    public void setTargetPayoffDate(LocalDate targetPayoffDate) {
        this.targetPayoffDate = targetPayoffDate;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
} 