package com.financialadviser.service.impl;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.financialadviser.model.Budget;
import com.financialadviser.model.BudgetCategory;
import com.financialadviser.model.Transaction;
import com.financialadviser.model.User;
import com.financialadviser.repository.BudgetCategoryRepository;
import com.financialadviser.repository.BudgetRepository;
import com.financialadviser.repository.TransactionRepository;
import com.financialadviser.service.BudgetService;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;

@Service
@Transactional
public class BudgetServiceImpl implements BudgetService {

    private static final Logger logger = LoggerFactory.getLogger(BudgetServiceImpl.class);

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

    @Override
    public ObservableList<Budget> getAllBudgets() {
        List<Budget> budgets = new ArrayList<>();
        budgetRepository.findAll().forEach(budgets::add);
        return FXCollections.observableArrayList(budgets);
    }

    @Override
    public Budget addBudget(Budget budget) {
        return budgetRepository.save(budget);
    }

    @Override
    public void updateBudget(Budget budget) {
        budgetRepository.save(budget);
    }

    @Override
    public void deleteBudget(Budget budget) {
        budgetRepository.delete(budget);
    }

    @Override
    public ObservableList<Transaction> getAllTransactions() {
        List<Transaction> transactions = new ArrayList<>();
        transactionRepository.findAll().forEach(transactions::add);
        return FXCollections.observableArrayList(transactions);
    }

    @Override
    public Transaction addTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    @Override
    public void updateTransaction(Transaction transaction) {
        transactionRepository.save(transaction);
    }

    @Override
    public void deleteTransaction(Transaction transaction) {
        transactionRepository.delete(transaction);
    }

    @Override
    public double getTotalBudget() {
        return getAllBudgets().stream()
            .mapToDouble(b -> b.getTotalAmount().doubleValue())
            .sum();
    }

    @Override
    public double getTotalSpent() {
        return getAllBudgets().stream()
            .mapToDouble(b -> calculateTotalSpent(b).doubleValue())
            .sum();
    }

    @Override
    public double getRemainingBudget() {
        return getTotalBudget() - getTotalSpent();
    }

    @Override
    public double getSpendingProgress() {
        double totalBudget = getTotalBudget();
        return totalBudget > 0 ? getTotalSpent() / totalBudget : 0;
    }

    @Override
    public double getBudgetProgress() {
        return getTotalSpent() / getTotalBudget();
    }

    @Override
    public ObservableList<PieChart.Data> getBudgetDistribution() {
        List<Budget> budgets = getAllBudgets();
        List<PieChart.Data> data = budgets.stream()
            .map(budget -> new PieChart.Data(
                budget.getName(),
                budget.getTotalAmount().doubleValue()
            ))
            .collect(Collectors.toList());
        return FXCollections.observableArrayList(data);
    }

    @Override
    public ObservableList<PieChart.Data> getExpenseDistribution() {
        Map<String, Double> categoryTotals = new HashMap<>();
        
        getAllTransactions().stream()
            .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
            .forEach(t -> {
                String category = t.getCategory().getName();
                double amount = t.getAmount().doubleValue();
                categoryTotals.merge(category, amount, Double::sum);
            });

        List<PieChart.Data> data = categoryTotals.entrySet().stream()
            .map(e -> new PieChart.Data(e.getKey(), e.getValue()))
            .collect(Collectors.toList());

        return FXCollections.observableArrayList(data);
    }

    @Override
    public XYChart.Series<String, Number> getMonthlyTrend() {
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Monthly Spending");

        // Get the last 6 months of transactions
        LocalDate now = LocalDate.now();
        Map<YearMonth, Double> monthlyTotals = getAllTransactions().stream()
            .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
            .filter(t -> t.getTransactionDate().toLocalDate().isAfter(now.minusMonths(6)))
            .collect(Collectors.groupingBy(
                t -> YearMonth.from(t.getTransactionDate()),
                Collectors.summingDouble(t -> t.getAmount().doubleValue())
            ));

        // Sort by month and create data points
        monthlyTotals.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .forEach(e -> series.getData().add(
                new XYChart.Data<>(e.getKey().toString(), e.getValue())
            ));

        return series;
    }

    @Override
    public void setCurrentMonth(int year, int month) {
        // Implementation depends on how you want to handle current month selection
        // This could store the values in class fields or trigger some other logic
    }

    @Override
    public void generateMonthlyReport() {
        // Implementation for generating monthly report
        // This could create a PDF, Excel file, or other format
        logger.info("Monthly report generation not yet implemented");
    }

    @Override
    public void exportTransactions(String filePath) {
        try (PrintWriter writer = new PrintWriter(new FileWriter(filePath))) {
            writer.println("Date,Description,Category,Type,Amount");
            
            getAllTransactions().forEach(t -> writer.printf("%s,%s,%s,%s,%.2f%n",
                t.getTransactionDate(),
                t.getDescription().replace(",", ";"),
                t.getCategory().getName(),
                t.getType(),
                t.getAmount()
            ));
            
            logger.info("Transactions exported successfully to: {}", filePath);
        } catch (IOException e) {
            logger.error("Error exporting transactions", e);
            throw new RuntimeException("Failed to export transactions", e);
        }
    }

    @Override
    public void importTransactions(String filePath) {
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            // Skip header
            reader.readLine();
            
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length != 5) continue;

                try {
                    LocalDateTime date = LocalDateTime.parse(parts[0]);
                    String description = parts[1];
                    String categoryName = parts[2];
                    Transaction.TransactionType type = Transaction.TransactionType.valueOf(parts[3]);
                    BigDecimal amount = new BigDecimal(parts[4]);

                    // Find or create category
                    BudgetCategory category = findOrCreateCategory(categoryName);

                    // Create transaction
                    Transaction transaction = new Transaction();
                    transaction.setTransactionDate(date);
                    transaction.setDescription(description);
                    transaction.setCategory(category);
                    transaction.setType(type);
                    transaction.setAmount(amount);
                    transaction.setBudget(category.getBudget());

                    transactionRepository.save(transaction);
                } catch (Exception e) {
                    logger.warn("Skipping invalid transaction line: {}", line, e);
                }
            }
            
            logger.info("Transactions imported successfully from: {}", filePath);
        } catch (IOException e) {
            logger.error("Error importing transactions", e);
            throw new RuntimeException("Failed to import transactions", e);
        }
    }

    private BudgetCategory findOrCreateCategory(String categoryName) {
        // This is a simplified implementation
        // In a real application, you might want to handle this differently
        List<BudgetCategory> categories = StreamSupport.stream(categoryRepository.findAll().spliterator(), false)
            .collect(Collectors.toList());
        return categories.stream()
            .filter(c -> c.getName().equals(categoryName))
            .findFirst()
            .orElseGet(() -> {
                BudgetCategory newCategory = new BudgetCategory();
                newCategory.setName(categoryName);
                newCategory.setAllocatedAmount(BigDecimal.ZERO);
                // You might want to associate this with a default budget
                return categoryRepository.save(newCategory);
            });
    }
}