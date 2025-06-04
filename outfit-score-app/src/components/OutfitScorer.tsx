'use client';

import React from 'react';
import { useCallback, useState, useEffect } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import * as tf from '@tensorflow/tfjs';
// Import models
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocossd from '@tensorflow-models/coco-ssd';
import * as blazeface from '@tensorflow-models/blazeface';

// Initialize TensorFlow.js for browser
tf.setBackend('webgl');

interface ModelBundle {
  mobileNet: mobilenet.MobileNet | null;
  objectDetector: cocossd.ObjectDetection | null;
  faceDetector: blazeface.BlazeFaceModel | null;
}

// Fashion detection configuration
const FASHION_MODEL = "patrickjohncyh/fashion-clip";
const CONFIDENCE_THRESHOLD = 0.05;

// Rename to styleCategories for neutrality but keep the detection logic
const styleCategories = {
  masculine: {
    clothing: [
      'suit', 'tuxedo', 'blazer', 'mens dress shirt', 'tie',
      'bow tie', 'mens shoes', 'mens boots', 'mens watch',
      'cufflinks', 'pocket square', 'mens belt', 'mens trousers',
      'mens jeans', 'mens coat', 'mens jacket', 'mens sweater',
      'mens polo', 'mens t-shirt', 'mens accessories'
    ],
    formalWear: [
      'suit', 'tuxedo', 'blazer', 'dress shirt', 'tie', 'bow tie',
      'oxford shoes', 'dress shoes', 'cufflinks', 'pocket square',
      'dress pants', 'slacks', 'formal wear'
    ],
    accessories: [
      'tie', 'bow tie', 'mens watch', 'cufflinks', 'pocket square',
      'tie clip', 'mens belt', 'mens bracelet', 'mens necklace',
      'mens ring', 'mens sunglasses', 'mens scarf'
    ]
  },
  feminine: {
    clothing: [
      'dress', 'gown', 'skirt', 'blouse', 'womens top',
      'womens pants', 'womens jeans', 'womens shoes',
      'womens boots', 'womens heels', 'womens flats',
      'womens coat', 'womens jacket', 'womens sweater',
      'womens accessories', 'handbag', 'purse'
    ],
    formalWear: [
      'evening gown', 'cocktail dress', 'formal dress',
      'formal skirt', 'formal blouse', 'dress shoes',
      'high heels', 'formal clutch', 'formal wear'
    ],
    accessories: [
      'necklace', 'earrings', 'bracelet', 'ring', 'handbag',
      'clutch', 'purse', 'womens scarf', 'womens belt',
      'womens watch', 'womens sunglasses'
    ]
  }
};

// Map of gender-specific terms to neutral terms
const neutralTerms = {
  'mens dress shirt': 'dress shirt',
  'mens shoes': 'shoes',
  'mens boots': 'boots',
  'mens watch': 'watch',
  'mens belt': 'belt',
  'mens trousers': 'trousers',
  'mens jeans': 'jeans',
  'mens coat': 'coat',
  'mens jacket': 'jacket',
  'mens sweater': 'sweater',
  'mens polo': 'polo shirt',
  'mens t-shirt': 't-shirt',
  'mens accessories': 'accessories',
  'mens bracelet': 'bracelet',
  'mens necklace': 'necklace',
  'mens ring': 'ring',
  'mens sunglasses': 'sunglasses',
  'mens scarf': 'scarf',
  'womens top': 'top',
  'womens pants': 'pants',
  'womens jeans': 'jeans',
  'womens shoes': 'shoes',
  'womens boots': 'boots',
  'womens heels': 'heels',
  'womens flats': 'flats',
  'womens coat': 'coat',
  'womens jacket': 'jacket',
  'womens sweater': 'sweater',
  'womens accessories': 'accessories',
  'womens scarf': 'scarf',
  'womens belt': 'belt',
  'womens watch': 'watch',
  'womens sunglasses': 'sunglasses'
};

interface ScoreResult {
  score: number;
  detectedItems: DetectedItem[];
  feedback: string[];
  styleElements: string[];
}

// Expand fashion categories with more detailed items
const fashionCategories = {
  'Formal Wear': [
    'suit', 'tuxedo', 'dress', 'gown', 'blazer', 'formal',
    'windsor tie', 'bow tie', 'necktie', 'dress shirt',
    'business suit', 'three piece suit', 'two piece',
    'white suit', 'black suit', 'blue suit', 'gray suit',
    'formal wear', 'formal attire', 'dress pants', 'slacks',
    'evening gown', 'cocktail dress', 'formal dress',
    'dinner jacket', 'tailcoat', 'morning coat', 'waistcoat'
  ],
  'Shirts & Tops': [
    'shirt', 'dress_shirt', 'button-down', 'blouse', 'polo',
    'white shirt', 'blue shirt', 'collared shirt', 'formal shirt',
    'business shirt', 'oxford shirt', 'cotton shirt', 't-shirt',
    'sweater', 'pullover', 'cardigan', 'sweatshirt', 'jersey',
    'tank top', 'crop top', 'top', 'blouse', 'tunic',
    'turtleneck', 'henley', 'v-neck', 'crew neck', 'sleeveless',
    'long sleeve', 'short sleeve', 'knit top', 'silk blouse',
    'cashmere sweater', 'wool sweater', 'hoodie', 'vest'
  ],
  'Pants & Bottoms': [
    'pants', 'trousers', 'slacks', 'dress pants',
    'suit pants', 'formal pants', 'khakis', 'chinos',
    'jeans', 'denim', 'shorts', 'skirt', 'dress pants',
    'cargo pants', 'leggings', 'sweatpants', 'culottes',
    'palazzo pants', 'wide-leg pants', 'skinny pants',
    'straight-leg pants', 'cropped pants', 'pleated pants',
    'high-waisted', 'midi skirt', 'mini skirt', 'maxi skirt',
    'pencil skirt', 'a-line skirt', 'wrap skirt'
  ],
  'Outerwear': [
    'jacket', 'coat', 'blazer', 'suit jacket', 'overcoat',
    'raincoat', 'trench coat', 'parka', 'windbreaker',
    'leather jacket', 'denim jacket', 'bomber jacket',
    'cardigan', 'sweater', 'hoodie', 'vest', 'peacoat',
    'duffle coat', 'mac coat', 'utility jacket', 'sports coat',
    'down jacket', 'fur coat', 'shearling coat', 'quilted jacket',
    'varsity jacket', 'military jacket', 'moto jacket'
  ],
  'Dresses & Suits': [
    'dress', 'gown', 'evening dress', 'cocktail dress',
    'sundress', 'maxi dress', 'mini dress', 'suit',
    'two-piece suit', 'three-piece suit', 'tuxedo',
    'formal suit', 'business suit', 'sheath dress',
    'wrap dress', 'shift dress', 'a-line dress',
    'bodycon dress', 'shirt dress', 'slip dress',
    'ball gown', 'jumpsuit', 'romper', 'pinafore dress'
  ],
  'Footwear': [
    'shoes', 'dress shoes', 'oxford shoes', 'loafers',
    'boots', 'sneakers', 'athletic shoes', 'sandals',
    'heels', 'high heels', 'flats', 'formal shoes',
    'leather shoes', 'canvas shoes', 'running shoes',
    'derby shoes', 'brogues', 'monk straps', 'chelsea boots',
    'ankle boots', 'combat boots', 'platform shoes',
    'wedges', 'espadrilles', 'mules', 'ballet flats',
    'pumps', 'slingbacks', 'boat shoes', 'moccasins'
  ],
  'Accessories': [
    'tie', 'bow_tie', 'necktie', 'belt', 'watch',
    'cufflinks', 'pocket square', 'lapel pin',
    'jewelry', 'necklace', 'bracelet', 'ring',
    'scarf', 'hat', 'cap', 'beanie', 'sunglasses',
    'glasses', 'purse', 'bag', 'handbag', 'wallet',
    'clutch', 'tote', 'backpack', 'briefcase',
    'messenger bag', 'satchel', 'crossbody bag',
    'brooch', 'earrings', 'hair accessories',
    'gloves', 'umbrella', 'suspenders', 'tie clip',
    'collar stays', 'bandana', 'shawl', 'stole'
  ],
  'Colors': [
    'white', 'black', 'blue', 'gray', 'navy',
    'brown', 'tan', 'beige', 'charcoal', 'red',
    'green', 'yellow', 'purple', 'pink', 'orange',
    'silver', 'gold', 'burgundy', 'cream', 'khaki',
    'olive', 'maroon', 'teal', 'turquoise', 'coral',
    'lavender', 'mint', 'mustard', 'indigo', 'magenta',
    'sage', 'rust', 'mauve', 'periwinkle', 'ochre'
  ],
  'Patterns & Materials': [
    'striped', 'plaid', 'checkered', 'patterned',
    'floral', 'solid', 'denim', 'leather', 'cotton',
    'wool', 'silk', 'linen', 'suede', 'velvet',
    'knit', 'woven', 'tweed', 'herringbone',
    'houndstooth', 'polka dot', 'paisley', 'geometric',
    'animal print', 'leopard', 'zebra', 'snake',
    'pinstripe', 'windowpane', 'gingham', 'argyle',
    'chevron', 'jacquard', 'brocade', 'seersucker',
    'mesh', 'lace', 'embroidered', 'quilted',
    'corduroy', 'cashmere', 'mohair', 'flannel',
    'chambray', 'canvas', 'nylon', 'polyester'
  ]
};

