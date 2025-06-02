package com.financialadviser.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "investments")
public class Investment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private InvestmentType type;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal currentValue;

    @Column(nullable = false)
    private LocalDate startDate;

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

    // Getters and Setters
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public InvestmentType getType() {
        return type;
    }

    public void setType(InvestmentType type) {
        this.type = type;
    }

    public BigDecimal getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(BigDecimal currentValue) {
        this.currentValue = currentValue;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public Set<InvestmentTransaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(Set<InvestmentTransaction> transactions) {
        this.transactions = transactions;
    }
} 