package com.financialadviser.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "investments")
public class Investment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private BigDecimal shares;

    @Column(name = "purchase_price", nullable = false)
    private BigDecimal purchasePrice;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "current_price")
    private BigDecimal currentPrice;

    @Column(name = "asset_type", nullable = false)
    private String assetType;

    @Column(name = "gain_loss", nullable = false)
    private BigDecimal gainLoss = BigDecimal.ZERO;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private InvestmentType type = InvestmentType.STOCKS;

    @OneToMany(mappedBy = "investment", cascade = CascadeType.ALL)
    private Set<InvestmentTransaction> transactions = new HashSet<>();

    public enum InvestmentType {
        STOCKS,
        BONDS,
        MUTUAL_FUNDS,
        ETF,
        REAL_ESTATE,
        CRYPTOCURRENCY,
        OTHER
    }

    public Investment() {
        // Default constructor for JPA
    }

    public Investment(String symbol, double shares, double purchasePrice, LocalDate purchaseDate, String assetType) {
        this.symbol = symbol;
        this.shares = BigDecimal.valueOf(shares);
        this.purchasePrice = BigDecimal.valueOf(purchasePrice);
        this.currentPrice = BigDecimal.valueOf(purchasePrice); // Initialize with purchase price
        this.purchaseDate = purchaseDate;
        this.assetType = assetType;
        updateGainLoss();
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

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public BigDecimal getShares() {
        return shares;
    }

    public void setShares(BigDecimal shares) {
        this.shares = shares;
        updateGainLoss();
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
        updateGainLoss();
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
        updateGainLoss();
    }

    public String getAssetType() {
        return assetType;
    }

    public void setAssetType(String assetType) {
        this.assetType = assetType;
    }

    public BigDecimal getGainLoss() {
        return gainLoss;
    }

    public InvestmentType getType() {
        return type;
    }

    public void setType(InvestmentType type) {
        this.type = type;
    }

    public Set<InvestmentTransaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(Set<InvestmentTransaction> transactions) {
        this.transactions = transactions;
    }

    private void updateGainLoss() {
        if (shares != null && purchasePrice != null && currentPrice != null) {
            this.gainLoss = getValue().subtract(shares.multiply(purchasePrice));
        }
    }

    public void addTransaction(InvestmentTransaction transaction) {
        transactions.add(transaction);
        transaction.setInvestment(this);
    }

    public void removeTransaction(InvestmentTransaction transaction) {
        transactions.remove(transaction);
        transaction.setInvestment(null);
    }

    @Transient
    public BigDecimal getValue() {
        return currentPrice.multiply(shares);
    }

    @Transient
    public double getReturnRate() {
        if (purchasePrice.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return currentPrice.subtract(purchasePrice)
            .divide(purchasePrice, 4, BigDecimal.ROUND_HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .doubleValue();
    }

    @Override
    public String toString() {
        return String.format("%s: %s shares @ $%s (purchased @ $%s on %s)", 
            symbol, shares, currentPrice, purchasePrice, purchaseDate);
    }
} 