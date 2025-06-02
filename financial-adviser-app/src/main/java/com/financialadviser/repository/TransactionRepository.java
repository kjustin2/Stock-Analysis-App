package com.financialadviser.repository;

import com.financialadviser.model.Budget;
import com.financialadviser.model.BudgetCategory;
import com.financialadviser.model.Transaction;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends CrudRepository<Transaction, Long> {
    List<Transaction> findByBudget(Budget budget);
    List<Transaction> findByCategory(BudgetCategory category);
    List<Transaction> findByBudgetOrderByTransactionDateDesc(Budget budget);
} 