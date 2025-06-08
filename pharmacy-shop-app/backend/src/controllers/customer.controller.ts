import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { CustomerService } from '../services/customer.service';
import { logger } from '../utils/logger';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  // Validation chains
  static validateCreateCustomer = [
    body('name').isString().notEmpty(),
    body('type').isIn([
      'regular', 'oneTime', 'elderly', 'parent', 'chronicCondition',
      'insurance', 'corporate', 'healthcare', 'student', 'athlete'
    ]),
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('dateOfBirth').optional().isISO8601(),
    body('loyaltyPoints').optional().isInt({ min: 0 }),
    body('insuranceProvider').optional().isString(),
    body('insuranceNumber').optional().isString(),
    body('chronicConditions').optional().isArray(),
    body('allergies').optional().isArray(),
    body('preferredPaymentMethod').optional().isString(),
  ];

  static validateUpdateCustomer = [
    param('id').isString().notEmpty(),
    body('name').optional().isString().notEmpty(),
    body('type').optional().isIn([
      'regular', 'oneTime', 'elderly', 'parent', 'chronicCondition',
      'insurance', 'corporate', 'healthcare', 'student', 'athlete'
    ]),
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('dateOfBirth').optional().isISO8601(),
    body('loyaltyPoints').optional().isInt({ min: 0 }),
    body('insuranceProvider').optional().isString(),
    body('insuranceNumber').optional().isString(),
    body('chronicConditions').optional().isArray(),
    body('allergies').optional().isArray(),
    body('preferredPaymentMethod').optional().isString(),
  ];

  static validateRecordVisit = [
    body('customerId').isString().notEmpty(),
    body('visitDate').isISO8601(),
    body('totalAmount').isFloat({ min: 0 }),
    body('prescriptionsFilled').isInt({ min: 0 }),
    body('satisfaction').isInt({ min: 1, max: 5 }),
    body('feedback').optional().isString(),
    body('items').isArray(),
    body('items.*.medicationId').isString(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.price').isFloat({ min: 0 }),
  ];

  async createCustomer(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const customerId = await this.customerService.createCustomer({
        ...req.body,
        loyaltyPoints: req.body.loyaltyPoints || 0,
        totalSpent: 0
      });
      
      res.status(201).json({ id: customerId });
    } catch (error) {
      logger.error('Error in createCustomer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }

  async updateCustomer(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      await this.customerService.updateCustomer(id, req.body);
      
      res.status(200).json({ message: 'Customer updated successfully' });
    } catch (error) {
      logger.error('Error in updateCustomer:', error);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  }

  async getCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const customer = await this.customerService.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      res.status(200).json(customer);
    } catch (error) {
      logger.error('Error in getCustomer:', error);
      res.status(500).json({ error: 'Failed to get customer' });
    }
  }

  async searchCustomers(req: Request, res: Response) {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const customers = await this.customerService.searchCustomers(query);
      res.status(200).json(customers);
    } catch (error) {
      logger.error('Error in searchCustomers:', error);
      res.status(500).json({ error: 'Failed to search customers' });
    }
  }

  async recordVisit(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const visitId = await this.customerService.recordVisit(req.body);
      res.status(201).json({ id: visitId });
    } catch (error) {
      logger.error('Error in recordVisit:', error);
      res.status(500).json({ error: 'Failed to record visit' });
    }
  }

  async getCustomerVisits(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const visits = await this.customerService.getCustomerVisits(customerId);
      res.status(200).json(visits);
    } catch (error) {
      logger.error('Error in getCustomerVisits:', error);
      res.status(500).json({ error: 'Failed to get customer visits' });
    }
  }

  async updateLoyaltyPoints(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customerId } = req.params;
      const { points } = req.body;

      await this.customerService.updateLoyaltyPoints(customerId, points);
      res.status(200).json({ message: 'Loyalty points updated successfully' });
    } catch (error) {
      logger.error('Error in updateLoyaltyPoints:', error);
      res.status(500).json({ error: 'Failed to update loyalty points' });
    }
  }

  async getTopCustomers(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const customers = await this.customerService.getTopCustomers(limit);
      res.status(200).json(customers);
    } catch (error) {
      logger.error('Error in getTopCustomers:', error);
      res.status(500).json({ error: 'Failed to get top customers' });
    }
  }
} 