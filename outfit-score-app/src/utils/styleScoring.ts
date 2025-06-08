import { DetectedItem, StyleScore, TrendReference, ColorPalette } from '../types';

// Comprehensive 2025 Fashion Trends Database with Sources
const FASHION_TRENDS_2025 = {
  colors: {
    trending: [
      { name: 'Lemon Grass', hex: '#F7E98E', confidence: 0.9, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Brandied Melon', hex: '#E67E22', confidence: 0.85, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Lyons Blue', hex: '#2C3E50', confidence: 0.8, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Damson', hex: '#8E44AD', confidence: 0.75, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Primrose Pink', hex: '#F8C8DC', confidence: 0.8, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Winterberry', hex: '#C0392B', confidence: 0.7, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Hot Chocolate', hex: '#8B4513', confidence: 0.85, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Chili Oil', hex: '#D32F2F', confidence: 0.75, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Poppy Red', hex: '#E53E3E', confidence: 0.8, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Bronze Brown', hex: '#CD853F', confidence: 0.9, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' }
    ],
    neutrals: [
      { name: 'Bright White', hex: '#FFFFFF', confidence: 0.95, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'French Roast', hex: '#3C2415', confidence: 0.9, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Vapor Blue', hex: '#B0C4DE', confidence: 0.8, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Crown Blue', hex: '#1E3A8A', confidence: 0.85, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' },
      { name: 'Mauve Wine', hex: '#8B5A6B', confidence: 0.75, source: 'Pantone NYFW AW25', url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032' }
    ],
    classic: ['black', 'white', 'navy', 'gray']
  },
  styles: {
    spring2025: [
      { name: 'Sophisticated Prep', description: 'Nautical stripes, boat shoes, transitional car coats', confidence: 0.9, source: 'Harper\'s Bazaar Spring 2025', url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/' },
      { name: 'Wafty Florals', description: 'Layer upon layer of sheer fabric in light, muted colorways', confidence: 0.85, source: 'Harper\'s Bazaar Spring 2025', url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/' },
      { name: 'Americana Plaid', description: 'Relaxed silhouettes with sophisticated checkered patterns', confidence: 0.8, source: 'Harper\'s Bazaar Spring 2025', url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/' },
      { name: 'Soft Dressing', description: 'Pastel hues with flowy silhouettes, peplums and ruffles', confidence: 0.9, source: 'Harper\'s Bazaar Spring 2025', url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/' },
      { name: 'Retro Groove', description: '1970s loud prints and boho-adjacent styling', confidence: 0.75, source: 'Harper\'s Bazaar Spring 2025', url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/' },
      { name: 'Chic Minimalism', description: 'Timeless black and white wardrobe builders', confidence: 0.95, source: 'Harper\'s Bazaar Spring 2025', url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/' },
      { name: 'Crafty Characters', description: 'Woven tops, skirts, and dresses with artful construction', confidence: 0.7, source: 'Harper\'s Bazaar Spring 2025', url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/' },
      { name: 'Strictly Business', description: 'Power suiting, skirts over pants, ties for office dressing', confidence: 0.8, source: 'Harper\'s Bazaar Spring 2025', url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/' },
      { name: 'Summer Suede', description: 'Suede incorporated in spring collections for transitional wear', confidence: 0.85, source: 'Harper\'s Bazaar Spring 2025', url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/' }
    ],
    vogue2025: [
      { name: 'Cloud Nine', description: 'Inflated and stuffed shapes with bubble hems', confidence: 0.8, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Tank Tops Reimagined', description: 'Basic tank silhouettes reimagined in myriad ways', confidence: 0.9, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Bewitched Romance', description: 'Dark romance with seductive, spell-casting looks', confidence: 0.75, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Skants & Hybrids', description: 'Skants, skorts, and skirts-over-pants hybrid garments', confidence: 0.7, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Tulle Wraps', description: 'Soft filter effect with tulle wrapping and veiling', confidence: 0.8, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Elevated Athleisure', description: 'Windbreakers with sequins, floor-sweeping polo dresses', confidence: 0.85, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Anti-Gravity Looks', description: 'Garments that defy gravity with nude-illusion tricks', confidence: 0.6, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Spring Plaid', description: 'Grunge-inspired plaid for any season or weather', confidence: 0.8, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Historical Silhouettes', description: 'Crinolines, farthingales, and panniers from the past', confidence: 0.65, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Utility Gear', description: 'Functional pieces in khaki and olive drab', confidence: 0.75, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Spiral Silhouettes', description: 'Continuous loop and spiral-inspired garment construction', confidence: 0.7, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' },
      { name: 'Masculine Archetypes', description: 'Dandy-inspired looks with heroic masculine references', confidence: 0.8, source: 'Vogue Spring 2025 Trends', url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more' }
    ],
    bazaar2025: [
      { name: 'No-Trend Trend', description: 'Personal style celebration over prescribed trends', confidence: 0.9, source: 'Harper\'s Bazaar 2025 Predictions', url: 'https://www.harpersbazaar.com/fashion/trends/g63305314/2025-trend-predictions-according-to-editors/' },
      { name: 'High Heel Resurgence', description: 'Return of stiletto, block, and elevated footwear', confidence: 0.8, source: 'Harper\'s Bazaar 2025 Predictions', url: 'https://www.harpersbazaar.com/fashion/trends/g63305314/2025-trend-predictions-according-to-editors/' },
      { name: 'Maximalism Return', description: 'Big, loud prints, colors, and rich textures', confidence: 0.85, source: 'Harper\'s Bazaar 2025 Predictions', url: 'https://www.harpersbazaar.com/fashion/trends/g63305314/2025-trend-predictions-according-to-editors/' },
      { name: 'Camp Aesthetic', description: 'Embracing absurdity as reaction to cultural dissonance', confidence: 0.75, source: 'Harper\'s Bazaar 2025 Predictions', url: 'https://www.harpersbazaar.com/fashion/trends/g63305314/2025-trend-predictions-according-to-editors/' },
      { name: 'Patch Culture', description: 'Girl Scout-like patches on everything for personalization', confidence: 0.7, source: 'Harper\'s Bazaar 2025 Predictions', url: 'https://www.harpersbazaar.com/fashion/trends/g63305314/2025-trend-predictions-according-to-editors/' },
      { name: 'XL Belt Buckles', description: 'Return of oversized buckles between Celine and rodeo style', confidence: 0.65, source: 'Harper\'s Bazaar 2025 Predictions', url: 'https://www.harpersbazaar.com/fashion/trends/g63305314/2025-trend-predictions-according-to-editors/' },
      { name: 'Isabel Marant Revival', description: 'Bohemian aesthetic and vintage pieces gaining popularity', confidence: 0.8, source: 'Harper\'s Bazaar 2025 Predictions', url: 'https://www.harpersbazaar.com/fashion/trends/g63305314/2025-trend-predictions-according-to-editors/' }
    ],
    // Legacy style categories for compatibility
    formal: ['suit', 'blazer', 'dress shirt', 'tie', 'dress pants', 'dress shoes', 'dress'],
    business: ['blazer', 'polo', 'loafers', 'chinos', 'blouse', 'pencil skirt'],
    casual: ['t-shirt', 'jeans', 'sneakers', 'hoodie', 'sweatshirt', 'casual dress'],
    bohemian: ['flowing dress', 'maxi skirt', 'peasant blouse', 'sandals', 'fringe', 'earth tones'],
    minimalist: ['clean lines', 'simple silhouettes', 'neutral colors', 'structured pieces'],
    athleisure: ['athletic wear', 'leggings', 'sports bra', 'sneakers', 'joggers', 'performance fabric']
  },
  accessories: ['jewelry', 'watch', 'belt', 'scarf', 'hat', 'bag', 'sunglasses'],
  patterns: ['stripes', 'polka dots', 'floral', 'geometric', 'plaid', 'animal print']
};

const CLOTHING_CATEGORIES = {
  tops: ['shirt', 'blouse', 't-shirt', 'tank', 'sweater', 'hoodie', 'blazer', 'jacket', 'coat'],
  bottoms: ['pants', 'jeans', 'skirt', 'shorts', 'leggings', 'trousers'],
  dresses: ['dress', 'gown', 'sundress', 'maxi dress'],
  footwear: ['shoes', 'boots', 'sneakers', 'sandals', 'heels', 'loafers'],
  accessories: ['belt', 'bag', 'purse', 'jewelry', 'watch', 'scarf', 'hat', 'sunglasses'],
  outerwear: ['coat', 'jacket', 'blazer', 'cardigan', 'vest']
};

export function calculateScore(items: DetectedItem[]): StyleScore {
  // Ensure we have valid items array
  if (!items || !Array.isArray(items) || items.length === 0) {
    return createDefaultScore();
  }

  // Filter out invalid items and ensure confidence is a number
  const validItems = items.filter(item => 
    item && 
    typeof item.label === 'string' && 
    typeof item.confidence === 'number' && 
    !isNaN(item.confidence) &&
    item.confidence >= 0
  );

  if (validItems.length === 0) {
    return createDefaultScore();
  }

  // Calculate individual score components
  const baseScore = 30; // Starting foundation
  const itemVariety = calculateItemVariety(validItems);
  const colorCoordination = calculateColorCoordination(validItems);
  const layering = calculateLayering(validItems);
  const accessories = calculateAccessories(validItems);
  const styleCoherence = calculateStyleCoherence(validItems);
  const patternScore = calculatePatternScore(validItems);
  const formalityScore = calculateFormalityScore(validItems);
  const essentialsScore = calculateEssentialsScore(validItems);
  const genderSpecificScore = calculateGenderSpecificScore(validItems);

  // Calculate overall score (ensure it's a valid number)
  const totalScore = baseScore + itemVariety + colorCoordination + layering + 
                    accessories + styleCoherence + patternScore + formalityScore + 
                    essentialsScore + genderSpecificScore;
  
  const overall = Math.min(Math.max(Math.round(totalScore), 0), 100);

  // Generate detailed feedback
  const feedback = generateDetailedFeedback(validItems, {
    baseScore,
    itemVariety,
    colorCoordination,
    layering,
    accessories,
    styleCoherence,
    patternScore,
    formalityScore,
    essentialsScore,
    genderSpecificScore
  });

  // Determine style category and occasion suitability
  const styleCategory = determineStyleCategory(validItems);
  const occasionSuitability = determineOccasionSuitability(validItems, overall);

  return {
    overall,
    breakdown: {
      baseScore,
      itemVariety,
      colorCoordination,
      layering,
      accessories,
      styleCoherence,
      patternScore,
      formalityScore,
      essentialsScore,
      genderSpecificScore
    },
    feedback,
    styleCategory,
    occasionSuitability,
    detectedColors: {
      dominantColors: [],
      colorHarmony: 'neutral',
      colorTemperature: 'neutral',
      colorSaturation: 'medium',
      seasonalAlignment: ['Year-round']
    }
  };
}

function createDefaultScore(): StyleScore {
  return {
    overall: 35,
    breakdown: {
      baseScore: 30,
      itemVariety: 5,
      colorCoordination: 0,
      layering: 0,
      accessories: 0,
      styleCoherence: 0,
      patternScore: 0,
      formalityScore: 0,
      essentialsScore: 0,
      genderSpecificScore: 0
    },
    feedback: {
      strengths: ['Basic outfit foundation'],
      improvements: ['Add more clothing items for better analysis', 'Consider adding accessories', 'Try incorporating trending colors'],
      trendAlignment: [{
        name: 'Upload Better Image',
        description: 'Upload a clearer image for better trend analysis',
        confidence: 0.5,
        source: 'Style Analysis',
        url: '#',
        category: 'style',
        season: 'year-round'
      }],
      colorAdvice: ['Experiment with 2025 trending colors like Lemon Grass or Brandied Melon']
    },
    styleCategory: 'Basic',
    occasionSuitability: ['Casual'],
    detectedColors: {
      dominantColors: [],
      colorHarmony: 'neutral',
      colorTemperature: 'neutral',
      colorSaturation: 'medium',
      seasonalAlignment: ['Year-round']
    }
  };
}

function calculateItemVariety(items: DetectedItem[]): number {
  const categories = new Set();
  
  items.forEach(item => {
    const label = item.label.toLowerCase();
    for (const [category, keywords] of Object.entries(CLOTHING_CATEGORIES)) {
      if (keywords.some(keyword => label.includes(keyword))) {
        categories.add(category);
        break;
      }
    }
  });

  // Score based on variety: 0-15 points
  const varietyCount = categories.size;
  if (varietyCount >= 4) return 15;
  if (varietyCount === 3) return 12;
  if (varietyCount === 2) return 8;
  if (varietyCount === 1) return 4;
  return 0;
}

function calculateColorCoordination(items: DetectedItem[]): number {
  // Simplified color coordination based on item confidence and variety
  // In a real implementation, this would analyze actual colors from the image
  const avgConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
  
  // Higher confidence suggests better color coordination
  return Math.round(avgConfidence * 10); // 0-10 points
}

function calculateLayering(items: DetectedItem[]): number {
  const layerableItems = ['jacket', 'blazer', 'cardigan', 'vest', 'coat', 'sweater'];
  const hasLayering = items.some(item => 
    layerableItems.some(layer => item.label.toLowerCase().includes(layer))
  );
  
  if (hasLayering) {
    // Check for proper layering (multiple top pieces)
    const topItems = items.filter(item => 
      CLOTHING_CATEGORIES.tops.some(top => item.label.toLowerCase().includes(top))
    );
    
    if (topItems.length >= 2) return 10;
    return 6;
  }
  
  return 0; // 0-10 points
}

function calculateAccessories(items: DetectedItem[]): number {
  const accessoryCount = items.filter(item =>
    FASHION_TRENDS_2025.accessories.some(acc => item.label.toLowerCase().includes(acc))
  ).length;

  // Score based on accessory count: 0-10 points
  if (accessoryCount >= 3) return 10;
  if (accessoryCount === 2) return 8;
  if (accessoryCount === 1) return 5;
  return 0;
}

function calculateStyleCoherence(items: DetectedItem[]): number {
  // Analyze style consistency across detected items
  const itemStyles = new Set();

  items.forEach(item => {
    const label = item.label.toLowerCase();
    
    // Check legacy style categories
    const legacyStyles = ['formal', 'business', 'casual', 'bohemian', 'minimalist', 'athleisure'];
    for (const style of legacyStyles) {
      const keywords = FASHION_TRENDS_2025.styles[style as keyof typeof FASHION_TRENDS_2025.styles];
      if (Array.isArray(keywords) && keywords.some(keyword => label.includes(keyword))) {
        itemStyles.add(style);
        break;
      }
    }
  });

  // Coherent style (1-2 style categories) scores higher
  if (itemStyles.size === 1) return 15; // Perfect coherence
  if (itemStyles.size === 2) return 10; // Good coherence
  if (itemStyles.size === 3) return 5;  // Mixed but acceptable
  return 0; // Too many conflicting styles
}

function calculatePatternScore(items: DetectedItem[]): number {
  // Check for pattern coordination
  const hasPatterns = items.some(item => 
    FASHION_TRENDS_2025.patterns.some(pattern => item.label.toLowerCase().includes(pattern))
  );

  if (hasPatterns) {
    // Bonus for incorporating patterns (trending in 2025)
    return 8;
  }
  
  // Neutral score for solid colors (still stylish)
  return 5;
}

function calculateFormalityScore(items: DetectedItem[]): number {
  const formalItems = items.filter(item =>
    FASHION_TRENDS_2025.styles.formal.some(formal => item.label.toLowerCase().includes(formal))
  );

  const casualItems = items.filter(item =>
    FASHION_TRENDS_2025.styles.casual.some(casual => item.label.toLowerCase().includes(casual))
  );

  // Score based on formality appropriateness
  if (formalItems.length > casualItems.length) return 10; // Formal outfit
  if (casualItems.length > formalItems.length) return 8;  // Casual outfit
  return 6; // Mixed formality
}

function calculateEssentialsScore(items: DetectedItem[]): number {
  const hasTop = items.some(item => 
    CLOTHING_CATEGORIES.tops.some(top => item.label.toLowerCase().includes(top))
  );
  
  const hasBottom = items.some(item => 
    CLOTHING_CATEGORIES.bottoms.some(bottom => item.label.toLowerCase().includes(bottom)) ||
    CLOTHING_CATEGORIES.dresses.some(dress => item.label.toLowerCase().includes(dress))
  );

  const hasFootwear = items.some(item =>
    CLOTHING_CATEGORIES.footwear.some(shoe => item.label.toLowerCase().includes(shoe))
  );

  // Score based on essential items present
  let score = 0;
  if (hasTop) score += 4;
  if (hasBottom) score += 4;
  if (hasFootwear) score += 2;
  
  return Math.min(score, 10);
}

function calculateGenderSpecificScore(items: DetectedItem[]): number {
  // Analyze gender-appropriate styling based on detected items
  const masculineItems = ['suit', 'tie', 'dress shirt', 'blazer', 'chinos', 'oxford shoes'];
  const feminineItems = ['dress', 'skirt', 'blouse', 'heels', 'jewelry', 'handbag'];

  const masculineCount = items.filter(item =>
    masculineItems.some(masc => item.label.toLowerCase().includes(masc))
  ).length;

  const feminineCount = items.filter(item =>
    feminineItems.some(fem => item.label.toLowerCase().includes(fem))
  ).length;

  // Score based on gender-specific styling coherence
  if (masculineCount > 0 && feminineCount === 0) return 12; // Masculine styling
  if (feminineCount > 0 && masculineCount === 0) return 12; // Feminine styling
  if (masculineCount > 0 && feminineCount > 0) return 8;    // Mixed/unisex styling
  return 5; // Neutral styling
}

function generateDetailedFeedback(items: DetectedItem[], scores: any): StyleScore['feedback'] {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const trendAlignment: TrendReference[] = [];
  const colorAdvice: string[] = [];

  // Get item analysis for dynamic feedback
  const itemLabels = items.map(item => item.label.toLowerCase());
  const itemCategories = items.map(item => item.category?.toLowerCase()).filter(Boolean);
  const detectedColors = items.map(item => item.color?.toLowerCase()).filter(Boolean);
  const uniqueCategories = [...new Set(itemCategories)];
  const uniqueColors = [...new Set(detectedColors)];

  // Dynamic strengths analysis
  if (scores.itemVariety >= 12) {
    const categoryCount = uniqueCategories.length;
    strengths.push(`Excellent variety with ${categoryCount} different clothing categories creates visual interest`);
  } else if (scores.itemVariety >= 8) {
    strengths.push(`Good variety of ${items.length} clothing items shows thoughtful outfit planning`);
  }

  if (scores.styleCoherence >= 10) {
    strengths.push('Strong style coherence - all pieces work harmoniously together');
  } else if (scores.styleCoherence >= 7) {
    strengths.push('Good style coordination between your outfit pieces');
  }

  if (scores.accessories >= 8) {
    const accessories = items.filter(item => item.category === 'accessories');
    if (accessories.length > 0) {
      strengths.push(`Great use of accessories (${accessories.map(a => a.label).join(', ')}) to enhance the overall look`);
    } else {
      strengths.push('Great attention to accessory details enhances the overall look');
    }
  }

  if (scores.layering >= 8) {
    const layerableItems = items.filter(item => 
      ['blazer', 'jacket', 'cardigan', 'vest', 'coat'].some(layer => item.label.toLowerCase().includes(layer))
    );
    if (layerableItems.length > 0) {
      strengths.push(`Skillful layering with ${layerableItems.map(l => l.label).join(', ')} adds depth and sophistication`);
    } else {
      strengths.push('Skillful layering technique adds depth and sophistication');
    }
  }

  if (uniqueColors.length >= 3) {
    strengths.push(`Confident use of ${uniqueColors.length} colors shows advanced color coordination skills`);
  } else if (uniqueColors.length === 1 && detectedColors.length >= 2) {
    strengths.push(`Monochromatic ${uniqueColors[0]} palette demonstrates sophisticated color discipline`);
  }

  // Dynamic improvements analysis
  if (scores.itemVariety < 8) {
    const missingCategories = ['tops', 'bottoms', 'footwear', 'outerwear', 'accessories']
      .filter(cat => !itemCategories.includes(cat));
    if (missingCategories.length > 0) {
      improvements.push(`Consider adding ${missingCategories.slice(0, 2).join(' or ')} to complete your outfit`);
    } else {
      improvements.push('Add more variety with different types of clothing items');
    }
  }

  if (scores.accessories < 5) {
    const hasAccessories = items.some(item => item.category === 'accessories');
    if (!hasAccessories) {
      improvements.push('Add accessories like jewelry, belts, or scarves to elevate your look');
    } else {
      improvements.push('Consider adding one more accessory piece for enhanced styling');
    }
  }

  if (scores.colorCoordination < 6) {
    if (uniqueColors.length > 3) {
      improvements.push('Simplify your color palette - try limiting to 2-3 main colors for better coordination');
    } else if (uniqueColors.length === 0) {
      improvements.push('Add some color to create visual interest and personality in your outfit');
    } else {
      improvements.push('Focus on better color coordination between pieces');
    }
  }

  if (scores.layering === 0) {
    const hasLayerableItems = items.some(item => 
      ['shirt', 'blouse', 'dress'].some(base => item.label.toLowerCase().includes(base))
    );
    if (hasLayerableItems) {
      improvements.push('Try adding a blazer, cardigan, or jacket for sophisticated layering');
    } else {
      improvements.push('Try layering pieces like blazers or cardigans for added style');
    }
  }

  // Pattern and texture suggestions
  const hasPatterns = items.some(item => item.pattern && item.pattern !== 'solid');
  if (!hasPatterns && scores.patternScore < 3) {
    improvements.push('Consider adding one patterned piece (stripes, florals, or geometric) for visual interest');
  }

  // Enhanced 2025 trend alignment with clickable references
  const detectedTrends = analyzeTrendAlignment(items, scores);
  trendAlignment.push(...detectedTrends);

  // Dynamic color advice based on detected items and colors
  
  // Generate specific color advice based on what's detected
  if (detectedColors.length === 0) {
    colorAdvice.push('Add color to your outfit with 2025 trending shades like Lemon Grass or Brandied Melon');
    colorAdvice.push('Consider incorporating one statement color piece to elevate your look');
  } else if (detectedColors.length === 1) {
    const dominantColor = detectedColors[0];
    colorAdvice.push(`Your ${dominantColor} creates a cohesive monochromatic look - try adding different textures in the same color family`);
    colorAdvice.push(`Complement your ${dominantColor} with neutral accessories for balance`);
  } else {
    const uniqueColors = [...new Set(detectedColors)];
    if (uniqueColors.length >= 3) {
      colorAdvice.push(`Your ${uniqueColors.length}-color palette shows confidence - ensure one color dominates for harmony`);
      colorAdvice.push('Consider using the 60-30-10 rule: 60% dominant color, 30% secondary, 10% accent');
    } else {
      colorAdvice.push(`Your ${uniqueColors.join(' and ')} combination works well - try adding a third accent color for visual interest`);
    }
  }

  // Style-specific color advice
  const hasBusinessItems = itemLabels.some(label => 
    ['suit', 'blazer', 'dress shirt', 'blouse'].some(business => label.includes(business))
  );
  const hasCasualItems = itemLabels.some(label => 
    ['jeans', 't-shirt', 'sneakers', 'hoodie'].some(casual => label.includes(casual))
  );
  const hasFormalItems = itemLabels.some(label => 
    ['dress', 'heels', 'gown', 'formal'].some(formal => label.includes(formal))
  );

  if (hasBusinessItems) {
    colorAdvice.push('For professional settings, try adding Lyons Blue or French Roast for sophisticated authority');
  }
  if (hasCasualItems) {
    colorAdvice.push('Casual looks benefit from Lemon Grass or Brandied Melon for a fresh, modern vibe');
  }
  if (hasFormalItems) {
    colorAdvice.push('Formal occasions call for Damson or Winterberry for elegant sophistication');
  }

  // Seasonal color advice
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 2 && currentMonth <= 4) { // Spring
    colorAdvice.push('Spring 2025: Try Primrose Pink or Vapor Blue for the season\'s soft, optimistic mood');
  } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer
    colorAdvice.push('Summer styling: Bright White and Lemon Grass capture the season\'s energy');
  } else if (currentMonth >= 8 && currentMonth <= 10) { // Fall
    colorAdvice.push('Fall palette: Hot Chocolate and Bronze Brown align with autumn\'s cozy sophistication');
  } else { // Winter
    colorAdvice.push('Winter elegance: Crown Blue and Mauve Wine add depth to cold-weather styling');
  }

  // Ensure we have at least some feedback
  if (strengths.length === 0) {
    strengths.push('Good foundation for building a stylish outfit');
  }
  if (improvements.length === 0) {
    improvements.push('Consider experimenting with different textures and accessories');
  }

  return { strengths, improvements, trendAlignment, colorAdvice };
}

function analyzeTrendAlignment(items: DetectedItem[], scores: any): TrendReference[] {
  const trends: TrendReference[] = [];
  
  // Dynamic trend analysis based on actual detected items and colors
  const itemLabels = items.map(item => item.label.toLowerCase());
  const itemColors = items.map(item => item.color?.toLowerCase()).filter(Boolean);
  const itemCategories = items.map(item => item.category?.toLowerCase()).filter(Boolean);
  
  // Sophisticated Prep - based on actual preppy elements
  const preppyElements = ['stripe', 'plaid', 'button-up', 'blazer', 'polo', 'boat', 'nautical', 'cardigan', 'khaki'];
  const preppyCount = preppyElements.filter(element => 
    itemLabels.some(label => label.includes(element))
  ).length;
  
  if (preppyCount >= 1) {
    const confidence = Math.min(0.6 + (preppyCount * 0.1), 0.9);
    trends.push({
      name: 'Sophisticated Prep',
      description: `Your ${preppyElements.filter(e => itemLabels.some(l => l.includes(e))).join(', ')} pieces align with nautical-inspired prep trend`,
      confidence,
      source: 'Harper\'s Bazaar Spring 2025',
      url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/',
      category: 'style',
      season: 'spring'
    });
  }

  // Chic Minimalism - based on neutral colors and clean lines
  const neutralColors = ['black', 'white', 'gray', 'beige', 'navy', 'cream'];
  const neutralCount = neutralColors.filter(color => 
    itemColors.some(itemColor => itemColor?.includes(color))
  ).length;
  const minimalItems = ['structured', 'clean', 'simple', 'tailored'];
  const minimalCount = minimalItems.filter(item => 
    itemLabels.some(label => label.includes(item))
  ).length;
  
  if (neutralCount >= 2 || minimalCount >= 1) {
    const confidence = Math.min(0.7 + (neutralCount * 0.05) + (minimalCount * 0.1), 0.95);
    trends.push({
      name: 'Chic Minimalism',
      description: `Your ${neutralColors.filter(c => itemColors.some(ic => ic?.includes(c))).join(', ')} palette embodies timeless minimalist elegance`,
      confidence,
      source: 'Harper\'s Bazaar Spring 2025',
      url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/',
      category: 'style',
      season: 'year-round'
    });
  }

  // Strictly Business - based on formal/business items
  const businessItems = ['suit', 'blazer', 'dress shirt', 'blouse', 'dress pants', 'pencil skirt', 'loafers'];
  const businessCount = businessItems.filter(item => 
    itemLabels.some(label => label.includes(item))
  ).length;
  
  if (businessCount >= 1 && scores.formalityScore >= 6) {
    const confidence = Math.min(0.7 + (businessCount * 0.1), 0.9);
    trends.push({
      name: 'Strictly Business',
      description: `Your ${businessItems.filter(b => itemLabels.some(l => l.includes(b))).join(', ')} pieces embody the power dressing revival`,
      confidence,
      source: 'Harper\'s Bazaar Spring 2025',
      url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/',
      category: 'style',
      season: 'year-round'
    });
  }

  // Tank Tops Reimagined - specific to tank/top styling
  const topVariations = ['tank', 'camisole', 'crop top', 'fitted top', 'sleeveless'];
  const topCount = topVariations.filter(top => 
    itemLabels.some(label => label.includes(top))
  ).length;
  
  if (topCount >= 1) {
    const confidence = Math.min(0.8 + (topCount * 0.05), 0.95);
    trends.push({
      name: 'Tank Tops Reimagined',
      description: `Your ${topVariations.filter(t => itemLabels.some(l => l.includes(t))).join(', ')} styling follows the reimagined basics trend`,
      confidence,
      source: 'Vogue Spring 2025 Trends',
      url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more',
      category: 'style',
      season: 'spring'
    });
  }

  // Elevated Athleisure - based on athletic/sporty elements
  const athleisureItems = ['sneakers', 'athletic', 'sport', 'joggers', 'leggings', 'track', 'performance', 'activewear'];
  const athleisureCount = athleisureItems.filter(item => 
    itemLabels.some(label => label.includes(item))
  ).length;
  
  if (athleisureCount >= 1) {
    const confidence = Math.min(0.75 + (athleisureCount * 0.1), 0.9);
    trends.push({
      name: 'Elevated Athleisure',
      description: `Your ${athleisureItems.filter(a => itemLabels.some(l => l.includes(a))).join(', ')} pieces align with luxury sportswear trend`,
      confidence,
      source: 'Vogue Spring 2025 Trends',
      url: 'https://www.vogue.com/article/the-essential-spring-2025-trends-fashion-celebrates-soft-power-the-sorcery-of-seduction-dandies-and-more',
      category: 'style',
      season: 'year-round'
    });
  }

  // Maximalism Return - based on patterns, colors, and accessories
  const boldElements = ['pattern', 'print', 'floral', 'geometric', 'animal print', 'bright', 'colorful'];
  const boldCount = boldElements.filter(element => 
    itemLabels.some(label => label.includes(element)) || 
    items.some(item => item.pattern?.includes(element))
  ).length;
  
  if (scores.patternScore >= 6 || scores.accessories >= 6 || boldCount >= 2) {
    const confidence = Math.min(0.7 + (boldCount * 0.05) + (scores.patternScore * 0.02), 0.85);
    trends.push({
      name: 'Maximalism Return',
      description: `Your bold styling with ${boldCount > 0 ? 'patterns and' : ''} accessories embraces the maximalist revival`,
      confidence,
      source: 'Harper\'s Bazaar 2025 Predictions',
      url: 'https://www.harpersbazaar.com/fashion/trends/g63305314/2025-trend-predictions-according-to-editors/',
      category: 'style',
      season: 'year-round'
    });
  }

  // High Heel Resurgence - based on actual heel detection
  const heelTypes = ['heels', 'pumps', 'stilettos', 'block heels', 'platform'];
  const heelCount = heelTypes.filter(heel => 
    itemLabels.some(label => label.includes(heel))
  ).length;
  
  if (heelCount >= 1) {
    const confidence = Math.min(0.8 + (heelCount * 0.05), 0.9);
    trends.push({
      name: 'High Heel Resurgence',
      description: `Your ${heelTypes.filter(h => itemLabels.some(l => l.includes(h))).join(', ')} follow the elevated footwear comeback`,
      confidence,
      source: 'Harper\'s Bazaar 2025 Predictions',
      url: 'https://www.harpersbazaar.com/fashion/trends/g63305314/2025-trend-predictions-according-to-editors/',
      category: 'accessory',
      season: 'year-round'
    });
  }

  // Soft Dressing - based on flowy, feminine elements
  const softElements = ['flowy', 'soft', 'feminine', 'ruffle', 'chiffon', 'silk', 'pastel', 'delicate'];
  const softCount = softElements.filter(element => 
    itemLabels.some(label => label.includes(element)) ||
    itemColors.some(color => ['pink', 'lavender', 'cream', 'peach'].includes(color || ''))
  ).length;
  
  if (softCount >= 1) {
    const confidence = Math.min(0.75 + (softCount * 0.08), 0.9);
    trends.push({
      name: 'Soft Dressing',
      description: `Your ${softElements.filter(s => itemLabels.some(l => l.includes(s))).join(', ')} pieces embody the gentle femininity trend`,
      confidence,
      source: 'Harper\'s Bazaar Spring 2025',
      url: 'https://www.harpersbazaar.com/fashion/trends/a62302060/spring-2025-fashion-trends/',
      category: 'style',
      season: 'spring'
    });
  }

  // Add dynamic color trends based on detected colors
  const colorTrends = analyzeColorTrends(items);
  trends.push(...colorTrends);

  // If no specific trends detected, provide contextual advice
  if (trends.length === 0) {
    const hasMultipleCategories = new Set(itemCategories).size >= 2;
    const hasColorVariety = itemColors.length >= 2;
    
    if (hasMultipleCategories && hasColorVariety) {
      trends.push({
        name: 'Personal Style Expression',
        description: 'Your diverse outfit pieces showcase individual style over trend-following - a key 2025 movement',
        confidence: 0.8,
        source: 'Harper\'s Bazaar 2025 Predictions',
        url: 'https://www.harpersbazaar.com/fashion/trends/g63305314/2025-trend-predictions-according-to-editors/',
        category: 'style',
        season: 'year-round'
      });
    } else {
      trends.push({
        name: 'Contemporary Basics',
        description: 'Your outfit foundation aligns with the timeless approach to modern dressing',
        confidence: 0.6,
        source: 'Style Analysis',
        url: '#',
        category: 'style',
        season: 'year-round'
      });
    }
  }

  // Sort by confidence and return top trends
  return trends
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3); // Limit to top 3 most relevant trends
}

function analyzeColorTrends(items: DetectedItem[]): TrendReference[] {
  const colorTrends: TrendReference[] = [];
  const detectedColors = items.map(item => item.color?.toLowerCase()).filter(Boolean);
  
  if (detectedColors.length === 0) {
    return colorTrends;
  }

  // Create color frequency map
  const colorFrequency: { [key: string]: number } = {};
  detectedColors.forEach(color => {
    if (color) {
      colorFrequency[color] = (colorFrequency[color] || 0) + 1;
    }
  });

  // 2025 Color Trend Mapping with more specific matching
  const colorTrendMap = [
    {
      keywords: ['yellow', 'lemon', 'lime', 'citrus', 'bright yellow'],
      trend: {
        name: 'Lemon Grass Vibrancy',
        description: 'Your vibrant yellow tones capture Pantone\'s energizing Lemon Grass trend',
        confidence: 0.9,
        source: 'Pantone NYFW AW25',
        url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032',
        category: 'color',
        season: 'spring'
      }
    },
    {
      keywords: ['orange', 'coral', 'peach', 'melon', 'tangerine', 'burnt orange'],
      trend: {
        name: 'Brandied Melon Warmth',
        description: 'Your warm orange palette reflects the sophisticated Brandied Melon trend',
        confidence: 0.85,
        source: 'Pantone NYFW AW25',
        url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032',
        category: 'color',
        season: 'year-round'
      }
    },
    {
      keywords: ['blue', 'navy', 'teal', 'royal blue', 'deep blue', 'sapphire'],
      trend: {
        name: 'Lyons Blue Elegance',
        description: 'Your sophisticated blue tones embody the luxurious Lyons Blue trend',
        confidence: 0.8,
        source: 'Pantone NYFW AW25',
        url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032',
        category: 'color',
        season: 'year-round'
      }
    },
    {
      keywords: ['brown', 'chocolate', 'bronze', 'coffee', 'caramel', 'cognac'],
      trend: {
        name: 'Rich Earth Tones',
        description: 'Your warm brown palette aligns with 2025\'s cozy, grounding color story',
        confidence: 0.85,
        source: 'Pantone NYFW AW25',
        url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032',
        category: 'color',
        season: 'fall'
      }
    },
    {
      keywords: ['purple', 'plum', 'damson', 'violet', 'lavender', 'mauve'],
      trend: {
        name: 'Damson Sophistication',
        description: 'Your purple tones capture the mysterious elegance of the Damson trend',
        confidence: 0.75,
        source: 'Pantone NYFW AW25',
        url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032',
        category: 'color',
        season: 'fall'
      }
    },
    {
      keywords: ['pink', 'rose', 'blush', 'primrose', 'soft pink', 'dusty pink'],
      trend: {
        name: 'Primrose Pink Romance',
        description: 'Your soft pink palette embodies the gentle Primrose Pink trend',
        confidence: 0.8,
        source: 'Pantone NYFW AW25',
        url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032',
        category: 'color',
        season: 'spring'
      }
    },
    {
      keywords: ['red', 'crimson', 'burgundy', 'wine', 'cherry', 'winterberry'],
      trend: {
        name: 'Bold Red Statement',
        description: 'Your striking red tones align with the powerful Winterberry and Chili Oil trends',
        confidence: 0.8,
        source: 'Pantone NYFW AW25',
        url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032',
        category: 'color',
        season: 'winter'
      }
    },
    {
      keywords: ['white', 'cream', 'ivory', 'off-white', 'bright white'],
      trend: {
        name: 'Bright White Purity',
        description: 'Your crisp white pieces embody the clean, fresh Bright White trend',
        confidence: 0.9,
        source: 'Pantone NYFW AW25',
        url: 'https://fashionunited.uk/news/fashion/pantone-unveils-nyfw-autumn-winter-2025-colour-report/2025020680032',
        category: 'color',
        season: 'year-round'
      }
    },
    {
      keywords: ['black', 'charcoal', 'ebony', 'jet black'],
      trend: {
        name: 'Timeless Black Power',
        description: 'Your classic black pieces represent enduring sophistication and modern minimalism',
        confidence: 0.85,
        source: 'Fashion Fundamentals',
        url: '#',
        category: 'color',
        season: 'year-round'
      }
    }
  ];

  // Analyze detected colors against trend map
  const matchedTrends = new Set<string>();
  
  colorTrendMap.forEach(({ keywords, trend }) => {
    const matchingColors = detectedColors.filter(color => 
      color && keywords.some(keyword => color.includes(keyword))
    );
    
    if (matchingColors.length > 0 && !matchedTrends.has(trend.name)) {
      const frequency = matchingColors.reduce((sum, color) => {
        return sum + (color ? (colorFrequency[color] || 0) : 0);
      }, 0);
      const adjustedConfidence = Math.min(trend.confidence + (frequency * 0.05), 0.95);
      
      colorTrends.push({
        ...trend,
        confidence: adjustedConfidence,
        description: `${trend.description} (detected in ${matchingColors.length} item${matchingColors.length > 1 ? 's' : ''})`
      } as TrendReference);
      
      matchedTrends.add(trend.name);
    }
  });

  // Color harmony analysis
  const uniqueColors = [...new Set(detectedColors)];
  if (uniqueColors.length >= 3) {
    colorTrends.push({
      name: 'Color Harmony Mastery',
      description: `Your ${uniqueColors.length}-color palette demonstrates sophisticated color coordination`,
      confidence: 0.7,
      source: 'Color Theory Analysis',
      url: '#',
      category: 'color',
      season: 'year-round'
    });
  }

  // Monochromatic analysis
  if (uniqueColors.length === 1 && detectedColors.length >= 2) {
    colorTrends.push({
      name: 'Monochromatic Elegance',
      description: `Your ${uniqueColors[0]} monochromatic approach showcases refined color discipline`,
      confidence: 0.8,
      source: 'Style Analysis',
      url: '#',
      category: 'color',
      season: 'year-round'
    });
  }

  return colorTrends
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2); // Return top 2 most relevant color trends
}

function determineStyleCategory(items: DetectedItem[]): string {
  const styleScores = {
    formal: 0,
    business: 0,
    casual: 0,
    bohemian: 0,
    minimalist: 0,
    athleisure: 0,
    romantic: 0,
    edgy: 0,
    preppy: 0
  };

  items.forEach(item => {
    const label = item.label.toLowerCase();
    const category = item.category?.toLowerCase() || '';
    
    // Formal style detection
    if (label.includes('suit') || label.includes('blazer') || label.includes('dress shirt') || 
        label.includes('tie') || label.includes('dress pants') || label.includes('dress shoes') ||
        label.includes('gown') || label.includes('cocktail dress') || label.includes('formal')) {
      styleScores.formal += 2;
    }
    
    // Business style detection
    if (label.includes('blouse') || label.includes('polo') || label.includes('loafers') || 
        label.includes('chinos') || label.includes('pencil skirt') || label.includes('work') ||
        label.includes('professional') || label.includes('business')) {
      styleScores.business += 2;
    }
    
    // Casual style detection
    if (label.includes('t-shirt') || label.includes('jeans') || label.includes('sneakers') || 
        label.includes('hoodie') || label.includes('sweatshirt') || label.includes('casual') ||
        label.includes('denim') || label.includes('shorts')) {
      styleScores.casual += 2;
    }
    
    // Athleisure detection
    if (label.includes('athletic') || label.includes('sport') || label.includes('gym') || 
        label.includes('leggings') || label.includes('joggers') || label.includes('track') ||
        label.includes('performance') || label.includes('activewear')) {
      styleScores.athleisure += 2;
    }
    
    // Bohemian style detection
    if (label.includes('flowing') || label.includes('maxi') || label.includes('peasant') || 
        label.includes('fringe') || label.includes('boho') || label.includes('flowy') ||
        label.includes('kimono') || label.includes('wrap')) {
      styleScores.bohemian += 2;
    }
    
    // Minimalist detection
    if (label.includes('clean') || label.includes('simple') || label.includes('structured') ||
        (item.color && ['black', 'white', 'gray', 'beige', 'navy'].includes(item.color.toLowerCase()))) {
      styleScores.minimalist += 1;
    }
    
    // Romantic style detection
    if (label.includes('lace') || label.includes('floral') || label.includes('ruffle') || 
        label.includes('feminine') || label.includes('soft') || label.includes('delicate') ||
        label.includes('silk') || label.includes('chiffon')) {
      styleScores.romantic += 2;
    }
    
    // Edgy style detection
    if (label.includes('leather') || label.includes('black') || label.includes('studded') || 
        label.includes('ripped') || label.includes('distressed') || label.includes('combat') ||
        label.includes('moto') || label.includes('punk')) {
      styleScores.edgy += 2;
    }
    
    // Preppy style detection
    if (label.includes('stripe') || label.includes('plaid') || label.includes('button-up') || 
        label.includes('cardigan') || label.includes('boat') || label.includes('prep') ||
        label.includes('polo') || label.includes('khaki')) {
      styleScores.preppy += 2;
    }
    
    // Category-based scoring
    if (category === 'formal') styleScores.formal += 1;
    if (category === 'business') styleScores.business += 1;
    if (category === 'casual') styleScores.casual += 1;
    if (category === 'dresses') {
      if (label.includes('cocktail') || label.includes('evening')) {
        styleScores.formal += 1;
      } else if (label.includes('maxi') || label.includes('flowy')) {
        styleScores.bohemian += 1;
      } else {
        styleScores.casual += 1;
      }
    }
  });

  // Find the style with the highest score
  const maxScore = Math.max(...Object.values(styleScores));
  
  // If no clear style emerges, determine based on item types
  if (maxScore === 0) {
    const hasFootwear = items.some(item => item.category === 'footwear');
    const hasTops = items.some(item => item.category === 'tops');
    const hasBottoms = items.some(item => item.category === 'bottoms');
    
    if (hasFootwear && hasTops && hasBottoms) {
      return 'Casual'; // Complete outfit defaults to casual
    } else if (items.some(item => item.label.includes('dress'))) {
      return 'Feminine';
    } else {
      return 'Contemporary';
    }
  }
  
  // Return the style with the highest score
  const dominantStyle = Object.entries(styleScores).find(([, score]) => score === maxScore)?.[0] || 'casual';
  
  return dominantStyle.charAt(0).toUpperCase() + dominantStyle.slice(1);
}

function determineOccasionSuitability(items: DetectedItem[], overallScore: number): string[] {
  const occasions: string[] = [];
  
  const hasFormalItems = items.some(item =>
    FASHION_TRENDS_2025.styles.formal.some(formal => item.label.toLowerCase().includes(formal))
  );
  
  const hasCasualItems = items.some(item =>
    FASHION_TRENDS_2025.styles.casual.some(casual => item.label.toLowerCase().includes(casual))
  );

  const hasBusinessItems = items.some(item =>
    FASHION_TRENDS_2025.styles.business.some(business => item.label.toLowerCase().includes(business))
  );

  // Determine suitable occasions based on items and score
  if (hasFormalItems && overallScore >= 70) {
    occasions.push('Formal events', 'Business meetings', 'Date nights');
  }
  
  if (hasBusinessItems && overallScore >= 60) {
    occasions.push('Work', 'Professional networking', 'Business casual events');
  }
  
  if (hasCasualItems || overallScore < 60) {
    occasions.push('Casual outings', 'Weekend activities', 'Running errands');
  }

  if (overallScore >= 80) {
    occasions.push('Special occasions', 'Social events');
  }

  return occasions.length > 0 ? occasions : ['Everyday wear'];
} 