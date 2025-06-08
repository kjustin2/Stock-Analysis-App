import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { MedicationSyncService } from '../services/medicationSync.service';
import { db } from '../database';
import { logger } from '../utils/logger';

export class MedicationController {
  private medicationSync: MedicationSyncService;

  constructor() {
    this.medicationSync = new MedicationSyncService();
  }

  // Validation chains
  static validateSync = [
    body('name').isString().trim().notEmpty().withMessage('Medication name is required'),
  ];

  static validateSearch = [
    param('query').isString().trim().notEmpty().withMessage('Search query is required'),
  ];

  // Controller methods
  async syncMedication(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name } = req.body;
      await this.medicationSync.syncMedication(name);
      
      res.status(200).json({ message: 'Medication synced successfully' });
    } catch (error) {
      logger.error('Error in syncMedication:', error);
      res.status(500).json({ error: 'Failed to sync medication' });
    }
  }

  async searchMedications(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const query = req.params.query;
      const medications = await db.all<any>(
        `SELECT * FROM medications 
         WHERE name LIKE ? OR generic_name LIKE ?
         ORDER BY name ASC`,
        [`%${query}%`, `%${query}%`]
      );

      res.status(200).json(medications);
    } catch (error) {
      logger.error('Error in searchMedications:', error);
      res.status(500).json({ error: 'Failed to search medications' });
    }
  }

  async getMedicationDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const medication = await db.get<any>(
        'SELECT * FROM medications WHERE id = ?',
        [id]
      );

      if (!medication) {
        return res.status(404).json({ error: 'Medication not found' });
      }

      // Get interactions for this medication
      const interactions = await db.all<any>(
        `SELECT 
           m2.name as interacting_drug,
           mi.severity,
           mi.description
         FROM medication_interactions mi
         JOIN medications m2 ON (
           mi.medication2_id = m2.id AND mi.medication1_id = ?
         ) OR (
           mi.medication1_id = m2.id AND mi.medication2_id = ?
         )`,
        [id, id]
      );

      res.status(200).json({
        ...medication,
        interactions
      });
    } catch (error) {
      logger.error('Error in getMedicationDetails:', error);
      res.status(500).json({ error: 'Failed to get medication details' });
    }
  }

  async listMedications(req: Request, res: Response) {
    try {
      const { category, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = 'SELECT * FROM medications';
      const params: any[] = [];

      if (category) {
        query += ' WHERE category = ?';
        params.push(category);
      }

      query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const medications = await db.all<any>(query, params);
      const total = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM medications' + (category ? ' WHERE category = ?' : ''),
        category ? [category] : []
      );

      res.status(200).json({
        medications,
        total: total?.count || 0,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (error) {
      logger.error('Error in listMedications:', error);
      res.status(500).json({ error: 'Failed to list medications' });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await db.all<{ category: string; count: number }>(
        `SELECT category, COUNT(*) as count 
         FROM medications 
         GROUP BY category 
         ORDER BY count DESC`
      );

      res.status(200).json(categories);
    } catch (error) {
      logger.error('Error in getCategories:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  }
} 