package com.financialadviser.repository;

import com.financialadviser.model.Budget;
import com.financialadviser.model.BudgetCategory;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetCategoryRepository extends CrudRepository<BudgetCategory, Long> {
    List<BudgetCategory> findByBudget(Budget budget);
} 