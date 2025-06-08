import { Router } from 'express';
import { MedicationController } from '../controllers/medication.controller';

const router = Router();
const medicationController = new MedicationController();

// Sync a medication with RxNorm
router.post(
  '/sync',
  MedicationController.validateSync,
  medicationController.syncMedication.bind(medicationController)
);

// Search medications
router.get(
  '/search/:query',
  MedicationController.validateSearch,
  medicationController.searchMedications.bind(medicationController)
);

// Get medication details
router.get(
  '/:id',
  medicationController.getMedicationDetails.bind(medicationController)
);

// List medications with pagination and category filter
router.get(
  '/',
  medicationController.listMedications.bind(medicationController)
);

// Get medication categories
router.get(
  '/categories',
  medicationController.getCategories.bind(medicationController)
);

export default router; 