package com.financialadviser.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "investment_transactions")
public class InvestmentTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investment_id", nullable = false)
    private Investment investment;
    
    @Column(nullable = false)
    private LocalDateTime transactionDate;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TransactionType type;
    
    @Column(nullable = false)
    private BigDecimal shares;
    
    @Column(nullable = false)
    private BigDecimal price;
    
    @Column(nullable = false)
    private BigDecimal amount;
    
    @Column
    private String notes;
    
    public enum TransactionType {
        BUY,
        SELL,
        DIVIDEND,
        SPLIT,
        TRANSFER_IN,
        TRANSFER_OUT
    }
    
    public InvestmentTransaction() {
        // Default constructor for JPA
    }
    
    public InvestmentTransaction(Investment investment, TransactionType type, BigDecimal shares, 
                               BigDecimal price, String notes) {
        this.investment = investment;
        this.type = type;
        this.shares = shares;
        this.price = price;
        this.amount = shares.multiply(price);
        this.notes = notes;
        this.transactionDate = LocalDateTime.now();
    }
    
    // Getters and Setters
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Investment getInvestment() {
        return investment;
    }
    
    public void setInvestment(Investment investment) {
        this.investment = investment;
    }
    
    public LocalDateTime getTransactionDate() {
        return transactionDate;
    }
    
    public void setTransactionDate(LocalDateTime transactionDate) {
        this.transactionDate = transactionDate;
    }
    
    public TransactionType getType() {
        return type;
    }
    
    public void setType(TransactionType type) {
        this.type = type;
    }
    
    public BigDecimal getShares() {
        return shares;
    }
    
    public void setShares(BigDecimal shares) {
        this.shares = shares;
        if (price != null) {
            this.amount = shares.multiply(price);
        }
    }
    
    public BigDecimal getPrice() {
        return price;
    }
    
    public void setPrice(BigDecimal price) {
        this.price = price;
        if (shares != null) {
            this.amount = shares.multiply(price);
        }
    }
    
    public BigDecimal getAmount() {
        return amount;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    @Override
    public String toString() {
        return String.format("%s: %s shares @ $%s (%s)", 
            type, shares, price, transactionDate);
    }
} 