// Common incorrect classifications to filter out
const excludedTerms = [
  'crutch', 'plunger', 'broom', 'mop', 'tool', 'hammer',
  'vacuum', 'cleaner', 'stick', 'pole', 'handle'
];

// Enhanced prediction processing with spatial analysis
interface DetectedItem {
  category: string;
  bbox?: [number, number, number, number]; // Optional bounding box [x, y, width, height]
  source?: string; // Optional source of detection
  attributes?: {
    color?: string;
    pattern?: string;
    material?: string;
    style?: string;
    layering?: string;
    formalityLevel?: 'casual' | 'smart casual' | 'business casual' | 'business' | 'formal';
    formalityScore?: number;
  };
}

// Add specific clothing attributes detection
const clothingAttributes = {
  colors: {
    primary: ['white', 'black', 'blue', 'red', 'green', 'yellow', 'purple', 'pink', 'orange', 'brown', 'gray'],
    shades: ['light', 'dark', 'bright', 'pale', 'deep'],
    metallics: ['gold', 'silver', 'bronze', 'metallic'],
    neutrals: ['beige', 'khaki', 'tan', 'cream', 'ivory', 'navy']
  },
  patterns: {
    basic: ['solid', 'striped', 'plaid', 'checkered', 'dotted', 'floral'],
    complex: ['geometric', 'abstract', 'animal', 'paisley', 'herringbone', 'houndstooth'],
    textures: ['smooth', 'rough', 'knit', 'woven', 'quilted', 'embroidered']
  },
  materials: {
    natural: ['cotton', 'wool', 'silk', 'linen', 'leather', 'suede'],
    synthetic: ['polyester', 'nylon', 'spandex', 'rayon', 'velvet'],
    denim: ['denim', 'jean'],
    knits: ['jersey', 'rib knit', 'cable knit', 'cashmere']
  },
  styles: {
    formal: ['formal', 'business', 'professional', 'elegant', 'sophisticated'],
    casual: ['casual', 'relaxed', 'sporty', 'athletic', 'comfortable'],
    trendy: ['modern', 'contemporary', 'fashionable', 'stylish', 'chic'],
    classic: ['traditional', 'timeless', 'vintage', 'retro', 'preppy']
  }
};

// Enhanced layering analysis
const layeringOrder = {
  undergarments: 0,
  base: 1,
  mid: 2,
  outer: 3
};

const layeringCategories = {
  [layeringOrder.undergarments]: ['undershirt', 'camisole', 'tank top'],
  [layeringOrder.base]: ['t-shirt', 'shirt', 'blouse', 'polo', 'dress', 'top'],
  [layeringOrder.mid]: ['sweater', 'cardigan', 'vest', 'hoodie', 'sweatshirt'],
  [layeringOrder.outer]: ['jacket', 'coat', 'blazer', 'overcoat', 'raincoat']
};

// Enhanced color harmony rules
const colorHarmony = {
  complementary: {
    'red': ['green'],
    'blue': ['orange'],
    'yellow': ['purple'],
    'green': ['red', 'magenta'],
    'purple': ['yellow', 'chartreuse'],
    'orange': ['blue']
  },
  analogous: {
    'red': ['orange', 'purple'],
    'blue': ['green', 'purple'],
    'yellow': ['green', 'orange'],
    'green': ['blue', 'yellow'],
    'purple': ['red', 'blue'],
    'orange': ['red', 'yellow']
  },
  monochromatic: {
    'red': ['pink', 'burgundy', 'maroon'],
    'blue': ['navy', 'light blue', 'royal blue'],
    'green': ['olive', 'sage', 'emerald'],
    'purple': ['lavender', 'plum', 'mauve'],
    'brown': ['tan', 'beige', 'khaki'],
    'gray': ['charcoal', 'silver', 'slate']
  },
  neutral: ['black', 'white', 'gray', 'brown', 'navy', 'beige', 'cream', 'tan']
};

// Enhanced pattern mixing rules
const patternMixing = {
  scale: {
    'large': ['small', 'micro'],
    'medium': ['small', 'large'],
    'small': ['large', 'medium'],
    'micro': ['large', 'medium']
  },
  combinations: {
    'stripes': ['floral', 'polka dots', 'geometric'],
    'plaid': ['solid', 'stripes', 'geometric'],
    'floral': ['stripes', 'solid', 'polka dots'],
    'polka dots': ['stripes', 'floral', 'solid'],
    'geometric': ['solid', 'stripes', 'plaid'],
    'animal print': ['solid', 'geometric']
  },
  complexity: {
    high: ['animal print', 'floral', 'geometric'],
    medium: ['plaid', 'stripes', 'polka dots'],
    low: ['solid', 'pinstripe', 'simple geometric']
  }
};

// Enhanced material combination rules
const materialCombinations = {
  texture: {
    smooth: ['rough', 'textured', 'knit'],
    rough: ['smooth', 'silk', 'satin'],
    knit: ['woven', 'leather', 'denim'],
    woven: ['knit', 'leather', 'silk']
  },
  weight: {
    heavy: ['light', 'medium'],
    medium: ['light', 'heavy'],
    light: ['medium', 'heavy']
  },
  seasonal: {
    summer: ['linen', 'cotton', 'silk', 'chambray'],
    winter: ['wool', 'cashmere', 'velvet', 'leather'],
    transitional: ['cotton', 'denim', 'light wool', 'polyester']
  }
};

// Enhanced spatial analysis for layering
interface SpatialRelation {
  overlap: number; // 0-1, how much items overlap
  verticalPosition: number; // 0-1, normalized vertical position
  horizontalPosition: number; // 0-1, normalized horizontal position
  size: number; // relative size compared to other items
}

// Enhanced style recommendations based on occasions
const styleRecommendations = {
  formal: {
    essential: ['suit', 'dress shirt', 'dress', 'formal shoes'],
    recommended: ['blazer', 'tie', 'pocket square', 'formal watch'],
    optional: ['cufflinks', 'dress belt', 'formal scarf']
  },
  business: {
    essential: ['blazer', 'dress shirt', 'dress pants', 'formal shoes'],
    recommended: ['tie', 'belt', 'watch'],
    optional: ['pocket square', 'dress socks', 'briefcase']
  },
  casual: {
    essential: ['casual shirt', 'jeans', 'casual shoes'],
    recommended: ['jacket', 'belt', 'watch'],
    optional: ['scarf', 'casual accessories', 'hat']
  },
  smart_casual: {
    essential: ['blazer', 'casual shirt', 'chinos', 'dress shoes'],
    recommended: ['belt', 'watch', 'pocket square'],
    optional: ['tie', 'dress socks', 'casual scarf']
  }
};

