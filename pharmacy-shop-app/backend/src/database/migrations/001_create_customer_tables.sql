-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth TEXT,
  loyalty_points INTEGER DEFAULT 0,
  insurance_provider TEXT,
  insurance_number TEXT,
  chronic_conditions TEXT, -- JSON array
  allergies TEXT, -- JSON array
  preferred_payment_method TEXT,
  last_visit TEXT,
  total_spent REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create customer visits table
CREATE TABLE IF NOT EXISTS customer_visits (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  total_amount REAL NOT NULL,
  prescriptions_filled INTEGER NOT NULL,
  satisfaction INTEGER NOT NULL,
  feedback TEXT,
  items TEXT NOT NULL, -- JSON array of purchased items
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customer_visits_customer_id ON customer_visits (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_date ON customer_visits (visit_date); 