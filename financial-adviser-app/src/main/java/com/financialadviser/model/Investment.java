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
@Table(name = "investments")
@Data
@NoArgsConstructor
public class Investment {
    public enum InvestmentType {
        STOCKS,
        BONDS,
        MUTUAL_FUNDS,
        ETF,
        REAL_ESTATE,
        CRYPTOCURRENCY,
        CASH_EQUIVALENTS,
        OTHER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal shares;

    @Column(nullable = false)
    private BigDecimal purchasePrice;

    @Column(nullable = false)
    private LocalDate purchaseDate;

    @Column(nullable = false)
    private BigDecimal currentPrice;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private InvestmentType type;

    @Column(nullable = false)
    private BigDecimal principal;

    @Column(nullable = false)
    private BigDecimal currentValue;

    @Column(nullable = false)
    private BigDecimal returnRate;

    @Column(nullable = false)
    private BigDecimal annualReturnRate;

    @Column
    private String notes;

    @Column(nullable = false)
    private LocalDate startDate;

    public Investment(String symbol, String name, BigDecimal shares, BigDecimal purchasePrice, LocalDate purchaseDate, InvestmentType type) {
        this.symbol = symbol;
        this.name = name;
        this.shares = shares;
        this.purchasePrice = purchasePrice;
        this.purchaseDate = purchaseDate;
        this.type = type;
        this.currentPrice = purchasePrice;
        this.principal = shares.multiply(purchasePrice);
        this.currentValue = this.principal;
        this.returnRate = BigDecimal.ZERO;
        this.annualReturnRate = BigDecimal.ZERO;
        this.startDate = purchaseDate;
    }

    // Calculated methods
    public BigDecimal getValue() {
        if (currentPrice != null && shares != null) {
            return currentPrice.multiply(shares);
        }
        return currentValue != null ? currentValue : BigDecimal.ZERO;
    }

    public BigDecimal getAmount() {
        return getValue();
    }

    public void setAmount(BigDecimal amount) {
        this.currentValue = amount;
    }

    public BigDecimal getReturnRate() {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal currentVal = getValue();
        return currentVal.subtract(principal)
            .divide(principal, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));
    }

    public double getReturnRateAsDouble() {
        return getReturnRate().doubleValue();
    }
} 