interface StyleBreakdown {
  score: number;
  details: {
    styleConsistency: number;
    colorHarmony: number;
    formality: number;
    layering: number;
    proportions: number;
  };
  styleElements: {
    colors: string[];
    patterns: string[];
    materials: string[];
    styleTypes: string[];
    formalityLevel: string;
  };
  suggestions: string[];
}

const calculateStyleBreakdown = (items: DetectedItem[]): StyleBreakdown => {
  if (items.length === 0) {
    return {
      score: 0,
      details: {
        styleConsistency: 0,
        colorHarmony: 0,
        formality: 0,
        layering: 0,
        proportions: 0
      },
      styleElements: {
        colors: [],
        patterns: [],
        materials: [],
        styleTypes: [],
        formalityLevel: 'casual'
      },
      suggestions: []
    };
  }

  // Extract style elements
  const colors = items.map(item => item.attributes?.color).filter(Boolean);
  const patterns = items.map(item => item.attributes?.pattern).filter(Boolean);
  const materials = items.map(item => item.attributes?.material).filter(Boolean);
  const styleTypes = items.map(item => item.attributes?.style).filter(Boolean);

  // Calculate style consistency (30 points)
  const styleConsistency = calculateStyleConsistency(styleTypes);

  // Calculate color harmony (20 points)
  const colorHarmony = calculateColorHarmony(colors);

  // Calculate formality (20 points)
  const formality = calculateFormality(items);

  // Calculate layering complexity (15 points)
  const layering = calculateLayering(items);

  // Calculate proportions (15 points)
  const proportions = calculateProportions(items);

  // Generate suggestions
  const suggestions = generateSuggestions({
    items,
    styleConsistency,
    colorHarmony,
    formality,
    layering,
    proportions
  });

  const totalScore = Math.round(
    styleConsistency + colorHarmony + formality + layering + proportions
  );

  return {
    score: totalScore,
    details: {
      styleConsistency,
      colorHarmony,
      formality,
      layering,
      proportions
    },
    styleElements: {
      colors,
      patterns,
      materials,
      styleTypes,
      formalityLevel: determineFormalityLevel(formality)
    },
    suggestions
  };
};

const calculateStyleConsistency = (styleTypes: string[]): number => {
  if (styleTypes.length === 0) return 15;
  
  // Check if styles follow a cohesive theme
  const uniqueStyles = new Set(styleTypes);
  const consistency = 30 * (1 - (uniqueStyles.size - 1) / styleTypes.length);
  return Math.max(Math.min(consistency, 30), 0);
};

const calculateColorHarmony = (colors: string[]): number => {
  if (colors.length === 0) return 10;

  // Apply the 3-color principle
  const uniqueColors = new Set(colors);
  let score = 20;

  if (uniqueColors.size > 3) {
    score -= (uniqueColors.size - 3) * 5; // Deduct points for too many colors
  }

  // Check for complementary or analogous colors
  const hasComplementaryColors = checkComplementaryColors(Array.from(uniqueColors));
  if (hasComplementaryColors) score += 5;

  return Math.max(Math.min(score, 20), 0);
};

const calculateFormality = (items: DetectedItem[]): number => {
  let score = 10;
  const formalItems = items.filter(item => 
    item.attributes?.formalityLevel === 'formal' ||
    item.attributes?.formalityLevel === 'business'
  );

  score += (formalItems.length / items.length) * 10;

  // Check for formal materials
  const hasFormalMaterials = items.some(item =>
    ['silk', 'wool', 'leather', 'cashmere'].includes(item.attributes?.material || '')
  );
  if (hasFormalMaterials) score += 5;

  return Math.min(score, 20);
};

const calculateLayering = (items: DetectedItem[]): number => {
  if (items.length <= 1) return 5;
  
  let score = 15 * (items.length / 4); // Ideal layering is 3-4 pieces
  
  // Check for proper layering order
  const hasProperOrder = checkLayeringOrder(items);
  if (hasProperOrder) score += 5;

  return Math.min(score, 15);
};

const calculateProportions = (items: DetectedItem[]): number => {
  let score = 7.5;

  // Apply the Rule of Thirds
  const hasThirdsBalance = checkRuleOfThirds(items);
  if (hasThirdsBalance) score += 7.5;

  return Math.min(score, 15);
};

const generateSuggestions = ({
  items,
  styleConsistency,
  colorHarmony,
  formality,
  layering,
  proportions
}: {
  items: DetectedItem[];
  styleConsistency: number;
  colorHarmony: number;
  formality: number;
  layering: number;
  proportions: number;
}): string[] => {
  const suggestions: string[] = [];

  // Style Consistency Suggestions
  if (styleConsistency < 25) {
    suggestions.push(
      "Try to maintain a consistent style theme throughout your outfit. Mix pieces that share similar design elements."
    );
  }

  // Color Harmony Suggestions
  if (colorHarmony < 15) {
    suggestions.push(
      "Consider using the 3-color principle: Choose a dominant color, a secondary color, and an accent color. This creates visual harmony while maintaining interest."
    );
  }

  // Formality Suggestions
  if (formality < 15) {
    suggestions.push(
      "To increase formality, incorporate structured pieces and refined materials like wool, silk, or leather. Pay attention to fit and tailoring."
    );
  }

  // Layering Suggestions
  if (layering < 10) {
    suggestions.push(
      "Experiment with layering to add depth and interest. Start with light, fitted pieces and gradually add heavier or looser items. Consider adding a 'third piece' like a jacket or cardigan."
    );
  }

  // Proportion Suggestions
  if (proportions < 10) {
    suggestions.push(
      "Apply the Rule of Thirds to your outfit proportions. Try tucking in tops or using belts to create more balanced visual sections."
    );
  }

  // Add specific style improvement suggestions
  suggestions.push(...generateStyleImprovementTips(items));

  return suggestions;
};

const generateStyleImprovementTips = (items: DetectedItem[]): string[] => {
  const tips: string[] = [];
  
  // Check for accessorizing
  if (!items.some(item => item.category === 'accessory')) {
    tips.push(
      "Consider adding accessories to complete your look. A belt, jewelry, or scarf can tie the outfit together."
    );
  }

  // Check for shoe coordination
  if (!items.some(item => item.category === 'footwear')) {
    tips.push(
      "Don't forget about shoes! They're crucial for completing the outfit and maintaining proper proportions."
    );
  }

  // Add seasonal-appropriate suggestions
  const season = getCurrentSeason();
  tips.push(generateSeasonalTip(season, items));

  return tips;
};

const getCurrentSeason = (): string => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
};

const generateSeasonalTip = (season: string, items: DetectedItem[]): string => {
  switch (season) {
    case 'spring':
      return "For spring, consider incorporating lighter fabrics and fresh colors. Layer pieces that can be easily removed as temperatures change.";
    case 'summer':
      return "Choose breathable fabrics and light colors for summer. Consider adding sun-protective accessories like hats or lightweight scarves.";
    case 'fall':
      return "Fall is perfect for layering. Mix textures like knits with smoother fabrics, and incorporate rich autumn colors.";
    case 'winter':
      return "Focus on warm layers and cozy textures. Don't forget winter accessories like scarves and gloves that can add both warmth and style.";
    default:
      return "Consider how your outfit adapts to the current weather conditions.";
  }
};

const determineFormalityLevel = (formalityScore: number): 'formal' | 'business' | 'business casual' | 'smart casual' | 'casual' => {
  if (formalityScore >= 18) return 'formal';
  if (formalityScore >= 15) return 'business';
  if (formalityScore >= 12) return 'business casual';
  if (formalityScore >= 8) return 'smart casual';
  return 'casual';
};

