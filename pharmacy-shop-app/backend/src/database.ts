import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from './utils/logger';

class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!require('fs').existsSync(dataDir)) {
      require('fs').mkdirSync(dataDir, { recursive: true });
    }
    
    this.dbPath = path.join(dataDir, 'game.db');
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        logger.error('Error opening database:', err);
      } else {
        logger.info('Connected to SQLite database');
      }
    });
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  async exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      await this.run('BEGIN TRANSACTION');
      const result = await callback();
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  async setupDatabase(): Promise<void> {
    try {
      await this.exec(`
        CREATE TABLE IF NOT EXISTS game_state (
          id TEXT PRIMARY KEY,
          money INTEGER NOT NULL,
          reputation INTEGER NOT NULL,
          customer_satisfaction INTEGER NOT NULL,
          day INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS inventory (
          id TEXT PRIMARY KEY,
          game_id TEXT NOT NULL,
          medication_id TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          cost REAL NOT NULL,
          reorder_point INTEGER NOT NULL,
          expiry_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (game_id) REFERENCES game_state(id),
          FOREIGN KEY (medication_id) REFERENCES medications(id)
        );

        CREATE TABLE IF NOT EXISTS staff (
          id TEXT PRIMARY KEY,
          game_id TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          salary INTEGER NOT NULL,
          experience INTEGER NOT NULL,
          satisfaction INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (game_id) REFERENCES game_state(id)
        );

        CREATE TABLE IF NOT EXISTS staff_skills (
          staff_id TEXT NOT NULL,
          skill TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (staff_id, skill),
          FOREIGN KEY (staff_id) REFERENCES staff(id)
        );

        CREATE TABLE IF NOT EXISTS staff_schedule (
          staff_id TEXT NOT NULL,
          day TEXT NOT NULL,
          is_working BOOLEAN NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (staff_id, day),
          FOREIGN KEY (staff_id) REFERENCES staff(id)
        );

        CREATE TABLE IF NOT EXISTS competitors (
          id TEXT PRIMARY KEY,
          game_id TEXT NOT NULL,
          name TEXT NOT NULL,
          reputation INTEGER NOT NULL,
          market_share REAL NOT NULL,
          customer_satisfaction INTEGER NOT NULL,
          location_distance REAL NOT NULL,
          location_area TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (game_id) REFERENCES game_state(id)
        );

        CREATE TABLE IF NOT EXISTS competitor_prices (
          competitor_id TEXT NOT NULL,
          medication TEXT NOT NULL,
          price REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (competitor_id, medication),
          FOREIGN KEY (competitor_id) REFERENCES competitors(id)
        );

        CREATE TABLE IF NOT EXISTS competitor_specialties (
          competitor_id TEXT NOT NULL,
          specialty TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (competitor_id, specialty),
          FOREIGN KEY (competitor_id) REFERENCES competitors(id)
        );

        CREATE TABLE IF NOT EXISTS daily_stats (
          id TEXT PRIMARY KEY,
          game_id TEXT NOT NULL,
          day INTEGER NOT NULL,
          revenue REAL NOT NULL,
          expenses REAL NOT NULL,
          customers INTEGER NOT NULL,
          prescriptions_filled INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (game_id) REFERENCES game_state(id)
        );

        CREATE TABLE IF NOT EXISTS upgrades (
          id TEXT PRIMARY KEY,
          game_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          cost INTEGER NOT NULL,
          effect TEXT NOT NULL,
          purchased_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (game_id) REFERENCES game_state(id)
        );

        CREATE TABLE IF NOT EXISTS medications (
          id TEXT PRIMARY KEY,
          rxcui TEXT NOT NULL,
          name TEXT NOT NULL,
          generic_name TEXT,
          description TEXT,
          category TEXT NOT NULL,
          base_price REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS medication_interactions (
          medication1_id TEXT NOT NULL,
          medication2_id TEXT NOT NULL,
          severity TEXT NOT NULL,
          description TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (medication1_id, medication2_id),
          FOREIGN KEY (medication1_id) REFERENCES medications(id),
          FOREIGN KEY (medication2_id) REFERENCES medications(id)
        );
      `);

      logger.info('Database tables created successfully');
      
      // Initialize sample data
      await this.initializeSampleData();
    } catch (error) {
      logger.error('Error setting up database:', error);
      throw error;
    }
  }

  async initializeSampleData(): Promise<void> {
    try {
      // Check if medications already exist
      const medicationCount = await this.get<{ count: number }>('SELECT COUNT(*) as count FROM medications');
      
      if (medicationCount && medicationCount.count === 0) {
        // Insert sample medications
        const medications = [
          { id: 'med_001', rxcui: '161', name: 'Aspirin', generic_name: 'Acetylsalicylic acid', category: 'Pain Relief', base_price: 5.99 },
          { id: 'med_002', rxcui: '5640', name: 'Ibuprofen', generic_name: 'Ibuprofen', category: 'Pain Relief', base_price: 7.99 },
          { id: 'med_003', rxcui: '161', name: 'Acetaminophen', generic_name: 'Paracetamol', category: 'Pain Relief', base_price: 6.49 },
          { id: 'med_004', rxcui: '2670', name: 'Amoxicillin', generic_name: 'Amoxicillin', category: 'Antibiotics', base_price: 12.99 },
          { id: 'med_005', rxcui: '3640', name: 'Lisinopril', generic_name: 'Lisinopril', category: 'Blood Pressure', base_price: 15.99 },
          { id: 'med_006', rxcui: '4815', name: 'Metformin', generic_name: 'Metformin', category: 'Diabetes', base_price: 18.99 },
          { id: 'med_007', rxcui: '36567', name: 'Simvastatin', generic_name: 'Simvastatin', category: 'Cholesterol', base_price: 22.99 },
          { id: 'med_008', rxcui: '8896', name: 'Omeprazole', generic_name: 'Omeprazole', category: 'Acid Reflux', base_price: 14.99 },
          { id: 'med_009', rxcui: '7052', name: 'Amlodipine', generic_name: 'Amlodipine', category: 'Blood Pressure', base_price: 16.99 },
          { id: 'med_010', rxcui: '32968', name: 'Atorvastatin', generic_name: 'Atorvastatin', category: 'Cholesterol', base_price: 24.99 }
        ];

        for (const med of medications) {
          await this.run(
            'INSERT INTO medications (id, rxcui, name, generic_name, category, base_price) VALUES (?, ?, ?, ?, ?, ?)',
            [med.id, med.rxcui, med.name, med.generic_name, med.category, med.base_price]
          );
        }

        logger.info('Sample medications inserted successfully');
      }
    } catch (error) {
      logger.error('Error initializing sample data:', error);
    }
  }

  async createNewGame(): Promise<string> {
    try {
      const gameId = 'game_' + Math.random().toString(36).substr(2, 9);
      
      // Create game state
      await this.run(
        'INSERT INTO game_state (id, money, reputation, customer_satisfaction, day) VALUES (?, ?, ?, ?, ?)',
        [gameId, 10000, 50, 75, 1]
      );

      // Create initial inventory
      const medications = await this.all<{ id: string; name: string; base_price: number; category: string }>('SELECT * FROM medications LIMIT 5');
      
      for (const med of medications) {
        const inventoryId = 'inv_' + Math.random().toString(36).substr(2, 9);
        await this.run(
          'INSERT INTO inventory (id, game_id, medication_id, quantity, price, cost, reorder_point, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            inventoryId,
            gameId,
            med.id,
            Math.floor(Math.random() * 50) + 10, // 10-60 quantity
            med.base_price * 1.5, // 50% markup
            med.base_price,
            10, // reorder point
            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
          ]
        );
      }

      // Create competitors
      const competitors = [
        { name: 'HealthMart Pharmacy', reputation: 75, market_share: 0.25, customer_satisfaction: 80, distance: 0.5, area: 'Downtown' },
        { name: 'MediCare Plus', reputation: 70, market_share: 0.20, customer_satisfaction: 75, distance: 1.2, area: 'Suburbs' },
        { name: 'QuickMeds Express', reputation: 65, market_share: 0.15, customer_satisfaction: 70, distance: 0.8, area: 'Mall' },
        { name: 'Family Pharmacy', reputation: 80, market_share: 0.18, customer_satisfaction: 85, distance: 2.0, area: 'Residential' }
      ];

      for (const comp of competitors) {
        const competitorId = 'comp_' + Math.random().toString(36).substr(2, 9);
        await this.run(
          'INSERT INTO competitors (id, game_id, name, reputation, market_share, customer_satisfaction, location_distance, location_area) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [competitorId, gameId, comp.name, comp.reputation, comp.market_share, comp.customer_satisfaction, comp.distance, comp.area]
        );

        // Add competitor prices
        for (const med of medications) {
          const competitorPrice = med.base_price * (1.3 + Math.random() * 0.4); // 30-70% markup
          await this.run(
            'INSERT INTO competitor_prices (competitor_id, medication, price) VALUES (?, ?, ?)',
            [competitorId, med.name, competitorPrice]
          );
        }
      }

      logger.info(`New game created with ID: ${gameId}`);
      return gameId;
    } catch (error) {
      logger.error('Error creating new game:', error);
      throw error;
    }
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export const db = new Database();
export const setupDatabase = () => db.setupDatabase(); 