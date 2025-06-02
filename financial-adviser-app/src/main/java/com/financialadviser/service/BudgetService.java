package com.financialadviser.service;

import com.financialadviser.model.Budget;
import com.financialadviser.model.BudgetCategory;
import com.financialadviser.model.Transaction;
import com.financialadviser.model.User;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetService {
    Budget createBudget(User user, String name, LocalDate startDate, LocalDate endDate, BigDecimal totalAmount);
    Optional<Budget> findById(Long id);
    List<Budget> findByUser(User user);
    List<Budget> findByUserAndDateRange(User user, LocalDate startDate, LocalDate endDate);
    Budget save(Budget budget);
    void delete(Budget budget);
    void deleteById(Long id);
    
    BudgetCategory addCategory(Budget budget, String name, BigDecimal allocatedAmount);
    void removeCategory(BudgetCategory category);
    List<BudgetCategory> findCategoriesByBudget(Budget budget);
    
    Transaction addTransaction(Budget budget, BudgetCategory category, String description, 
                             BigDecimal amount, Transaction.TransactionType type);
    void removeTransaction(Transaction transaction);
    List<Transaction> findTransactionsByBudget(Budget budget);
    List<Transaction> findTransactionsByCategory(BudgetCategory category);
    
    BigDecimal calculateTotalSpent(Budget budget);
    BigDecimal calculateRemainingAmount(Budget budget);
    BigDecimal calculateCategorySpent(BudgetCategory category);
    BigDecimal calculateCategoryRemaining(BudgetCategory category);
} 