export default function OutfitScorer() {
  const [models, setModels] = useState<ModelBundle>({
    mobileNet: null,
    objectDetector: null,
    faceDetector: null
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [modelLoadProgress, setModelLoadProgress] = useState<{[key: string]: boolean}>({
    mobileNet: false,
    objectDetector: false,
    faceDetector: false
  });

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        setModelLoadError(null);
        
        // Ensure TensorFlow.js is using WebGL backend
        await tf.ready();
        console.log('TensorFlow.js backend:', tf.getBackend());
        
        // Load models in parallel with progress tracking
        const loadModelWithProgress = async (
          modelLoader: Promise<any>,
          modelName: string
        ) => {
          try {
            const model = await modelLoader;
            setModelLoadProgress(prev => ({ ...prev, [modelName]: true }));
            return model;
          } catch (error) {
            console.error(`Failed to load ${modelName}:`, error);
            throw error;
          }
        };

        const [mobileNetModel, objectDetector, faceDetector] = await Promise.all([
          loadModelWithProgress(
            mobilenet.load({
              version: 2,
              alpha: 1.0
            }),
            'mobileNet'
          ),
          loadModelWithProgress(
            cocossd.load({
              base: 'lite_mobilenet_v2'
            }),
            'objectDetector'
          ),
          loadModelWithProgress(
            blazeface.load(),
            'faceDetector'
          )
        ]);
        
        setModels({
          mobileNet: mobileNetModel,
          objectDetector: objectDetector,
          faceDetector: faceDetector
        });
        console.log('All models loaded successfully');
      } catch (error) {
        console.error('Failed to load models:', error);
        setModelLoadError('Failed to load AI models. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    loadModels();
  }, []);

  const detectFashionItems = async (img: HTMLImageElement): Promise<DetectedItem[]> => {
    if (!models.mobileNet || !models.objectDetector || !models.faceDetector) {
      throw new Error('Models not loaded');
    }

    try {
      const tfImg = tf.browser.fromPixels(img);
      
      // Get predictions from all models
      const [mobileNetPredictions, objectDetections, faceDetections] = await Promise.all([
        models.mobileNet.classify(tfImg, 20),
        models.objectDetector.detect(img),
        models.faceDetector.estimateFaces(tfImg, false)
      ]);

      // Process and enhance predictions
      const combinedPredictions: DetectedItem[] = [];

      // Process MobileNet predictions
      mobileNetPredictions.forEach(pred => {
        const className = pred.className.toLowerCase();
        if (pred.probability > CONFIDENCE_THRESHOLD) {
          combinedPredictions.push({
            category: className,
            attributes: {
              color: detectColor(className),
              pattern: detectPattern(className),
              material: detectMaterial(className),
              style: detectStyle(className),
              layering: detectLayering(className),
              formalityLevel: calculateFormalityLevel(className),
              formalityScore: calculateFormalityScore(className)
            }
          });
        }
      });

      // Process COCO-SSD detections
      objectDetections.forEach(det => {
        const className = det.class.toLowerCase();
        if (det.score > CONFIDENCE_THRESHOLD) {
          combinedPredictions.push({
            category: className,
            attributes: {
              color: detectColor(className),
              pattern: detectPattern(className),
              material: detectMaterial(className),
              style: detectStyle(className),
              layering: detectLayering(className),
              formalityLevel: calculateFormalityLevel(className),
              formalityScore: calculateFormalityScore(className)
            }
          });
        }
      });

      // Process face detections to enhance context
      if (faceDetections.length > 0) {
        combinedPredictions.push({
          category: 'person',
          attributes: {
            style: 'personal',
            formalityLevel: 'casual', // Default to casual for person detection
            formalityScore: 0.5 // Neutral score for person detection
          }
        });
      }

      // Clean up tensor
      tfImg.dispose();

      // Enhanced post-processing with consensus scoring
      const processedPredictions = processDetectionsWithConsensus(combinedPredictions);
      console.log('Processed predictions with consensus:', processedPredictions);
      
      return processedPredictions;
    } catch (error) {
      console.error('Error in fashion detection:', error);
      return [];
    }
  };

  // New function for consensus-based prediction processing
  const processDetectionsWithConsensus = (predictions: DetectedItem[]): DetectedItem[] => {
    // Group predictions by item class
    const predictionsByClass = new Map<string, DetectedItem[]>();
    
    predictions.forEach(pred => {
      const key = pred.category;
      if (!predictionsByClass.has(key)) {
        predictionsByClass.set(key, []);
      }
      predictionsByClass.get(key)!.push(pred);
    });

    // Process each class group for consensus
    const consensusPredictions: DetectedItem[] = [];
    
    predictionsByClass.forEach((items, className) => {
      // Calculate consensus confidence
      const avgConfidence = items.reduce((sum, item) => sum + item.attributes?.formalityScore || 0, 0) / items.length;
      
      // Calculate consensus score based on model agreement
      const modelAgreement = new Set(items.map(item => item.source)).size;
      const consensusBoost = modelAgreement > 1 ? (modelAgreement / 3) * 0.2 : 0; // Up to 20% boost for full agreement
      
      // Merge attributes from all detections
      const mergedAttributes = {
        color: items.find(item => item.attributes?.color)?.attributes?.color,
        pattern: items.find(item => item.attributes?.pattern)?.attributes?.pattern,
        material: items.find(item => item.attributes?.material)?.attributes?.material,
        style: items.find(item => item.attributes?.style)?.attributes?.style,
        layering: items.find(item => item.attributes?.layering)?.attributes?.layering,
        formalityLevel: items.find(item => item.attributes?.formalityLevel)?.attributes?.formalityLevel,
        formalityScore: Math.max(...items.map(item => item.attributes?.formalityScore || 0))
      };

      // Create consensus item with boosted confidence
      consensusPredictions.push({
        category: className,
        attributes: mergedAttributes
      });
    });

    // Sort by consensus confidence and filter out low confidence detections
    return consensusPredictions
      .filter(item => item.attributes?.formalityScore > CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.attributes?.formalityScore - a.attributes?.formalityScore);
  };

  // Helper functions for attribute detection
  const detectColor = (text: string): string | undefined => {
    const allColors = [
      ...clothingAttributes.colors.primary,
      ...clothingAttributes.colors.metallics,
      ...clothingAttributes.colors.neutrals
    ];
    
    const found = allColors.find(color => text.includes(color));
    if (found) {
      const shade = clothingAttributes.colors.shades.find(s => text.includes(s));
      return shade ? `${shade} ${found}` : found;
    }
    return undefined;
  };

  const detectPattern = (text: string): string | undefined => {
    const allPatterns = [
      ...clothingAttributes.patterns.basic,
      ...clothingAttributes.patterns.complex,
      ...clothingAttributes.patterns.textures
    ];
    return allPatterns.find(pattern => text.includes(pattern));
  };

  const detectMaterial = (text: string): string | undefined => {
    const allMaterials = [
      ...clothingAttributes.materials.natural,
      ...clothingAttributes.materials.synthetic,
      ...clothingAttributes.materials.denim,
      ...clothingAttributes.materials.knits
    ];
    return allMaterials.find(material => text.includes(material));
  };

  const detectStyle = (text: string): string | undefined => {
    const allStyles = [
      ...clothingAttributes.styles.formal,
      ...clothingAttributes.styles.casual,
      ...clothingAttributes.styles.trendy,
      ...clothingAttributes.styles.classic
    ];
    return allStyles.find(style => text.includes(style));
  };

  const detectLayering = (className: string): string => {
    const baseLayer = ['t-shirt', 'tank top', 'shirt', 'blouse'];
    const midLayer = ['sweater', 'cardigan', 'vest'];
    const outerLayer = ['jacket', 'coat', 'blazer'];
    
    const lowerClassName = className.toLowerCase();
    
    if (outerLayer.some(item => lowerClassName.includes(item))) return 'outer';
    if (midLayer.some(item => lowerClassName.includes(item))) return 'mid';
    if (baseLayer.some(item => lowerClassName.includes(item))) return 'base';
    return 'base'; // Default to base layer if unknown
  };

  // Helper function to calculate formality score
  const calculateFormalityScore = (className: string): number => {
    const formalItems = ['suit', 'blazer', 'dress shirt', 'slacks', 'dress', 'formal shoes'];
    const businessItems = ['button-up', 'khakis', 'loafers', 'pencil skirt'];
    const businessCasualItems = ['polo', 'chinos', 'cardigan', 'blouse'];
    const smartCasualItems = ['sweater', 'jeans', 'sneakers', 'casual dress'];
    
    const lowerClassName = className.toLowerCase();
    
    if (formalItems.some(item => lowerClassName.includes(item))) return 0.8 + (Math.random() * 0.2); // High formality (0.8-1.0)
    if (businessItems.some(item => lowerClassName.includes(item))) return 0.5 + (Math.random() * 0.3); // Medium formality (0.5-0.8)
    if (businessCasualItems.some(item => lowerClassName.includes(item))) return 0.4 + (Math.random() * 0.4); // Low formality (0.4-0.8)
    if (smartCasualItems.some(item => lowerClassName.includes(item))) return 0.3 + (Math.random() * 0.5); // Low formality (0.3-0.8)
    return 0.2 + (Math.random() * 0.6); // Very low formality (0.2-0.8)
  };

  // Enhanced feedback generation
  const generateDetailedFeedback = (detectedItems: DetectedItem[]): string[] => {
    const feedback = [];
    
    // Get all attributes
    const colors = detectedItems
      .map(item => item.attributes?.color)
      .filter((color): color is string => !!color);
    
    const patterns = detectedItems
      .map(item => item.attributes?.pattern)
      .filter((pattern): pattern is string => !!pattern);
    
    const materials = detectedItems
      .map(item => item.attributes?.material)
      .filter((material): material is string => !!material);
    
    // Analyze spatial relations
    const spatialRelations = analyzeSpatialRelations(detectedItems);
    
    // Get detailed analysis
    const colorAnalysis = analyzeColorHarmony(colors);
    const patternAnalysis = analyzePatternMixing(patterns);
    const materialAnalysis = analyzeMaterialCombinations(materials);
    
    // Add all feedback
    feedback.push(...colorAnalysis.feedback);
    feedback.push(...patternAnalysis.feedback);
    feedback.push(...materialAnalysis.feedback);
    
    // Add layering feedback based on spatial analysis
    const layeredItems = Array.from(spatialRelations.entries())
      .sort((a, b) => b[1].verticalPosition - a[1].verticalPosition);
    
    if (layeredItems.length >= 3) {
      feedback.push("Excellent use of layering with proper proportions and placement.");
    } else if (layeredItems.length === 2) {
      feedback.push("Good start with layering. Consider adding one more layer for more depth.");
    }
    
    // Add style recommendations
    const styles = new Set(detectedItems
      .map(item => item.attributes?.style)
      .filter((style): style is string => !!style));
    
    const primaryStyle = Array.from(styles)[0] || 'casual';
    const recommendations = styleRecommendations[primaryStyle];
    
    if (recommendations) {
      const missing = recommendations.essential.filter(item =>
        !detectedItems.some(detected => detected.category.includes(item))
      );
      
      if (missing.length > 0) {
        feedback.push(`Consider adding these essential items for a complete ${primaryStyle} look: ${missing.join(', ')}`);
      }
    }
    
    return feedback;
  };

  // Add to the existing detectFashionItems function
  const analyzeSpatialRelations = (items: DetectedItem[]): Map<string, SpatialRelation> => {
    const relations = new Map<string, SpatialRelation>();
    const itemsWithBBox = items.filter(item => item.bbox);
    
    itemsWithBBox.forEach(item => {
      const [x, y, width, height] = item.bbox!;
      const totalArea = width * height;
      const centerX = x + width/2;
      const centerY = y + height/2;
      
      // Calculate overlaps with other items
      const overlaps = itemsWithBBox
        .filter(other => other !== item)
        .map(other => {
          const [ox, oy, owidth, oheight] = other.bbox!;
          const xOverlap = Math.max(0, Math.min(x + width, ox + owidth) - Math.max(x, ox));
          const yOverlap = Math.max(0, Math.min(y + height, oy + oheight) - Math.max(y, oy));
          return (xOverlap * yOverlap) / totalArea;
        });
      
      relations.set(item.category, {
        overlap: Math.max(0, ...overlaps),
        verticalPosition: centerY / (y + height),
        horizontalPosition: centerX / (x + width),
        size: totalArea
      });
    });
    
    return relations;
  };

  // Enhanced color analysis
  const analyzeColorHarmony = (colors: string[]): {
    score: number;
    feedback: string[];
  } => {
    const feedback = [];
    let score = 0;
    
    // Check for color scheme types
    const uniqueColors = new Set(colors);
    
    // Check complementary colors
    const hasComplementary = colors.some(color => 
      colorHarmony.complementary[color]?.some(comp => uniqueColors.has(comp))
    );
    
    // Check analogous colors
    const hasAnalogous = colors.some(color =>
      colorHarmony.analogous[color]?.some(ana => uniqueColors.has(ana))
    );
    
    // Check monochromatic scheme
    const hasMonochromatic = colors.some(color =>
      colorHarmony.monochromatic[color]?.some(mono => uniqueColors.has(mono))
    );
    
    // Check neutral balance
    const neutralCount = colors.filter(color => 
      colorHarmony.neutral.includes(color)
    ).length;
    
    if (hasComplementary) {
      score += 15;
      feedback.push("Great use of complementary colors for visual impact!");
    }
    
    if (hasAnalogous) {
      score += 12;
      feedback.push("Nice harmonious color scheme with analogous colors.");
    }
    
    if (hasMonochromatic) {
      score += 10;
      feedback.push("Sophisticated use of monochromatic color variations.");
    }
    
    if (neutralCount > 0) {
      score += 8;
      feedback.push("Good balance with neutral colors.");
    }
    
    return { score: Math.min(25, score), feedback };
  };

  // Enhanced pattern analysis
  const analyzePatternMixing = (patterns: string[]): {
    score: number;
    feedback: string[];
  } => {
    const feedback = [];
    let score = 0;
    
    // Check pattern complexity balance
    const complexityLevels = patterns.map(pattern => {
      if (patternMixing.complexity.high.includes(pattern)) return 'high';
      if (patternMixing.complexity.medium.includes(pattern)) return 'medium';
      return 'low';
    });
    
    const hasGoodComplexityBalance = new Set(complexityLevels).size >= 2;
    
    // Check pattern combinations
    const hasGoodCombination = patterns.some(pattern =>
      patternMixing.combinations[pattern]?.some(comp => patterns.includes(comp))
    );
    
    if (hasGoodComplexityBalance) {
      score += 12;
      feedback.push("Excellent balance of pattern complexities.");
    }
    
    if (hasGoodCombination) {
      score += 13;
      feedback.push("Well-coordinated pattern combinations.");
    }
    
    return { score: Math.min(25, score), feedback };
  };

  // Enhanced material analysis
  const analyzeMaterialCombinations = (materials: string[]): {
    score: number;
    feedback: string[];
  } => {
    const feedback = [];
    let score = 0;
    
    // Check texture combinations
    const hasGoodTextureMix = materials.some(material =>
      materialCombinations.texture[material]?.some(tex => materials.includes(tex))
    );
    
    // Check weight balance
    const weights = materials.map(material => {
      if (material.includes('heavy') || material.includes('wool')) return 'heavy';
      if (material.includes('light') || material.includes('silk')) return 'light';
      return 'medium';
    });
    
    const hasGoodWeightBalance = new Set(weights).size >= 2;
    
    // Check seasonal appropriateness
    const season = new Date().getMonth() >= 3 && new Date().getMonth() <= 8 ? 'summer' : 'winter';
    const hasSeasonalMaterials = materials.some(material =>
      materialCombinations.seasonal[season]?.includes(material)
    );
    
    if (hasGoodTextureMix) {
      score += 10;
      feedback.push("Great mix of textures in your outfit.");
    }
    
    if (hasGoodWeightBalance) {
      score += 8;
      feedback.push("Good balance of material weights.");
    }
    
    if (hasSeasonalMaterials) {
      score += 7;
      feedback.push("Appropriate material choices for the season.");
    }
    
    return { score: Math.min(25, score), feedback };
  };

  const categorizeStyle = (predictions: any[]) => {
    console.log('Starting categorization with predictions:', predictions);
    const detectedCategories = new Map<string, number>();
    
    // Detect style based on predictions
    let genderConfidence = {
      masculine: 0,
      feminine: 0
    };

    const validPredictions = predictions.filter(pred => {
      const isExcluded = excludedTerms.some(term => 
        pred.category.toLowerCase().includes(term.toLowerCase())
      );
      return !isExcluded && pred.attributes?.formalityScore > 0.05;
    });
    
    // Process style elements
    validPredictions.forEach(pred => {
      const className = pred.category.toLowerCase();
      const probability = pred.attributes?.formalityScore * 100;

      // Check for style indicators
      if (styleCategories.masculine.clothing.some(item => 
        className.includes(item.toLowerCase())
      )) {
        genderConfidence.masculine += probability;
      }

      if (styleCategories.feminine.clothing.some(item => 
        className.includes(item.toLowerCase())
      )) {
        genderConfidence.feminine += probability;
      }

      // Check against fashion categories
      Object.entries(fashionCategories).forEach(([category, items]) => {
        if (items.some(item => className.includes(item.toLowerCase()))) {
          // Convert to neutral term if available
          const neutralTerm = Object.entries(neutralTerms).find(([specific]) => 
            className.includes(specific.toLowerCase())
          );
          
          let finalCategory;
          if (neutralTerm) {
            finalCategory = `${category} - ${neutralTerm[1].charAt(0).toUpperCase() + neutralTerm[1].slice(1)}`;
          } else {
            // Find the matching item from the category for a more specific label
            const matchingItem = items.find(item => 
              className.includes(item.toLowerCase())
            );
            finalCategory = matchingItem 
              ? `${category} - ${matchingItem.charAt(0).toUpperCase() + matchingItem.slice(1)}`
              : category;
          }
          
          detectedCategories.set(finalCategory, Math.max(detectedCategories.get(finalCategory) || 0, probability));
        }
      });
    });

    const detectedGender = (genderConfidence.masculine > genderConfidence.feminine ? 'masculine' : 'feminine') as 'masculine' | 'feminine';
    console.log('Detected style type:', detectedGender, 'Confidence:', genderConfidence);

    let results = Array.from(detectedCategories.entries())
      .map(([category, confidence]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        confidence: Math.round(Math.min(100, confidence))
      }))
      .sort((a, b) => b.confidence - a.confidence);

    // Log the detected categories for debugging
    console.log('Detected categories:', results);

    return {
      results,
      detectedGender
    };
  };

  // Helper function for fuzzy matching
  const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  // Update the getStyleFeedback function to use the new detailed feedback
  const getStyleFeedback = (styleElements: { category: string; confidence: number }[], detectedGender: 'masculine' | 'feminine') => {
    const strengths = [];
    const improvements = [];

    // Convert style elements to DetectedItems for detailed feedback
    const detectedItems: DetectedItem[] = styleElements.map(element => ({
      category: element.category.toLowerCase(),
      attributes: {
        color: detectColor(element.category),
        pattern: detectPattern(element.category),
        material: detectMaterial(element.category),
        style: detectStyle(element.category),
        layering: detectLayering(element.category),
        formalityLevel: calculateFormalityLevel(element.category)
      }
    }));

    // Add detailed feedback
    const detailedFeedback = generateDetailedFeedback(detectedItems);
    strengths.push(...detailedFeedback);

    // Initialize scoring components
    const scoreComponents = {
      baseScore: 30,
      itemVariety: 3,
      colorCoordination: 3,
      layering: 3,
      accessories: 3,
      coherence: 3,
      patternScore: 0,
      formalityScore: 0,
      essentialsScore: 5,
      styleScore: 0,  // Renamed from genderSpecificScore
    };

    // Track detected categories
    const detectedCategories = {
      tops: styleElements.filter(e => 
        e.category.toLowerCase().includes('shirt') || 
        e.category.toLowerCase().includes('blouse') || 
        e.category.toLowerCase().includes('top')
      ),
      bottoms: styleElements.filter(e => 
        e.category.toLowerCase().includes('pants') || 
        e.category.toLowerCase().includes('skirt') || 
        e.category.toLowerCase().includes('trousers')
      ),
      formalWear: styleElements.filter(e => 
        e.category.toLowerCase().includes('suit') || 
        e.category.toLowerCase().includes('dress') || 
        e.category.toLowerCase().includes('formal') ||
        e.category.toLowerCase().includes('tuxedo') ||
        e.category.toLowerCase().includes('gown')
      ),
      accessories: styleElements.filter(e => 
        e.category.toLowerCase().includes('watch') ||
        e.category.toLowerCase().includes('jewelry') ||
        e.category.toLowerCase().includes('tie') ||
        e.category.toLowerCase().includes('scarf') ||
        e.category.toLowerCase().includes('belt') ||
        e.category.toLowerCase().includes('handbag') ||
        e.category.toLowerCase().includes('purse')
      ),
      outerwear: styleElements.filter(e => 
        e.category.toLowerCase().includes('jacket') || 
        e.category.toLowerCase().includes('coat') ||
        e.category.toLowerCase().includes('blazer')
      ),
      footwear: styleElements.filter(e => 
        e.category.toLowerCase().includes('shoes') ||
        e.category.toLowerCase().includes('boots') ||
        e.category.toLowerCase().includes('heels') ||
        e.category.toLowerCase().includes('flats')
      ),
      colors: styleElements.filter(e => e.category === 'Colors'),
      patterns: styleElements.filter(e => e.category === 'Patterns & Materials'),
      detectedClothing: styleElements.filter(e => !e.category.includes('Gender-Specific')),
    };

    // Calculate style-specific score (up to 15 points)
    const styleItems = {
      clothing: detectedCategories.detectedClothing.length * 3,
      formal: detectedCategories.formalWear.length * 4,
      accessories: detectedCategories.accessories.length * 2
    };

    scoreComponents.styleScore = Math.min(15, 
      styleItems.clothing + 
      styleItems.formal + 
      styleItems.accessories
    );

    // Calculate Item Variety score (up to 15 points)
    const uniqueCategories = new Set(styleElements.map(e => e.category));
    scoreComponents.itemVariety = Math.min(15, 3 + uniqueCategories.size * 2);
    
    if (uniqueCategories.size >= 4) {
      strengths.push("Good variety of clothing elements");
    } else if (uniqueCategories.size < 3) {
      improvements.push("Consider adding more variety to your outfit");
    }

    // Calculate Color Coordination score (up to 10 points)
    if (detectedCategories.colors.length > 0) {
      scoreComponents.colorCoordination = Math.min(10, 3 + detectedCategories.colors.length * 2);
      if (detectedCategories.colors.length >= 2) {
        strengths.push("Nice color coordination");
      }
    } else {
      improvements.push("Consider incorporating more distinct colors");
    }

    // Calculate Layering score (up to 10 points)
    if (detectedCategories.outerwear.length > 0) {
      scoreComponents.layering = Math.min(10, 3 + detectedCategories.outerwear.length * 3);
      strengths.push("Effective use of layering");
    } else if (styleElements.length > 2) {
      improvements.push("Consider adding a jacket or outer layer");
    }

    // Calculate Accessories score (up to 10 points)
    const accessoryCount = detectedCategories.accessories.length;
    scoreComponents.accessories = Math.min(10, 3 + accessoryCount * 2);
    if (accessoryCount > 2) {
      strengths.push("Well-accessorized outfit");
    } else if (accessoryCount === 0) {
      improvements.push("Consider adding accessories to complete the look");
    }

    // Calculate Pattern Score (up to 10 points)
    const patternCount = detectedCategories.patterns.length;
    scoreComponents.patternScore = Math.min(10, patternCount * 3);
    if (patternCount > 0) {
      strengths.push("Good use of patterns and textures");
    }

    // Calculate Formality Score (up to 10 points)
    const formalElements = detectedCategories.formalWear.length;
    const formalAccessories = detectedCategories.accessories.filter(a => 
      a.category.toLowerCase().includes('tie') || 
      a.category.toLowerCase().includes('pocket square') ||
      a.category.toLowerCase().includes('clutch') ||
      a.category.toLowerCase().includes('formal')
    ).length;

    scoreComponents.formalityScore = Math.min(10, (formalElements * 3) + (formalAccessories * 2));

    // Calculate Essentials Score (up to 10 points)
    const hasTop = detectedCategories.tops.length > 0;
    const hasBottom = detectedCategories.bottoms.length > 0;
    const hasFootwear = detectedCategories.footwear.length > 0;

    if (hasTop) scoreComponents.essentialsScore += 2;
    if (hasBottom) scoreComponents.essentialsScore += 2;
    if (hasFootwear) scoreComponents.essentialsScore += 1;

    // Calculate Style Coherence (up to 15 points)
    const hasBasicEssentials = hasTop || hasBottom;
    const hasFormalElements = detectedCategories.formalWear.length > 0;
    
    if (hasFormalElements && hasBasicEssentials) {
      scoreComponents.coherence = 15;
    } else if (hasFormalElements || (hasTop && hasBottom)) {
      scoreComponents.coherence = 10;
    } else if (hasBasicEssentials) {
      scoreComponents.coherence = 5;
    }

    // Calculate final score with weighted components
    const totalScore = Object.values(scoreComponents).reduce((sum, score) => sum + score, 0);
    const finalScore = Math.min(100, Math.max(1, totalScore));

    // Generate feedback based on scores
    let feedbackMessage = "";
    if (finalScore >= 80) {
      feedbackMessage = "Excellent outfit! Your style choices work very well together, showing great attention to detail and coordination.";
    } else if (finalScore >= 60) {
      feedbackMessage = "Good foundation! With a few tweaks to enhance coordination and completeness, this outfit could be even better.";
    } else {
      feedbackMessage = "This outfit has potential for improvement. Consider adding more elements and focusing on coordination.";
    }

    // Add specific feedback based on score components
    if (scoreComponents.itemVariety >= 12) {
      strengths.push("Excellent mix of clothing elements");
    }
    if (scoreComponents.colorCoordination >= 8) {
      strengths.push("Strong color harmony in the outfit");
    }
    if (scoreComponents.layering >= 8) {
      strengths.push("Sophisticated use of layers");
    }
    if (scoreComponents.patternScore >= 6) {
      strengths.push("Creative use of patterns and textures");
    }
    if (scoreComponents.formalityScore >= 8) {
      strengths.push("Well-executed formal style");
    }
    if (scoreComponents.styleScore >= 12) {
      strengths.push("Excellent coordination of style elements");
    }

    return {
      score: finalScore,
      detectedItems,
      feedback: [feedbackMessage],
      styleElements
    };
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    try {
      setLoading(true);
      const file = acceptedFiles[0];
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl);

      const img = new Image();
      img.src = imageUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const detectedItems = await detectFashionItems(img);
      
      // Calculate overall score based on multiple factors
      const score = calculateOverallScore(detectedItems);
      const feedback = generateFeedback(detectedItems, score);
      const styleElements = extractStyleElements(detectedItems);

      setResult({
        score,
        detectedItems,
        feedback,
        styleElements
      });
    } catch (error) {
      console.error('Error processing image:', error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [models]);

  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    multiple: false,
    onDragEnter: () => {},
    onDragOver: () => {},
    onDragLeave: () => {}
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {modelLoadError ? (
        <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
          <p className="text-red-600">{modelLoadError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ease-in-out
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 scale-102' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                <p className="text-gray-600">Loading AI models...</p>
                <div className="w-full max-w-xs space-y-2">
                  {Object.entries(modelLoadProgress).map(([model, loaded]) => (
                    <div key={model} className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${loaded ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm text-gray-600">{model}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : !models.mobileNet || !models.objectDetector || !models.faceDetector ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                <p className="text-gray-600">Initializing models...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <button 
                    type="button"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 ease-in-out"
                    onClick={(e) => e.preventDefault()}
                  >
                    Choose Image
                  </button>
                </div>
                <p className="text-gray-500">or drag and drop your outfit photo here</p>
                <p className="text-sm text-gray-400">Supports JPEG, JPG, PNG</p>
              </>
            )}
          </div>
        </div>
      )}

      {imageUrl && (
        <div className="mt-8">
          <img
            src={imageUrl}
            alt="Uploaded outfit"
            className="max-w-full h-auto rounded-xl shadow-lg mx-auto"
          />
        </div>
      )}

      {loading && imageUrl && (
        <div className="mt-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">Analyzing your outfit...</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Style Score</h3>
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold text-blue-600">{result.score}</span>
                <span className="text-xl text-gray-400">/100</span>
              </div>
            </div>
            <p className="text-lg text-gray-700 mb-6">{result.feedback[0]}</p>

            {/* Score Breakdown */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Score Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700">Item Variety</div>
                  <div className="text-sm text-gray-500">{result.styleElements.length} items</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700">Color Coordination</div>
                  <div className="text-sm text-gray-500">{result.styleElements.length} colors</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700">Layering</div>
                  <div className="text-sm text-gray-500">{result.styleElements.length} layers</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {result.styleElements.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-green-600">Detected Style Elements</h4>
                  <ul className="space-y-2">
                    {result.styleElements.map((element, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <span className="text-green-500 mr-2">✓</span>
                        {element}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Calculate overall score using consensus predictions
const calculateOverallScore = (items: DetectedItem[]): number => {
  if (items.length === 0) return 0;

  const weights = {
    styleConsistency: 0.3,    // 30 points max
    colorHarmony: 0.2,        // 20 points max
    formality: 0.2,           // 20 points max
    layering: 0.15,           // 15 points max
    confidence: 0.15          // 15 points max
  };

  // Style consistency score (30 points max)
  const styles = items.map(item => item.attributes?.style).filter(Boolean);
  const styleConsistency = styles.length > 1 
    ? (new Set(styles).size / styles.length) * 30
    : 15;

  // Color harmony score (20 points max)
  const colors = items.map(item => item.attributes?.color).filter(Boolean);
  const colorHarmony = colors.length > 1 
    ? (new Set(colors).size / colors.length) * 20
    : 10;

  // Average formality score (20 points max)
  const formalityScores = items.map(item => item.attributes?.formalityScore || 0.5);
  const avgFormality = (formalityScores.reduce((a, b) => a + b, 0) / formalityScores.length) * 20;

  // Layering score (15 points max)
  const layeringScores = items.map(item => item.attributes?.layering || 1);
  const uniqueLayers = new Set(layeringScores).size;
  const layeringScore = Math.min(15, uniqueLayers * 5);

  // Confidence score (15 points max)
  const avgConfidence = (items.reduce((sum, item) => sum + item.attributes?.formalityScore || 0, 0) / items.length) * 15;

  // Calculate total score
  const totalScore = Math.round(
    styleConsistency +
    colorHarmony +
    avgFormality +
    layeringScore +
    avgConfidence
  );

  // Ensure score is between 1 and 100
  return Math.max(1, Math.min(100, totalScore));
};

// Generate feedback based on detected items and score
const generateFeedback = (items: DetectedItem[], score: number): string[] => {
  const feedback: string[] = [];

  // Overall score feedback
  if (score >= 80) {
    feedback.push('Excellent outfit! Your style choices show great attention to detail and coordination.');
  } else if (score >= 60) {
    feedback.push('Good outfit with room for some refinements to elevate it further.');
  } else if (score >= 40) {
    feedback.push('This outfit has potential but could use some improvements in coordination and styling.');
  } else {
    feedback.push('Consider revising this outfit to better align with style principles.');
  }

  // Analyze specific aspects
  const styles = new Set(items.map(item => item.attributes?.style).filter(Boolean));
  const colors = new Set(items.map(item => item.attributes?.color).filter(Boolean));
  const patterns = new Set(items.map(item => item.attributes?.pattern).filter(Boolean));
  const materials = new Set(items.map(item => item.attributes?.material).filter(Boolean));
  const layers = new Set(items.map(item => item.attributes?.layering).filter(Boolean));

  // Style consistency feedback
  if (styles.size > 2) {
    feedback.push('Consider focusing on fewer style elements for a more cohesive look.');
  } else if (styles.size === 2) {
    feedback.push('Good style mixing. The combination works well together.');
  }

  // Color harmony feedback
  if (colors.size > 3) {
    feedback.push('Try limiting your color palette to create a more focused look.');
  } else if (colors.size === 2 || colors.size === 3) {
    feedback.push('Excellent color coordination that creates visual interest.');
  }

  // Pattern and material feedback
  if (patterns.size > 0) {
    feedback.push(`Nice use of ${Array.from(patterns).join(' and ')} patterns.`);
  }
  if (materials.size > 0) {
    feedback.push(`Good choice of materials: ${Array.from(materials).join(', ')}.`);
  }

  // Layering feedback
  if (layers.size > 2) {
    feedback.push('Sophisticated use of layering that adds depth to your outfit.');
  } else if (layers.size === 2) {
    feedback.push('Good start with layering. Consider adding one more layer for more visual interest.');
  }

  // Add specific style suggestions
  const suggestions = getStyleSuggestions(items);
  if (suggestions.length > 0) {
    feedback.push('Suggestions for improvement:');
    feedback.push(...suggestions);
  }

  return feedback;
};

const getStyleSuggestions = (items: DetectedItem[]): string[] => {
  const suggestions: string[] = [];
  const detectedTypes = new Set(items.map(item => item.category.toLowerCase()));

  // Check for essential items
  if (!hasAnyOf(detectedTypes, ['shirt', 'blouse', 'top', 't-shirt'])) {
    suggestions.push('- Consider adding a top layer garment');
  }
  if (!hasAnyOf(detectedTypes, ['pants', 'trousers', 'skirt', 'dress'])) {
    suggestions.push('- Add a bottom piece to complete the outfit');
  }
  if (!hasAnyOf(detectedTypes, ['shoes', 'boots', 'sneakers', 'heels'])) {
    suggestions.push('- Don\'t forget to include footwear');
  }

  // Check for accessories
  if (!hasAnyOf(detectedTypes, ['belt', 'watch', 'jewelry', 'necklace', 'bracelet'])) {
    suggestions.push('- Add some accessories to enhance the look');
  }

  // Check for layering
  if (!hasAnyOf(detectedTypes, ['jacket', 'blazer', 'cardigan', 'coat'])) {
    suggestions.push('- Consider adding an outer layer for more depth');
  }

  return suggestions;
};

const hasAnyOf = (detectedTypes: Set<string>, items: string[]): boolean => {
  return items.some(item => Array.from(detectedTypes).some(type => type.includes(item)));
};

// Extract style elements from detected items
const extractStyleElements = (items: DetectedItem[]): string[] => {
  const elements = new Set<string>();
  const categories = new Map<string, Set<string>>();

  // Initialize categories
  ['Clothing', 'Colors', 'Patterns', 'Materials', 'Style', 'Formality'].forEach(cat => {
    categories.set(cat, new Set<string>());
  });

  items.forEach(item => {
    const attrs = item.attributes || {};
    
    // Add clothing item
    if (item.category) {
      categories.get('Clothing')?.add(
        item.category.charAt(0).toUpperCase() + item.category.slice(1)
      );
    }

    // Add color
    if (attrs.color) {
      categories.get('Colors')?.add(
        attrs.color.charAt(0).toUpperCase() + attrs.color.slice(1)
      );
    }

    // Add pattern
    if (attrs.pattern) {
      categories.get('Patterns')?.add(
        attrs.pattern.charAt(0).toUpperCase() + attrs.pattern.slice(1)
      );
    }

    // Add material
    if (attrs.material) {
      categories.get('Materials')?.add(
        attrs.material.charAt(0).toUpperCase() + attrs.material.slice(1)
      );
    }

    // Add style
    if (attrs.style) {
      categories.get('Style')?.add(
        attrs.style.charAt(0).toUpperCase() + attrs.style.slice(1)
      );
    }

    // Add formality level
    if (attrs.formalityLevel) {
      const formalityLevel = attrs.formalityLevel === 'formal' ? 'Formal' :
                           attrs.formalityLevel === 'business' ? 'Business' :
                           attrs.formalityLevel === 'smart casual' ? 'Smart Casual' :
                           attrs.formalityLevel === 'business casual' ? 'Business Casual' : 'Casual';
      categories.get('Formality')?.add(formalityLevel);
    }
  });

  // Convert categories to formatted strings
  categories.forEach((values, category) => {
    if (values.size > 0) {
      elements.add(`${category}: ${Array.from(values).join(', ')}`);
    }
  });

  return Array.from(elements);
};

const calculateFormalityLevel = (className: string): 'formal' | 'business' | 'business casual' | 'smart casual' | 'casual' => {
  const formalItems = ['suit', 'blazer', 'dress shirt', 'slacks', 'dress', 'formal shoes'];
  const businessItems = ['button-up', 'khakis', 'loafers', 'pencil skirt'];
  const businessCasualItems = ['polo', 'chinos', 'cardigan', 'blouse'];
  const smartCasualItems = ['sweater', 'jeans', 'sneakers', 'casual dress'];
  
  const lowerClassName = className.toLowerCase();
  
  if (formalItems.some(item => lowerClassName.includes(item))) return 'formal';
  if (businessItems.some(item => lowerClassName.includes(item))) return 'business';
  if (businessCasualItems.some(item => lowerClassName.includes(item))) return 'business casual';
  if (smartCasualItems.some(item => lowerClassName.includes(item))) return 'smart casual';
  return 'casual';
};

const checkComplementaryColors = (colors: string[]): boolean => {
  const complementaryPairs = [
    ['red', 'green'],
    ['blue', 'orange'],
    ['yellow', 'purple'],
    ['black', 'white']
  ];

  for (const [color1, color2] of complementaryPairs) {
    if (colors.includes(color1) && colors.includes(color2)) {
      return true;
    }
  }
  return false;
};

const checkLayeringOrder = (items: DetectedItem[]): boolean => {
  // Ideal layering order: fitted base layer -> mid layer -> outer layer
  const layeringOrder = ['base', 'mid', 'outer'];
  const itemLayers = items.map(item => item.attributes?.layering || '').filter(Boolean);
  
  let currentLayerIndex = 0;
  for (const layer of itemLayers) {
    const layerIndex = layeringOrder.indexOf(layer);
    if (layerIndex < currentLayerIndex) {
      return false;
    }
    currentLayerIndex = layerIndex;
  }
  return true;
};

const checkRuleOfThirds = (items: DetectedItem[]): boolean => {
  // Check if the outfit follows the rule of thirds in terms of proportions
  const topItems = items.filter(item => item.category === 'top').length;
  const bottomItems = items.filter(item => item.category === 'bottom').length;
  const layeringItems = items.filter(item => 
    item.category === 'outerwear' || 
    item.category === 'jacket' || 
    item.category === 'cardigan'
  ).length;

  // Ideal proportions would be either 1:2 or 2:1 ratio
  return (topItems === 1 && bottomItems === 2) || 
         (topItems === 2 && bottomItems === 1) ||
         (layeringItems > 0); // Layering pieces can help achieve the rule of thirds
};

// Export utility functions for testing
export {
  calculateOverallScore,
  calculateStyleConsistency,
  calculateColorHarmony,
  calculateFormality,
  checkComplementaryColors,
  checkLayeringOrder,
  checkRuleOfThirds,
  determineFormalityLevel
};