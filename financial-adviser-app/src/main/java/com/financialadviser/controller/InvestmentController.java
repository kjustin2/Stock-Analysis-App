package com.financialadviser.controller;

import java.math.BigDecimal;
import java.net.URL;
import java.time.LocalDate;
import java.util.ResourceBundle;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;

import com.financialadviser.model.Investment;
import com.financialadviser.model.User;
import com.financialadviser.service.InvestmentService;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.chart.LineChart;
import javafx.scene.chart.PieChart;
import javafx.scene.control.Alert;
import javafx.scene.control.ComboBox;
import javafx.scene.control.DatePicker;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;

@Controller
public class InvestmentController implements Initializable {
    private static final Logger logger = LogManager.getLogger(InvestmentController.class);

    @FXML private TextField symbolField;
    @FXML private TextField sharesField;
    @FXML private TextField purchasePriceField;
    @FXML private DatePicker purchaseDatePicker;
    @FXML private ComboBox<String> assetTypeCombo;

    @FXML private TableView<Investment> investmentTable;
    @FXML private TableColumn<Investment, String> symbolColumn;
    @FXML private TableColumn<Investment, Double> sharesColumn;
    @FXML private TableColumn<Investment, Double> purchasePriceColumn;
    @FXML private TableColumn<Investment, Double> currentPriceColumn;
    @FXML private TableColumn<Investment, Double> gainLossColumn;

    @FXML private LineChart<String, Number> performanceChart;
    @FXML private PieChart allocationChart;
    @FXML private Label riskScoreLabel;
    @FXML private Label diversificationLabel;
    @FXML private Label volatilityLabel;
    @FXML private Label totalInvestedLabel;
    @FXML private Label currentValueLabel;
    @FXML private Label totalReturnLabel;
    @FXML private Label returnRateLabel;

    private final InvestmentService investmentService;
    private User currentUser;

    @Autowired
    public InvestmentController(InvestmentService investmentService) {
        this.investmentService = investmentService;
    }

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        setupTableColumns();
        setupAssetTypeCombo();
        updateInvestmentData();
    }

    private void setupTableColumns() {
        symbolColumn.setCellValueFactory(new PropertyValueFactory<>("symbol"));
        sharesColumn.setCellValueFactory(new PropertyValueFactory<>("shares"));
        purchasePriceColumn.setCellValueFactory(new PropertyValueFactory<>("purchasePrice"));
        currentPriceColumn.setCellValueFactory(new PropertyValueFactory<>("currentPrice"));
        gainLossColumn.setCellValueFactory(new PropertyValueFactory<>("gainLoss"));
    }

    private void setupAssetTypeCombo() {
        assetTypeCombo.getItems().addAll(
            "Stocks",
            "Bonds",
            "Mutual Funds",
            "ETFs",
            "Real Estate",
            "Cryptocurrency",
            "Other"
        );
    }

    @FXML
    private void handleAddInvestment() {
        try {
            String symbol = symbolField.getText();
            double shares = Double.parseDouble(sharesField.getText());
            double purchasePrice = Double.parseDouble(purchasePriceField.getText());
            LocalDate purchaseDate = purchaseDatePicker.getValue();
            String assetType = assetTypeCombo.getValue();

            if (symbol.isEmpty() || purchaseDate == null || assetType == null) {
                showError("Invalid Input", "Please fill in all fields.");
                return;
            }

            Investment investment = new Investment(symbol, shares, purchasePrice, purchaseDate, assetType);
            investment.setUser(currentUser);
            investmentService.addInvestment(investment);

            clearInputFields();
            updateInvestmentData();
            logger.info("Added new investment: {}", symbol);

        } catch (NumberFormatException e) {
            showError("Invalid Input", "Please enter valid numbers for shares and price.");
            logger.error("Error parsing investment input", e);
        } catch (Exception e) {
            showError("Error", "Failed to add investment.");
            logger.error("Error adding investment", e);
        }
    }

    private void updateInvestmentData() {
        investmentTable.setItems(investmentService.getAllInvestments());
        allocationChart.setData(investmentService.getAssetAllocation());
        performanceChart.getData().setAll(investmentService.getMonthlyTrend());

        BigDecimal totalInvested = investmentService.getTotalInvested();
        BigDecimal totalReturns = investmentService.getTotalReturns();
        BigDecimal currentValue = investmentService.getCurrentValue();
        double returnRate = totalInvested.doubleValue() > 0 
            ? (totalReturns.doubleValue() / totalInvested.doubleValue()) * 100 
            : 0;

        totalInvestedLabel.setText(String.format("$%.2f", totalInvested.doubleValue()));
        totalReturnLabel.setText(String.format("$%.2f", totalReturns.doubleValue()));
        currentValueLabel.setText(String.format("$%.2f", currentValue.doubleValue()));
        returnRateLabel.setText(String.format("%.2f%%", returnRate));

        riskScoreLabel.setText(String.format("Portfolio Risk Score: %.1f", investmentService.getRiskScore()));
        diversificationLabel.setText("Diversification: " + investmentService.getDiversificationLevel());
        volatilityLabel.setText(String.format("Volatility: %.2f%%", investmentService.getVolatility()));
    }

    private void clearInputFields() {
        symbolField.clear();
        sharesField.clear();
        purchasePriceField.clear();
        purchaseDatePicker.setValue(null);
        assetTypeCombo.setValue(null);
    }

    private void showError(String title, String content) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
        updateInvestmentData();
    }
} 