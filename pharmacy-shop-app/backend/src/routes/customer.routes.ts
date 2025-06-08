import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';

const router = Router();
const customerController = new CustomerController();

// Create new customer
router.post(
  '/',
  CustomerController.validateCreateCustomer,
  customerController.createCustomer.bind(customerController)
);

// Update customer
router.put(
  '/:id',
  CustomerController.validateUpdateCustomer,
  customerController.updateCustomer.bind(customerController)
);

// Get customer by ID
router.get(
  '/:id',
  customerController.getCustomer.bind(customerController)
);

// Search customers
router.get(
  '/search',
  customerController.searchCustomers.bind(customerController)
);

// Record customer visit
router.post(
  '/visit',
  CustomerController.validateRecordVisit,
  customerController.recordVisit.bind(customerController)
);

// Get customer visits
router.get(
  '/:customerId/visits',
  customerController.getCustomerVisits.bind(customerController)
);

// Update loyalty points
router.patch(
  '/:customerId/loyalty-points',
  customerController.updateLoyaltyPoints.bind(customerController)
);

// Get top customers
router.get(
  '/top',
  customerController.getTopCustomers.bind(customerController)
);

export default router; 