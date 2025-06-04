import {
  calculateOverallScore,
  calculateStyleConsistency,
  calculateColorHarmony,
  calculateFormality,
  checkComplementaryColors,
  checkLayeringOrder,
  checkRuleOfThirds,
  determineFormalityLevel
} from '../components/OutfitScorer';

describe('Style Utility Functions', () => {
  describe('calculateOverallScore', () => {
    it('should return 0 for empty items array', () => {
      expect(calculateOverallScore([])).toBe(0);
    });

    it('should calculate score based on multiple factors', () => {
      const items = [
        {
          category: 'suit',
          attributes: {
            color: 'navy',
            pattern: 'solid',
            material: 'wool',
            style: 'formal',
            layering: 'outer',
            formalityLevel: 'formal' as const,
            formalityScore: 0.9
          }
        },
        {
          category: 'dress shirt',
          attributes: {
            color: 'white',
            pattern: 'solid',
            material: 'cotton',
            style: 'formal',
            layering: 'base',
            formalityLevel: 'formal' as const,
            formalityScore: 0.8
          }
        }
      ];
      const score = calculateOverallScore(items);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateStyleConsistency', () => {
    it('should return 15 for empty styles array', () => {
      expect(calculateStyleConsistency([])).toBe(15);
    });

    it('should calculate consistency based on unique styles', () => {
      const styles = ['formal', 'formal', 'formal'];
      expect(calculateStyleConsistency(styles)).toBe(30);
    });

    it('should reduce score for mixed styles', () => {
      const styles = ['formal', 'casual', 'sporty'];
      const score = calculateStyleConsistency(styles);
      expect(score).toBeLessThan(30);
    });
  });

  describe('calculateColorHarmony', () => {
    it('should handle empty colors array', () => {
      expect(calculateColorHarmony([])).toBe(10);
    });

    it('should calculate harmony for complementary colors', () => {
      const colors = ['red', 'green'];
      expect(calculateColorHarmony(colors)).toBe(20);
    });

    it('should calculate harmony for non-complementary colors', () => {
      const colors = ['blue', 'red'];
      const score = calculateColorHarmony(colors);
      expect(score).toBeLessThan(20);
    });
  });

  describe('calculateFormality', () => {
    it('should calculate formality based on formal items', () => {
      const items = [
        {
          category: 'suit',
          attributes: {
            formalityLevel: 'formal' as const,
            material: 'wool'
          }
        }
      ];
      const score = calculateFormality(items);
      expect(score).toBeGreaterThan(10);
      expect(score).toBeLessThanOrEqual(20);
    });

    it('should handle items without formality level', () => {
      const items = [
        {
          category: 'shirt',
          attributes: {}
        }
      ];
      expect(calculateFormality(items)).toBe(10);
    });
  });

  describe('checkComplementaryColors', () => {
    it('should identify complementary color pairs', () => {
      expect(checkComplementaryColors(['red', 'green'])).toBe(true);
      expect(checkComplementaryColors(['blue', 'orange'])).toBe(true);
      expect(checkComplementaryColors(['yellow', 'purple'])).toBe(true);
    });

    it('should identify non-complementary color pairs', () => {
      expect(checkComplementaryColors(['red', 'blue'])).toBe(false);
      expect(checkComplementaryColors(['green', 'yellow'])).toBe(false);
    });
  });

  describe('checkLayeringOrder', () => {
    it('should validate correct layering order', () => {
      const items = [
        {
          category: 'shirt',
          attributes: { layering: 'base' }
        },
        {
          category: 'sweater',
          attributes: { layering: 'mid' }
        },
        {
          category: 'jacket',
          attributes: { layering: 'outer' }
        }
      ];
      expect(checkLayeringOrder(items)).toBe(true);
    });

    it('should identify incorrect layering order', () => {
      const items = [
        {
          category: 'jacket',
          attributes: { layering: 'outer' }
        },
        {
          category: 'shirt',
          attributes: { layering: 'base' }
        }
      ];
      expect(checkLayeringOrder(items)).toBe(false);
    });
  });

  describe('checkRuleOfThirds', () => {
    it('should validate outfit proportions', () => {
      const items = [
        {
          category: 'shirt',
          bbox: [0, 0, 100, 33] as [number, number, number, number]
        },
        {
          category: 'pants',
          bbox: [0, 33, 100, 100] as [number, number, number, number]
        }
      ];
      expect(checkRuleOfThirds(items)).toBe(true);
    });
  });

  describe('determineFormalityLevel', () => {
    it('should determine formality level based on score', () => {
      expect(determineFormalityLevel(19)).toBe('formal');
      expect(determineFormalityLevel(16)).toBe('business');
      expect(determineFormalityLevel(13)).toBe('business casual');
      expect(determineFormalityLevel(9)).toBe('smart casual');
      expect(determineFormalityLevel(5)).toBe('casual');
    });
  });
}); 