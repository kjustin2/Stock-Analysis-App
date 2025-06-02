package com.financialadviser.service.impl;

import com.financialadviser.model.Budget;
import com.financialadviser.model.BudgetCategory;
import com.financialadviser.model.Transaction;
import com.financialadviser.model.User;
import com.financialadviser.repository.BudgetRepository;
import com.financialadviser.repository.BudgetCategoryRepository;
import com.financialadviser.repository.TransactionRepository;
import com.financialadviser.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final BudgetCategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    @Autowired
    public BudgetServiceImpl(BudgetRepository budgetRepository,
                           BudgetCategoryRepository categoryRepository,
                           TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public Budget createBudget(User user, String name, LocalDate startDate, LocalDate endDate, BigDecimal totalAmount) {
        Budget budget = new Budget();
        budget.setUser(user);
        budget.setName(name);
        budget.setStartDate(startDate);
        budget.setEndDate(endDate);
        budget.setTotalAmount(totalAmount);
        return budgetRepository.save(budget);
    }

    @Override
    public Optional<Budget> findById(Long id) {
        return budgetRepository.findById(id);
    }

    @Override
    public List<Budget> findByUser(User user) {
        return budgetRepository.findByUser(user);
    }

    @Override
    public List<Budget> findByUserAndDateRange(User user, LocalDate startDate, LocalDate endDate) {
        return budgetRepository.findByUserAndStartDateGreaterThanEqualAndEndDateLessThanEqual(user, startDate, endDate);
    }

    @Override
    public Budget save(Budget budget) {
        return budgetRepository.save(budget);
    }

    @Override
    public void delete(Budget budget) {
        budgetRepository.delete(budget);
    }

    @Override
    public void deleteById(Long id) {
        budgetRepository.deleteById(id);
    }

    @Override
    public BudgetCategory addCategory(Budget budget, String name, BigDecimal allocatedAmount) {
        BudgetCategory category = new BudgetCategory();
        category.setBudget(budget);
        category.setName(name);
        category.setAllocatedAmount(allocatedAmount);
        return categoryRepository.save(category);
    }

    @Override
    public void removeCategory(BudgetCategory category) {
        categoryRepository.delete(category);
    }

    @Override
    public List<BudgetCategory> findCategoriesByBudget(Budget budget) {
        return categoryRepository.findByBudget(budget);
    }

    @Override
    public Transaction addTransaction(Budget budget, BudgetCategory category, String description,
                                   BigDecimal amount, Transaction.TransactionType type) {
        Transaction transaction = new Transaction();
        transaction.setBudget(budget);
        transaction.setCategory(category);
        transaction.setDescription(description);
        transaction.setAmount(amount);
        transaction.setType(type);
        transaction.setTransactionDate(LocalDateTime.now());
        return transactionRepository.save(transaction);
    }

    @Override
    public void removeTransaction(Transaction transaction) {
        transactionRepository.delete(transaction);
    }

    @Override
    public List<Transaction> findTransactionsByBudget(Budget budget) {
        return transactionRepository.findByBudgetOrderByTransactionDateDesc(budget);
    }

    @Override
    public List<Transaction> findTransactionsByCategory(BudgetCategory category) {
        return transactionRepository.findByCategory(category);
    }

    @Override
    public BigDecimal calculateTotalSpent(Budget budget) {
        return findTransactionsByBudget(budget).stream()
            .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public BigDecimal calculateRemainingAmount(Budget budget) {
        BigDecimal totalSpent = calculateTotalSpent(budget);
        return budget.getTotalAmount().subtract(totalSpent);
    }

    @Override
    public BigDecimal calculateCategorySpent(BudgetCategory category) {
        return findTransactionsByCategory(category).stream()
            .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public BigDecimal calculateCategoryRemaining(BudgetCategory category) {
        BigDecimal spent = calculateCategorySpent(category);
        return category.getAllocatedAmount().subtract(spent);
    }
} 