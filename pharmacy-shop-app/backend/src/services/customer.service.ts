import { db } from '../database';
import { logger } from '../utils/logger';

export interface CustomerProfile {
  id: string;
  name: string;
  type: 'regular' | 'oneTime' | 'elderly' | 'parent' | 'chronicCondition' | 'insurance' | 'corporate' | 'healthcare' | 'student' | 'athlete';
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  insuranceProvider?: string;
  insuranceNumber?: string;
  chronicConditions?: string[];
  allergies?: string[];
  preferredPaymentMethod?: string;
  lastVisit?: string;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerVisit {
  id: string;
  customerId: string;
  visitDate: string;
  totalAmount: number;
  prescriptionsFilled: number;
  satisfaction: number;
  feedback?: string;
  items: {
    medicationId: string;
    quantity: number;
    price: number;
  }[];
}

export class CustomerService {
  async createCustomer(customer: Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();

      await db.run(
        `INSERT INTO customers (
          id, name, type, email, phone, date_of_birth,
          loyalty_points, insurance_provider, insurance_number,
          chronic_conditions, allergies, preferred_payment_method,
          last_visit, total_spent, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          customer.name,
          customer.type,
          customer.email,
          customer.phone,
          customer.dateOfBirth,
          customer.loyaltyPoints,
          customer.insuranceProvider,
          customer.insuranceNumber,
          JSON.stringify(customer.chronicConditions || []),
          JSON.stringify(customer.allergies || []),
          customer.preferredPaymentMethod,
          customer.lastVisit,
          customer.totalSpent,
          now,
          now
        ]
      );

      return id;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, updates: Partial<CustomerProfile>): Promise<void> {
    try {
      const setClause = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = Object.values(updates);

      await db.run(
        `UPDATE customers SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id]
      );
    } catch (error) {
      logger.error('Error updating customer:', error);
      throw error;
    }
  }

  async getCustomer(id: string): Promise<CustomerProfile | undefined> {
    try {
      const customer = await db.get<CustomerProfile>(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );

      if (customer) {
        customer.chronicConditions = JSON.parse(customer.chronicConditions as unknown as string || '[]');
        customer.allergies = JSON.parse(customer.allergies as unknown as string || '[]');
      }

      return customer;
    } catch (error) {
      logger.error('Error getting customer:', error);
      return undefined;
    }
  }

  async searchCustomers(query: string): Promise<CustomerProfile[]> {
    try {
      const customers = await db.all<CustomerProfile>(
        `SELECT * FROM customers 
         WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
         ORDER BY name ASC`,
        [`%${query}%`, `%${query}%`, `%${query}%`]
      );

      return customers.map(customer => ({
        ...customer,
        chronicConditions: JSON.parse(customer.chronicConditions as unknown as string || '[]'),
        allergies: JSON.parse(customer.allergies as unknown as string || '[]')
      }));
    } catch (error) {
      logger.error('Error searching customers:', error);
      return [];
    }
  }

  async recordVisit(visit: Omit<CustomerVisit, 'id'>): Promise<string> {
    try {
      const id = Math.random().toString(36).substr(2, 9);

      await db.run(
        `INSERT INTO customer_visits (
          id, customer_id, visit_date, total_amount,
          prescriptions_filled, satisfaction, feedback, items
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          visit.customerId,
          visit.visitDate,
          visit.totalAmount,
          visit.prescriptionsFilled,
          visit.satisfaction,
          visit.feedback,
          JSON.stringify(visit.items)
        ]
      );

      // Update customer's last visit and total spent
      await db.run(
        `UPDATE customers 
         SET last_visit = ?, 
             total_spent = total_spent + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [visit.visitDate, visit.totalAmount, visit.customerId]
      );

      return id;
    } catch (error) {
      logger.error('Error recording visit:', error);
      throw error;
    }
  }

  async getCustomerVisits(customerId: string): Promise<CustomerVisit[]> {
    try {
      const visits = await db.all<CustomerVisit>(
        `SELECT * FROM customer_visits 
         WHERE customer_id = ? 
         ORDER BY visit_date DESC`,
        [customerId]
      );

      return visits.map(visit => ({
        ...visit,
        items: JSON.parse(visit.items as unknown as string)
      }));
    } catch (error) {
      logger.error('Error getting customer visits:', error);
      return [];
    }
  }

  async updateLoyaltyPoints(customerId: string, points: number): Promise<void> {
    try {
      await db.run(
        `UPDATE customers 
         SET loyalty_points = loyalty_points + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [points, customerId]
      );
    } catch (error) {
      logger.error('Error updating loyalty points:', error);
      throw error;
    }
  }

  async getTopCustomers(limit: number = 10): Promise<CustomerProfile[]> {
    try {
      const customers = await db.all<CustomerProfile>(
        `SELECT * FROM customers 
         ORDER BY total_spent DESC 
         LIMIT ?`,
        [limit]
      );

      return customers.map(customer => ({
        ...customer,
        chronicConditions: JSON.parse(customer.chronicConditions as unknown as string || '[]'),
        allergies: JSON.parse(customer.allergies as unknown as string || '[]')
      }));
    } catch (error) {
      logger.error('Error getting top customers:', error);
      return [];
    }
  }
} 