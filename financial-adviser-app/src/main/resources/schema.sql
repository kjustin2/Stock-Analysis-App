-- Drop tables if they exist
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS investment_transactions;
DROP TABLE IF EXISTS investments;
DROP TABLE IF EXISTS debts;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create goals table
CREATE TABLE goals (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(38,2) NOT NULL,
    current_amount DECIMAL(38,2) NOT NULL,
    deadline DATE NOT NULL,
    priority VARCHAR(255) NOT NULL,
    progress DOUBLE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create investments table
CREATE TABLE investments (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(255) NOT NULL,
    asset_type VARCHAR(255) NOT NULL,
    shares DECIMAL(38,2) NOT NULL,
    purchase_price DECIMAL(38,2) NOT NULL,
    current_price DECIMAL(38,2),
    gain_loss DECIMAL(38,2) NOT NULL,
    purchase_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create investment_transactions table
CREATE TABLE investment_transactions (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    investment_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(255) NOT NULL,
    shares DECIMAL(38,2) NOT NULL,
    price DECIMAL(38,2) NOT NULL,
    notes VARCHAR(255),
    FOREIGN KEY (investment_id) REFERENCES investments(id)
);

-- Create debts table
CREATE TABLE debts (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    debt_type VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    total_amount DECIMAL(38,2) NOT NULL,
    remaining_amount DECIMAL(38,2) NOT NULL,
    interest_rate DECIMAL(38,2) NOT NULL,
    minimum_payment DECIMAL(38,2) NOT NULL,
    start_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
); 