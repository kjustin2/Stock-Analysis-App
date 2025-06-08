import { DrugInfoService } from './drugInfo.service';
import { db } from '../database';
import { logger } from '../utils/logger';

export class MedicationSyncService {
  private drugInfoService: DrugInfoService;

  constructor() {
    this.drugInfoService = new DrugInfoService();
  }

  async syncMedication(name: string): Promise<void> {
    try {
      // Search for drug in RxNorm
      const drugs = await this.drugInfoService.searchDrug(name);
      if (drugs.length === 0) {
        logger.warn(`No drug found in RxNorm for name: ${name}`);
        return;
      }

      const drug = drugs[0]; // Take the first match
      
      // Get additional details
      const details = await this.drugInfoService.getDrugDetails(drug.rxcui);
      const generics = await this.drugInfoService.getGenericAlternatives(drug.rxcui);
      
      // Calculate base price (this would be replaced with real pricing data in a production system)
      const basePrice = this.calculateBasePrice(details);

      // Insert or update medication in database
      await db.transaction(async () => {
        // Check if medication exists
        const existing = await db.get<{ id: string }>(
          'SELECT id FROM medications WHERE rxcui = ?',
          [drug.rxcui]
        );

        if (existing) {
          // Update existing medication
          await db.run(
            `UPDATE medications 
             SET name = ?, generic_name = ?, description = ?, 
                 category = ?, base_price = ?, updated_at = CURRENT_TIMESTAMP
             WHERE rxcui = ?`,
            [
              drug.name,
              generics[0]?.name || null,
              this.extractDescription(details),
              this.determineCategory(details),
              basePrice,
              drug.rxcui
            ]
          );
        } else {
          // Insert new medication
          await db.run(
            `INSERT INTO medications (
               id, rxcui, name, generic_name, description, 
               category, base_price
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              drug.rxcui, // Using rxcui as id for simplicity
              drug.rxcui,
              drug.name,
              generics[0]?.name || null,
              this.extractDescription(details),
              this.determineCategory(details),
              basePrice
            ]
          );
        }

        // Sync interactions
        await this.syncInteractions(drug.rxcui);
      });

      logger.info(`Successfully synced medication: ${name}`);
    } catch (error) {
      logger.error('Error syncing medication:', error);
      throw error;
    }
  }

  private async syncInteractions(rxcui: string): Promise<void> {
    try {
      // Get all medications to check interactions with
      const medications = await db.all<{ id: string; rxcui: string }>(
        'SELECT id, rxcui FROM medications'
      );

      // Get interactions from RxNorm
      const interactions = await this.drugInfoService.getInteractions(
        medications.map(m => m.rxcui)
      );

      // Clear existing interactions for this medication
      await db.run(
        `DELETE FROM medication_interactions 
         WHERE medication1_id = ? OR medication2_id = ?`,
        [rxcui, rxcui]
      );

      // Insert new interactions
      for (const interaction of interactions) {
        for (const pair of interaction.interactionPair) {
          const drug1 = pair.interactionConcept[0].minConceptItem;
          const drug2 = pair.interactionConcept[1].minConceptItem;

          await db.run(
            `INSERT INTO medication_interactions (
               medication1_id, medication2_id, severity, description
             ) VALUES (?, ?, ?, ?)`,
            [
              drug1.rxcui,
              drug2.rxcui,
              pair.severity || 'N/A',
              pair.description
            ]
          );
        }
      }
    } catch (error) {
      logger.error('Error syncing interactions:', error);
      throw error;
    }
  }

  private calculateBasePrice(details: any[]): number {
    // This is a simplified pricing model
    // In a real system, this would use actual market data
    const basePrice = 10; // Minimum price
    let multiplier = 1;

    // Adjust price based on drug details
    details.forEach(group => {
      switch (group.tty) {
        case 'SCD': // Semantic Clinical Drug
          multiplier *= 1.2;
          break;
        case 'BPCK': // Brand Name Pack
          multiplier *= 1.5;
          break;
        case 'SBD': // Semantic Branded Drug
          multiplier *= 2;
          break;
      }
    });

    return Math.round(basePrice * multiplier * 100) / 100;
  }

  private extractDescription(details: any[]): string {
    // Extract relevant information from drug details to create a description
    const relevantGroups = details.filter(group => 
      ['SCD', 'BPCK', 'SBD'].includes(group.tty)
    );

    if (relevantGroups.length === 0) {
      return 'No description available';
    }

    return relevantGroups[0].conceptProperties?.[0]?.name || 'No description available';
  }

  private determineCategory(details: any[]): string {
    // Determine drug category based on details
    // This is a simplified categorization
    const categories = new Set<string>();

    details.forEach(group => {
      if (group.tty === 'SCD' || group.tty === 'SBD') {
        const name = group.conceptProperties?.[0]?.name?.toLowerCase() || '';
        
        if (name.includes('tablet')) categories.add('tablets');
        else if (name.includes('capsule')) categories.add('capsules');
        else if (name.includes('liquid') || name.includes('solution')) categories.add('liquids');
        else if (name.includes('injection')) categories.add('injectables');
        else if (name.includes('cream') || name.includes('ointment')) categories.add('topicals');
        else categories.add('other');
      }
    });

    return Array.from(categories)[0] || 'other';
  }
} 