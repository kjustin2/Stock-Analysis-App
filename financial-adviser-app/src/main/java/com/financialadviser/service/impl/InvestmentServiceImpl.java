package com.financialadviser.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.financialadviser.model.Investment;
import com.financialadviser.model.User;
import com.financialadviser.repository.InvestmentRepository;
import com.financialadviser.service.InvestmentService;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;

@Service
@Transactional
public class InvestmentServiceImpl implements InvestmentService {
    
    private static final Logger logger = LoggerFactory.getLogger(InvestmentServiceImpl.class);
    
    private final InvestmentRepository investmentRepository;
    
    @Autowired
    public InvestmentServiceImpl(InvestmentRepository investmentRepository) {
        this.investmentRepository = investmentRepository;
    }
    
    @Override
    public Investment save(Investment investment) {
        return investmentRepository.save(investment);
    }
    
    @Override
    public void delete(Investment investment) {
        investmentRepository.delete(investment);
    }
    
    @Override
    public List<Investment> findByUser(User user) {
        return investmentRepository.findByUser(user);
    }
    
    @Override
    public List<Investment> findAll() {
        List<Investment> investments = new ArrayList<>();
        investmentRepository.findAll().forEach(investments::add);
        return investments;
    }
    
    @Override
    public BigDecimal getTotalInvestmentValue() {
        return findAll().stream()
            .<BigDecimal>map(investment -> investment.getValue())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    @Override
    public BigDecimal getTotalReturns() {
        return findAll().stream()
            .<BigDecimal>map(investment -> investment.getGainLoss())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    @Override
    public BigDecimal getCurrentValue() {
        return getTotalInvestmentValue();
    }
    
    @Override
    public double getReturnRate() {
        BigDecimal totalInvested = getTotalInvested();
        if (totalInvested.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return getTotalReturns()
            .divide(totalInvested, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .doubleValue();
    }
    
    @Override
    public ObservableList<PieChart.Data> getInvestmentDistribution() {
        Map<String, BigDecimal> symbolTotals = new HashMap<>();
        findAll().forEach(investment -> {
            symbolTotals.merge(investment.getSymbol(), investment.getValue(), BigDecimal::add);
        });
        
        return FXCollections.observableArrayList(
            symbolTotals.entrySet().stream()
                .map(entry -> new PieChart.Data(entry.getKey(), entry.getValue().doubleValue()))
                .collect(Collectors.toList())
        );
    }
    
    @Override
    public ObservableList<PieChart.Data> getAssetAllocation() {
        Map<String, BigDecimal> assetTypeTotals = new HashMap<>();
        findAll().forEach(investment -> {
            assetTypeTotals.merge(investment.getAssetType(), investment.getValue(), BigDecimal::add);
        });
        
        return FXCollections.observableArrayList(
            assetTypeTotals.entrySet().stream()
                .map(entry -> new PieChart.Data(entry.getKey(), entry.getValue().doubleValue()))
                .collect(Collectors.toList())
        );
    }
    
    @Override
    public XYChart.Series<String, Number> getValueTrend() {
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Portfolio Value");
        
        // For now, just show current value
        // In a real implementation, you would track historical values
        series.getData().add(new XYChart.Data<>("Current", getCurrentValue().doubleValue()));
        
        return series;
    }
    
    @Override
    public XYChart.Series<String, Number> getMonthlyTrend() {
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Monthly Value");
        
        // Get the last 6 months
        LocalDate now = LocalDate.now();
        Map<YearMonth, BigDecimal> monthlyValues = findAll().stream()
            .filter(i -> i.getPurchaseDate().isAfter(now.minusMonths(6)))
            .collect(Collectors.groupingBy(
                i -> YearMonth.from(i.getPurchaseDate()),
                Collectors.reducing(BigDecimal.ZERO, 
                    i -> i.getValue(),
                    (a, b) -> a.add(b))
            ));
            
        monthlyValues.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .forEach(e -> series.getData().add(
                new XYChart.Data<>(e.getKey().toString(), e.getValue().doubleValue())
            ));
            
        return series;
    }
    
    @Override
    public String getPortfolioAllocationSummary() {
        Map<String, BigDecimal> allocation = new HashMap<>();
        BigDecimal total = getCurrentValue();
        
        findAll().forEach(investment -> {
            BigDecimal percentage = investment.getValue()
                .divide(total, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            allocation.merge(investment.getAssetType(), percentage, BigDecimal::add);
        });
        
        return allocation.entrySet().stream()
            .map(e -> String.format("%s: %.1f%%", e.getKey(), e.getValue().doubleValue()))
            .collect(Collectors.joining(", "));
    }
    
    @Override
    public List<Investment> getInvestmentsOrderedByReturn() {
        return findAll().stream()
            .sorted((i1, i2) -> Double.compare(i2.getReturnRate(), i1.getReturnRate()))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Investment> getInvestmentsOrderedByValue() {
        return findAll().stream()
            .sorted((i1, i2) -> i2.getValue().compareTo(i1.getValue()))
            .collect(Collectors.toList());
    }
    
    @Override
    public Investment addInvestment(Investment investment) {
        return save(investment);
    }
    
    @Override
    public ObservableList<Investment> getAllInvestments() {
        return FXCollections.observableArrayList(findAll());
    }
    
    @Override
    public BigDecimal getTotalInvested() {
        return findAll().stream()
            .map(investment -> investment.getPurchasePrice().multiply(investment.getShares()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    @Override
    public double getRiskScore() {
        // Simple risk score calculation based on asset types and diversification
        double diversificationScore = getDiversificationLevel();
        double volatilityScore = getVolatility();
        
        // Weighted average of factors
        return (diversificationScore * 0.4) + ((10 - volatilityScore) * 0.6);
    }
    
    @Override
    public double getDiversificationLevel() {
        List<Investment> investments = findAll();
        if (investments.isEmpty()) {
            return 0.0;
        }
        
        // Count unique asset types
        long uniqueAssetTypes = investments.stream()
            .map(Investment::getAssetType)
            .distinct()
            .count();
            
        // Calculate Herfindahl-Hirschman Index (HHI)
        Map<String, BigDecimal> assetTypeShares = new HashMap<>();
        BigDecimal totalValue = getCurrentValue();
        
        investments.forEach(investment -> {
            BigDecimal share = investment.getValue()
                .divide(totalValue, 4, RoundingMode.HALF_UP);
            assetTypeShares.merge(investment.getAssetType(), share, BigDecimal::add);
        });
        
        double hhi = assetTypeShares.values().stream()
            .mapToDouble(share -> share.doubleValue() * share.doubleValue())
            .sum();
            
        // Convert HHI to a 0-10 scale where 10 is most diversified
        return (1 - hhi) * 10;
    }
    
    @Override
    public double getVolatility() {
        List<Investment> investments = findAll();
        if (investments.isEmpty()) {
            return 0.0;
        }
        
        // Calculate weighted average of daily price changes
        // In a real implementation, this would use historical price data
        BigDecimal totalValue = getCurrentValue();
        return investments.stream()
            .mapToDouble(investment -> {
                BigDecimal weight = investment.getValue()
                    .divide(totalValue, 4, RoundingMode.HALF_UP);
                return investment.getReturnRate() * weight.doubleValue();
            })
            .map(Math::abs)
            .sum();
    }
} 