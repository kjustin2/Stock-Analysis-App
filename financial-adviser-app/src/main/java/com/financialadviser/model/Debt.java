package com.financialadviser.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "debts")
public class Debt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String description;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "interest_rate", nullable = false)
    private BigDecimal interestRate;

    @Column(name = "minimum_payment", nullable = false)
    private BigDecimal minimumPayment;

    @Column(name = "debt_type", nullable = false)
    private String debtType;

    @Column(name = "remaining_amount", nullable = false)
    private BigDecimal remainingAmount;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @OneToMany(mappedBy = "debt", cascade = CascadeType.ALL)
    private Set<DebtPayment> payments = new HashSet<>();

    public enum DebtType {
        CREDIT_CARD,
        STUDENT_LOAN,
        MORTGAGE,
        AUTO_LOAN,
        PERSONAL_LOAN,
        OTHER
    }

    public Debt() {
        // Default constructor required by JPA
    }

    public Debt(String description, BigDecimal totalAmount, BigDecimal interestRate, 
                BigDecimal minimumPayment, String debtType, LocalDate startDate) {
        setDescription(description);
        setTotalAmount(totalAmount);
        setInterestRate(interestRate);
        setMinimumPayment(minimumPayment);
        setDebtType(debtType);
        setStartDate(startDate);
        setRemainingAmount(totalAmount);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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
        if (remainingAmount == null || remainingAmount.compareTo(totalAmount) > 0) {
            this.remainingAmount = totalAmount;
        }
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public BigDecimal getMinimumPayment() {
        return minimumPayment;
    }

    public void setMinimumPayment(BigDecimal minimumPayment) {
        this.minimumPayment = minimumPayment;
    }

    public String getDebtType() {
        return debtType;
    }

    public void setDebtType(String debtType) {
        this.debtType = debtType;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(BigDecimal remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public Set<DebtPayment> getPayments() {
        return payments;
    }

    public void setPayments(Set<DebtPayment> payments) {
        this.payments = payments;
    }

    public void addPayment(DebtPayment payment) {
        payments.add(payment);
        payment.setDebt(this);
        updateRemainingAmount();
    }

    public void removePayment(DebtPayment payment) {
        payments.remove(payment);
        payment.setDebt(null);
        updateRemainingAmount();
    }

    private void updateRemainingAmount() {
        BigDecimal totalPaid = payments.stream()
            .map(DebtPayment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.remainingAmount = totalAmount.subtract(totalPaid);
    }

    @Transient
    public double getPayoffProgress() {
        if (totalAmount.compareTo(BigDecimal.ZERO) > 0) {
            return BigDecimal.ONE.subtract(remainingAmount.divide(totalAmount, 4, java.math.RoundingMode.HALF_UP))
                .doubleValue();
        }
        return 0.0;
    }

    @Transient
    public BigDecimal getMonthlyInterest() {
        return remainingAmount.multiply(interestRate.divide(BigDecimal.valueOf(1200), 4, java.math.RoundingMode.HALF_UP));
    }

    @Transient
    public int getMonthsToPayoff() {
        if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }

        BigDecimal monthlyRate = interestRate.divide(BigDecimal.valueOf(1200), 10, java.math.RoundingMode.HALF_UP);
        BigDecimal payment = minimumPayment.max(getMonthlyInterest().multiply(BigDecimal.valueOf(1.1)));

        if (payment.compareTo(getMonthlyInterest()) <= 0) {
            return Integer.MAX_VALUE; // Will never be paid off with current payment
        }

        // Using the loan amortization formula: n = -log(1 - (r*PV)/PMT) / log(1 + r)
        // Where: n = number of payments, r = monthly interest rate, PV = present value (remaining amount), PMT = payment amount
        double r = monthlyRate.doubleValue();
        double pv = remainingAmount.doubleValue();
        double pmt = payment.doubleValue();

        return (int) Math.ceil(Math.log(pmt / (pmt - r * pv)) / Math.log(1 + r));
    }
} 