export interface DetectedColor {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
  dominance: 'primary' | 'secondary' | 'accent';
}

export interface ColorPalette {
  dominantColors: DetectedColor[];
  colorHarmony: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'neutral' | 'mixed';
  colorTemperature: 'warm' | 'cool' | 'neutral';
  colorSaturation: 'high' | 'medium' | 'low';
  seasonalAlignment: string[];
}

export interface TrendReference {
  name: string;
  description: string;
  confidence: number;
  source: string;
  url: string;
  category: 'color' | 'style' | 'silhouette' | 'pattern' | 'accessory' | 'seasonal';
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
}

export interface StyleScore {
  overall: number;
  breakdown: {
    baseScore: number;
    itemVariety: number;
    colorCoordination: number;
    layering: number;
    accessories: number;
    styleCoherence: number;
    patternScore: number;
    formalityScore: number;
    essentialsScore: number;
    genderSpecificScore: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    trendAlignment: TrendReference[];
    colorAdvice: string[];
  };
  styleCategory: string;
  occasionSuitability: string[];
  detectedColors: ColorPalette;
}

export interface DetectedItem {
  label: string;
  confidence: number;
  category?: string;
  color?: string;
  pattern?: string;
}

export interface ImageProcessingResult {
  items: DetectedItem[];
  dominantColors?: string[];
  error?: string;
}

export interface StyleAnalysisProps {
  items: DetectedItem[];
  imageUrl: string;
}

export interface OutfitScorerProps {
  className?: string;
} 