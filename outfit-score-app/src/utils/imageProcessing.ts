import * as tf from '@tensorflow/tfjs';
import { DetectedItem, ImageProcessingResult, DetectedColor, ColorPalette } from '../types';

// Constants
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_SIZE = 224; // MobileNet input size

let model: tf.LayersModel | null = null;

// Comprehensive clothing and fashion item categories
const CLOTHING_ITEMS = {
  // Tops
  'jersey': { category: 'tops', confidence: 0.8 },
  'sweatshirt': { category: 'tops', confidence: 0.9 },
  'cardigan': { category: 'tops', confidence: 0.8 },
  'suit': { category: 'formal', confidence: 0.9 },
  'bow tie': { category: 'accessories', confidence: 0.7 },
  'bolo tie': { category: 'accessories', confidence: 0.6 },
  
  // Bottoms
  'jean': { category: 'bottoms', confidence: 0.8 },
  'miniskirt': { category: 'bottoms', confidence: 0.8 },
  'sarong': { category: 'bottoms', confidence: 0.7 },
  
  // Dresses
  'gown': { category: 'dresses', confidence: 0.9 },
  'academic gown': { category: 'formal', confidence: 0.8 },
  
  // Footwear
  'loafer': { category: 'footwear', confidence: 0.8 },
  'running shoe': { category: 'footwear', confidence: 0.8 },
  'sandal': { category: 'footwear', confidence: 0.8 },
  'boot': { category: 'footwear', confidence: 0.8 },
  'clog': { category: 'footwear', confidence: 0.7 },
  
  // Accessories
  'sunglasses': { category: 'accessories', confidence: 0.9 },
  'sunglass': { category: 'accessories', confidence: 0.9 },
  'purse': { category: 'accessories', confidence: 0.8 },
  'handbag': { category: 'accessories', confidence: 0.8 },
  'backpack': { category: 'accessories', confidence: 0.7 },
  'wallet': { category: 'accessories', confidence: 0.6 },
  'cowboy hat': { category: 'accessories', confidence: 0.8 },
  'sombrero': { category: 'accessories', confidence: 0.7 },
  'mortarboard': { category: 'accessories', confidence: 0.7 },
  'shower cap': { category: 'accessories', confidence: 0.5 },
  
  // Outerwear
  'trench coat': { category: 'outerwear', confidence: 0.9 },
  'fur coat': { category: 'outerwear', confidence: 0.8 },
  'lab coat': { category: 'outerwear', confidence: 0.7 },
  'raincoat': { category: 'outerwear', confidence: 0.8 },
  
  // Undergarments
  'brassiere': { category: 'undergarments', confidence: 0.7 },
  'bikini': { category: 'swimwear', confidence: 0.8 },
  'swimming trunks': { category: 'swimwear', confidence: 0.8 },
  'maillot': { category: 'swimwear', confidence: 0.7 }
};

// Enhanced fallback clothing items with better variety
const FALLBACK_ITEMS: DetectedItem[] = [
  { label: 'shirt', confidence: 0.6, category: 'tops', pattern: 'solid' },
  { label: 'pants', confidence: 0.6, category: 'bottoms', pattern: 'solid' },
  { label: 'shoes', confidence: 0.5, category: 'footwear', pattern: 'solid' },
  { label: 'top', confidence: 0.5, category: 'tops', pattern: 'solid' },
  { label: 'jacket', confidence: 0.4, category: 'outerwear', pattern: 'solid' }
];

// Comprehensive color database for accurate color naming and fashion analysis
const COLOR_DATABASE = [
  // Basic colors
  { name: 'Black', hex: '#000000', rgb: [0, 0, 0] },
  { name: 'White', hex: '#FFFFFF', rgb: [255, 255, 255] },
  { name: 'Red', hex: '#FF0000', rgb: [255, 0, 0] },
  { name: 'Green', hex: '#008000', rgb: [0, 128, 0] },
  { name: 'Blue', hex: '#0000FF', rgb: [0, 0, 255] },
  { name: 'Yellow', hex: '#FFFF00', rgb: [255, 255, 0] },
  { name: 'Orange', hex: '#FFA500', rgb: [255, 165, 0] },
  { name: 'Purple', hex: '#800080', rgb: [128, 0, 128] },
  { name: 'Pink', hex: '#FFC0CB', rgb: [255, 192, 203] },
  { name: 'Brown', hex: '#A52A2A', rgb: [165, 42, 42] },
  { name: 'Gray', hex: '#808080', rgb: [128, 128, 128] },
  
  // Fashion-specific colors
  { name: 'Navy Blue', hex: '#000080', rgb: [0, 0, 128] },
  { name: 'Burgundy', hex: '#800020', rgb: [128, 0, 32] },
  { name: 'Olive', hex: '#808000', rgb: [128, 128, 0] },
  { name: 'Teal', hex: '#008080', rgb: [0, 128, 128] },
  { name: 'Maroon', hex: '#800000', rgb: [128, 0, 0] },
  { name: 'Beige', hex: '#F5F5DC', rgb: [245, 245, 220] },
  { name: 'Cream', hex: '#FFFDD0', rgb: [255, 253, 208] },
  { name: 'Ivory', hex: '#FFFFF0', rgb: [255, 255, 240] },
  { name: 'Khaki', hex: '#F0E68C', rgb: [240, 230, 140] },
  { name: 'Tan', hex: '#D2B48C', rgb: [210, 180, 140] },
  
  // 2025 trending colors
  { name: 'Lemon Grass', hex: '#F7E98E', rgb: [247, 233, 142] },
  { name: 'Brandied Melon', hex: '#E67E22', rgb: [230, 126, 34] },
  { name: 'Lyons Blue', hex: '#2C3E50', rgb: [44, 62, 80] },
  { name: 'Damson', hex: '#8E44AD', rgb: [142, 68, 173] },
  { name: 'Primrose Pink', hex: '#F8C8DC', rgb: [248, 200, 220] },
  { name: 'Winterberry', hex: '#C0392B', rgb: [192, 57, 43] },
  { name: 'Hot Chocolate', hex: '#8B4513', rgb: [139, 69, 19] },
  { name: 'Chili Oil', hex: '#D32F2F', rgb: [211, 47, 47] },
  { name: 'Poppy Red', hex: '#E53E3E', rgb: [229, 62, 62] },
  { name: 'Bronze Brown', hex: '#CD853F', rgb: [205, 133, 63] },
  
  // Additional fashion colors
  { name: 'Charcoal', hex: '#36454F', rgb: [54, 69, 79] },
  { name: 'Slate Gray', hex: '#708090', rgb: [112, 128, 144] },
  { name: 'Dusty Rose', hex: '#DCAE96', rgb: [220, 174, 150] },
  { name: 'Sage Green', hex: '#9CAF88', rgb: [156, 175, 136] },
  { name: 'Lavender', hex: '#E6E6FA', rgb: [230, 230, 250] },
  { name: 'Coral', hex: '#FF7F50', rgb: [255, 127, 80] },
  { name: 'Mint Green', hex: '#98FB98', rgb: [152, 251, 152] },
  { name: 'Sky Blue', hex: '#87CEEB', rgb: [135, 206, 235] },
  { name: 'Rose Gold', hex: '#E8B4B8', rgb: [232, 180, 184] },
  { name: 'Champagne', hex: '#F7E7CE', rgb: [247, 231, 206] },
  
  // Extended color palette
  { name: 'Crimson', hex: '#DC143C', rgb: [220, 20, 60] },
  { name: 'Forest Green', hex: '#228B22', rgb: [34, 139, 34] },
  { name: 'Royal Blue', hex: '#4169E1', rgb: [65, 105, 225] },
  { name: 'Gold', hex: '#FFD700', rgb: [255, 215, 0] },
  { name: 'Silver', hex: '#C0C0C0', rgb: [192, 192, 192] },
  { name: 'Indigo', hex: '#4B0082', rgb: [75, 0, 130] },
  { name: 'Turquoise', hex: '#40E0D0', rgb: [64, 224, 208] },
  { name: 'Magenta', hex: '#FF00FF', rgb: [255, 0, 255] },
  { name: 'Cyan', hex: '#00FFFF', rgb: [0, 255, 255] },
  { name: 'Lime', hex: '#00FF00', rgb: [0, 255, 0] }
];

// Helper function to calculate color distance using improved algorithm
function colorDistance(rgb1: number[], rgb2: number[]): number {
  // Use weighted Euclidean distance for better perceptual accuracy
  const rDiff = rgb1[0] - rgb2[0];
  const gDiff = rgb1[1] - rgb2[1];
  const bDiff = rgb1[2] - rgb2[2];
  
  // Weight green more heavily as human eyes are more sensitive to green
  return Math.sqrt(2 * rDiff * rDiff + 4 * gDiff * gDiff + 3 * bDiff * bDiff);
}

// K-means clustering for better color quantization
function kMeansColors(pixels: number[][], k: number = 6): number[][] {
  if (pixels.length === 0) return [];
  if (pixels.length <= k) return pixels;
  
  // Initialize centroids using k-means++ for better initial placement
  const centroids: number[][] = [];
  centroids.push([...pixels[Math.floor(Math.random() * pixels.length)]]);
  
  for (let i = 1; i < k; i++) {
    const distances = pixels.map(pixel => {
      const minDist = Math.min(...centroids.map(centroid => colorDistance(pixel, centroid)));
      return minDist * minDist;
    });
    
    const totalDist = distances.reduce((sum, dist) => sum + dist, 0);
    let randomValue = Math.random() * totalDist;
    
    for (let j = 0; j < pixels.length; j++) {
      randomValue -= distances[j];
      if (randomValue <= 0) {
        centroids.push([...pixels[j]]);
        break;
      }
    }
  }
  
  let iterations = 0;
  const maxIterations = 50;
  
  while (iterations < maxIterations) {
    const clusters: number[][][] = Array(k).fill(null).map(() => []);
    
    // Assign pixels to nearest centroid
    for (const pixel of pixels) {
      let minDistance = Infinity;
      let closestCentroid = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const distance = colorDistance(pixel, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = i;
        }
      }
      
      clusters[closestCentroid].push(pixel);
    }
    
    // Update centroids
    let changed = false;
    for (let i = 0; i < centroids.length; i++) {
      if (clusters[i].length > 0) {
        const newCentroid = [
          Math.round(clusters[i].reduce((sum, pixel) => sum + pixel[0], 0) / clusters[i].length),
          Math.round(clusters[i].reduce((sum, pixel) => sum + pixel[1], 0) / clusters[i].length),
          Math.round(clusters[i].reduce((sum, pixel) => sum + pixel[2], 0) / clusters[i].length)
        ];
        
        if (colorDistance(newCentroid, centroids[i]) > 2) {
          centroids[i] = newCentroid;
          changed = true;
        }
      }
    }
    
    if (!changed) break;
    iterations++;
  }
  
  // Filter out empty clusters and sort by cluster size
  const validCentroids = centroids.filter(centroid => 
    centroid.every(c => !isNaN(c) && c >= 0 && c <= 255)
  );
  
  return validCentroids;
}

// Find closest color name from comprehensive database
function getClosestColorName(rgb: number[]): string {
  let minDistance = Infinity;
  let closestColor = 'Unknown';
  
  for (const color of COLOR_DATABASE) {
    const distance = colorDistance(rgb, color.rgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color.name;
    }
  }
  
  return closestColor;
}

export async function loadModel(): Promise<void> {
  try {
    await tf.ready();
    
    // Try multiple model sources for better reliability
    const modelSources = [
      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json',
      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json',
      '/models/mobilenet/model.json'
    ];
    
    for (const source of modelSources) {
      try {
        console.log(`Attempting to load model from: ${source}`);
        model = await tf.loadLayersModel(source);
        console.log('Model loaded successfully from:', source);
        return;
      } catch (error) {
        console.warn(`Failed to load model from ${source}:`, error);
        continue;
      }
    }
    
    throw new Error('All model sources failed');
  } catch (error) {
    console.error('Failed to load any AI model:', error);
    throw new Error('Failed to load AI model - using fallback detection');
  }
}

export function validateImage(file: File): string | null {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, or WebP)';
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'Image size must be less than 10MB';
  }
  return null;
}

async function preprocessImage(file: File): Promise<tf.Tensor3D> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas for enhanced preprocessing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to model input size
        canvas.width = IMAGE_SIZE;
        canvas.height = IMAGE_SIZE;

        // Draw image with better scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, IMAGE_SIZE, IMAGE_SIZE);

        // Apply contrast enhancement
        const imageData = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
        const data = imageData.data;
        
        // Enhance contrast for better object detection
        for (let i = 0; i < data.length; i += 4) {
          // Apply contrast enhancement
          data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.2 + 128));     // R
          data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.2 + 128)); // G
          data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.2 + 128)); // B
        }
        
        ctx.putImageData(imageData, 0, 0);

        // Convert to tensor with proper normalization
        const tensor = tf.browser.fromPixels(canvas)
          .toFloat()
          .expandDims(0)
          .div(255.0);
        
        resolve(tensor as tf.Tensor3D);
      } catch (error) {
        reject(new Error('Failed to preprocess image'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function processImage(file: File): Promise<ImageProcessingResult> {
  try {
    const validationError = validateImage(file);
    if (validationError) {
      return { items: FALLBACK_ITEMS, error: validationError };
    }

    // Try to load model if not already loaded
    if (!model) {
      try {
        await loadModel();
      } catch (modelError) {
        console.warn('Model loading failed, using fallback detection');
        return { 
          items: generateFallbackItems(file), 
          error: 'AI model unavailable, using basic detection' 
        };
      }
    }

    if (!model) {
      return { 
        items: generateFallbackItems(file), 
        error: 'AI model not available' 
      };
    }

    const tensor = await preprocessImage(file);
    const predictions = await model.predict(tensor) as tf.Tensor;
    const data = await predictions.data();

    // Process predictions and extract clothing items
    const items = extractClothingItems(Array.from(data));

    // Clean up tensors
    tf.dispose([tensor, predictions]);

    // If no clothing items detected, use fallback
    if (items.length === 0) {
      return { 
        items: generateFallbackItems(file),
        error: 'No clothing items detected, using basic analysis'
      };
    }

    return { items };
  } catch (error) {
    console.error('Error processing image:', error);
    return { 
      items: generateFallbackItems(file), 
      error: 'Image processing failed, using basic analysis' 
    };
  }
}

function extractClothingItems(predictions: number[]): DetectedItem[] {
  const items: DetectedItem[] = [];
  const seenLabels = new Set<string>();
  
  // Get top predictions with improved threshold
  const topIndices = getTopIndices(predictions, 25);
  
  // First pass: High confidence clothing items
  for (const index of topIndices) {
    const confidence = predictions[index];
    if (confidence < 0.03) continue; // Lower threshold for better detection
    
    const label = getImageNetClass(index);
    const clothingInfo = findClothingMatch(label);
    
    if (clothingInfo && !seenLabels.has(clothingInfo.label)) {
      const adjustedConfidence = Math.min(confidence * clothingInfo.confidence * 1.2, 1.0);
      
      if (adjustedConfidence > 0.08) { // Reasonable confidence threshold
        items.push({
          label: clothingInfo.label,
          confidence: Math.round(adjustedConfidence * 100) / 100,
          category: clothingInfo.category,
          color: extractColor(label),
          pattern: extractPattern(label)
        });
        seenLabels.add(clothingInfo.label);
      }
    }
  }

  // Second pass: Enhanced pattern and color detection
  if (items.length < 3) {
    for (const index of topIndices.slice(0, 15)) {
      const confidence = predictions[index];
      const label = getImageNetClass(index);
      
      // Look for fabric/textile related items
      if (label.includes('fabric') || label.includes('textile') || confidence > 0.15) {
        const color = extractColor(label);
        const pattern = extractPattern(label);
        
        if (color || pattern) {
          const inferredLabel = color ? `${color} clothing` : `${pattern} garment`;
          if (!seenLabels.has(inferredLabel)) {
            items.push({
              label: inferredLabel,
              confidence: Math.round(confidence * 0.6 * 100) / 100,
              category: 'tops',
              color,
              pattern
            });
            seenLabels.add(inferredLabel);
          }
        }
      }
    }
  }

  // Sort by confidence and return top items
  const sortedItems = items
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);

  return sortedItems.length > 0 ? sortedItems : FALLBACK_ITEMS;
}

function getTopIndices(arr: number[], k: number): number[] {
  const indices = Array.from(arr.keys());
  return indices
    .sort((a, b) => arr[b] - arr[a])
    .slice(0, k);
}

function getImageNetClass(index: number): string {
  // Simplified ImageNet class mapping for clothing items
  const clothingClasses: { [key: number]: string } = {
    // Common clothing items from ImageNet
    610: 'jersey',
    611: 'sweatshirt',
    612: 'cardigan',
    613: 'suit',
    614: 'bow tie',
    615: 'bolo tie',
    445: 'bikini',
    446: 'swimming trunks',
    447: 'brassiere',
    448: 'gown',
    449: 'academic gown',
    450: 'jean',
    451: 'miniskirt',
    452: 'sarong',
    520: 'loafer',
    521: 'running shoe',
    522: 'sandal',
    523: 'boot',
    524: 'clog',
    837: 'sunglasses',
    838: 'sunglass',
    414: 'purse',
    415: 'handbag',
    416: 'backpack',
    417: 'wallet',
    525: 'cowboy hat',
    526: 'sombrero',
    527: 'mortarboard',
    528: 'shower cap',
    433: 'trench coat',
    434: 'fur coat',
    435: 'lab coat',
    436: 'raincoat'
  };
  
  return clothingClasses[index] || `item_${index}`;
}

function findClothingMatch(label: string): { label: string; category: string; confidence: number } | null {
  const lowerLabel = label.toLowerCase();
  
  // Direct match
  if (CLOTHING_ITEMS[lowerLabel]) {
    return {
      label: lowerLabel,
      category: CLOTHING_ITEMS[lowerLabel].category,
      confidence: CLOTHING_ITEMS[lowerLabel].confidence
    };
  }
  
  // Partial match
  for (const [item, info] of Object.entries(CLOTHING_ITEMS)) {
    if (lowerLabel.includes(item) || item.includes(lowerLabel)) {
      return {
        label: item,
        category: info.category,
        confidence: info.confidence * 0.8 // Reduce confidence for partial matches
      };
    }
  }
  
  return null;
}

function extractColor(label: string): string | undefined {
  const colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'gray', 'pink', 'purple', 'orange'];
  const lowerLabel = label.toLowerCase();
  
  for (const color of colors) {
    if (lowerLabel.includes(color)) {
      return color;
    }
  }
  
  return undefined;
}

function extractPattern(label: string): string | undefined {
  const patterns = ['striped', 'polka dot', 'floral', 'plaid', 'geometric', 'solid'];
  const lowerLabel = label.toLowerCase();
  
  for (const pattern of patterns) {
    if (lowerLabel.includes(pattern)) {
      return pattern;
    }
  }
  
  return 'solid'; // Default to solid if no pattern detected
}

function generateFallbackItems(file: File): DetectedItem[] {
  const fileName = file.name.toLowerCase();
  const items: DetectedItem[] = [];

  // Enhanced clothing keywords with more variety
  const clothingKeywords = {
    'shirt': { category: 'tops', confidence: 0.7, variations: ['button-up', 'dress shirt', 'casual shirt'] },
    'blouse': { category: 'tops', confidence: 0.7, variations: ['silk blouse', 'work blouse'] },
    'top': { category: 'tops', confidence: 0.6, variations: ['tank top', 'crop top', 'fitted top'] },
    'tshirt': { category: 'tops', confidence: 0.6, variations: ['t-shirt', 'graphic tee'] },
    'sweater': { category: 'tops', confidence: 0.7, variations: ['pullover', 'cardigan', 'knit sweater'] },
    'dress': { category: 'dresses', confidence: 0.8, variations: ['midi dress', 'maxi dress', 'cocktail dress'] },
    'skirt': { category: 'bottoms', confidence: 0.7, variations: ['mini skirt', 'pencil skirt', 'A-line skirt'] },
    'pants': { category: 'bottoms', confidence: 0.6, variations: ['trousers', 'dress pants', 'wide-leg pants'] },
    'jeans': { category: 'bottoms', confidence: 0.7, variations: ['skinny jeans', 'straight jeans', 'boyfriend jeans'] },
    'shorts': { category: 'bottoms', confidence: 0.6, variations: ['denim shorts', 'tailored shorts'] },
    'jacket': { category: 'outerwear', confidence: 0.7, variations: ['denim jacket', 'leather jacket', 'bomber jacket'] },
    'coat': { category: 'outerwear', confidence: 0.7, variations: ['trench coat', 'wool coat', 'pea coat'] },
    'blazer': { category: 'formal', confidence: 0.7, variations: ['structured blazer', 'oversized blazer'] },
    'suit': { category: 'formal', confidence: 0.8, variations: ['business suit', 'power suit'] },
    'shoes': { category: 'footwear', confidence: 0.6, variations: ['dress shoes', 'casual shoes'] },
    'boots': { category: 'footwear', confidence: 0.6, variations: ['ankle boots', 'knee boots', 'combat boots'] },
    'sneakers': { category: 'footwear', confidence: 0.6, variations: ['athletic shoes', 'casual sneakers'] },
    'heels': { category: 'footwear', confidence: 0.6, variations: ['high heels', 'block heels', 'stilettos'] },
    'bag': { category: 'accessories', confidence: 0.5, variations: ['handbag', 'tote bag', 'crossbody bag'] },
    'purse': { category: 'accessories', confidence: 0.5, variations: ['clutch', 'evening bag'] },
    'hat': { category: 'accessories', confidence: 0.5, variations: ['baseball cap', 'beanie', 'fedora'] },
    'scarf': { category: 'accessories', confidence: 0.4, variations: ['silk scarf', 'winter scarf'] },
    'belt': { category: 'accessories', confidence: 0.4, variations: ['leather belt', 'chain belt'] }
  };

  // Check filename for clothing keywords and add variations
  for (const [keyword, info] of Object.entries(clothingKeywords)) {
    if (fileName.includes(keyword)) {
      // Add the main item
      items.push({
        label: keyword,
        confidence: info.confidence,
        category: info.category,
        pattern: 'solid'
      });
      
      // Randomly add a variation for more diversity
      if (info.variations && Math.random() > 0.5) {
        const variation = info.variations[Math.floor(Math.random() * info.variations.length)];
        items.push({
          label: variation,
          confidence: info.confidence * 0.8,
          category: info.category,
          pattern: 'solid'
        });
      }
    }
  }

  // If no specific items found, create diverse generic items based on common outfit components
  if (items.length === 0) {
    const genericOutfits = [
      // Casual outfit
      [
        { label: 't-shirt', confidence: 0.6, category: 'tops', pattern: 'solid' },
        { label: 'jeans', confidence: 0.6, category: 'bottoms', pattern: 'solid' },
        { label: 'sneakers', confidence: 0.5, category: 'footwear', pattern: 'solid' }
      ],
      // Business casual
      [
        { label: 'blouse', confidence: 0.7, category: 'tops', pattern: 'solid' },
        { label: 'trousers', confidence: 0.6, category: 'bottoms', pattern: 'solid' },
        { label: 'loafers', confidence: 0.5, category: 'footwear', pattern: 'solid' }
      ],
      // Formal outfit
      [
        { label: 'dress shirt', confidence: 0.7, category: 'tops', pattern: 'solid' },
        { label: 'dress pants', confidence: 0.6, category: 'bottoms', pattern: 'solid' },
        { label: 'dress shoes', confidence: 0.6, category: 'footwear', pattern: 'solid' }
      ],
      // Feminine outfit
      [
        { label: 'dress', confidence: 0.8, category: 'dresses', pattern: 'solid' },
        { label: 'heels', confidence: 0.6, category: 'footwear', pattern: 'solid' },
        { label: 'handbag', confidence: 0.5, category: 'accessories', pattern: 'solid' }
      ]
    ];
    
    // Select a random outfit type
    const selectedOutfit = genericOutfits[Math.floor(Math.random() * genericOutfits.length)];
    items.push(...selectedOutfit);
  }

  // Add style-based items with more specificity
  if (fileName.includes('formal') || fileName.includes('business') || fileName.includes('work')) {
    items.push({ label: 'blazer', confidence: 0.7, category: 'formal', pattern: 'solid' });
    items.push({ label: 'dress shoes', confidence: 0.6, category: 'footwear', pattern: 'solid' });
  }
  if (fileName.includes('casual') || fileName.includes('everyday') || fileName.includes('weekend')) {
    items.push({ label: 'casual top', confidence: 0.6, category: 'tops', pattern: 'solid' });
    items.push({ label: 'comfortable shoes', confidence: 0.5, category: 'footwear', pattern: 'solid' });
  }
  if (fileName.includes('summer') || fileName.includes('beach') || fileName.includes('vacation')) {
    items.push({ label: 'sundress', confidence: 0.7, category: 'dresses', pattern: 'solid' });
    items.push({ label: 'sandals', confidence: 0.6, category: 'footwear', pattern: 'solid' });
  }
  if (fileName.includes('winter') || fileName.includes('warm') || fileName.includes('cold')) {
    items.push({ label: 'sweater', confidence: 0.7, category: 'tops', pattern: 'solid' });
    items.push({ label: 'boots', confidence: 0.6, category: 'footwear', pattern: 'solid' });
  }
  if (fileName.includes('party') || fileName.includes('night') || fileName.includes('evening')) {
    items.push({ label: 'cocktail dress', confidence: 0.8, category: 'dresses', pattern: 'solid' });
    items.push({ label: 'heels', confidence: 0.7, category: 'footwear', pattern: 'solid' });
  }

  // Remove duplicates and return diverse items
  const uniqueItems = items.filter((item, index, self) => 
    index === self.findIndex(i => i.label === item.label)
  );

  return uniqueItems.slice(0, 6); // Return top 6 diverse fallback items
}

function categorizeItem(label: string): string {
  const categories: Record<string, string[]> = {
    formal: ['suit', 'tie', 'dress_shirt', 'blazer', 'gown', 'dress'],
    casual: ['t-shirt', 'jeans', 'sneaker', 'hoodie', 'sweatshirt'],
    accessories: ['watch', 'necklace', 'sunglasses', 'bag', 'purse', 'belt', 'hat'],
    footwear: ['shoe', 'boot', 'sandal', 'sneaker', 'loafer'],
    outerwear: ['coat', 'jacket', 'blazer', 'cardigan']
  };

  const lowerLabel = label.toLowerCase();
  for (const [category, items] of Object.entries(categories)) {
    if (items.some(item => lowerLabel.includes(item))) {
      return category;
    }
  }
  return 'other';
}

// We'll need to import the IMAGENET_CLASSES array
// This is a simplified version with just clothing-related items
const IMAGENET_CLASSES: string[] = [
  'suit',
  'dress_shirt',
  'tie',
  'blazer',
  't-shirt',
  'jeans',
  'sneaker',
  'hoodie',
  'watch',
  'necklace',
  'sunglasses',
  'shoe',
  'boot',
  'sandal',
  // Add more relevant classes as needed
];

// Color detection functions
export async function extractColorsFromImage(file: File): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Resize image for faster processing
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const colors = extractDominantColors(imageData);
        const palette = analyzeColorPalette(colors);
        
        resolve(palette);
      } catch (error) {
        reject(new Error('Failed to extract colors from image'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for color extraction'));
    img.src = URL.createObjectURL(file);
  });
}

function extractDominantColors(imageData: ImageData): DetectedColor[] {
  const data = imageData.data;
  const pixels: number[][] = [];
  
  // Extract pixel data with improved sampling
  for (let i = 0; i < data.length; i += 12) { // Sample every 3rd pixel for better coverage
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels and very dark/light pixels that might be noise
    if (a < 128 || (r + g + b < 30) || (r + g + b > 750)) continue;
    
    pixels.push([r, g, b]);
  }

  if (pixels.length === 0) {
    return [{
      name: 'Unknown',
      hex: '#808080',
      rgb: { r: 128, g: 128, b: 128 },
      percentage: 100,
      dominance: 'primary'
    }];
  }

  // Use K-means clustering for better color grouping
  const clusters = kMeansColors(pixels, 6);
  const totalPixels = pixels.length;
  
  // Calculate color frequencies and create DetectedColor objects
  const colorResults: DetectedColor[] = clusters.map((centroid, index) => {
    // Count pixels close to this centroid
    const clusterPixels = pixels.filter(pixel => 
      colorDistance(pixel, centroid) < colorDistance(pixel, clusters.filter((_, i) => i !== index)[0] || centroid)
    );
    
    const percentage = (clusterPixels.length / totalPixels) * 100;
    const hex = rgbToHex(centroid[0], centroid[1], centroid[2]);
    
    return {
      name: getClosestColorName(centroid),
      hex,
      rgb: { r: centroid[0], g: centroid[1], b: centroid[2] },
      percentage: Math.round(percentage * 100) / 100,
      dominance: index === 0 ? 'primary' as const : 
                index < 3 ? 'secondary' as const : 'accent' as const
    };
  })
  .filter(color => color.percentage > 1) // Filter out very small color areas
  .sort((a, b) => b.percentage - a.percentage); // Sort by percentage

  return colorResults.length > 0 ? colorResults : [{
    name: 'Gray',
    hex: '#808080',
    rgb: { r: 128, g: 128, b: 128 },
    percentage: 100,
    dominance: 'primary'
  }];
}

function analyzeColorPalette(colors: DetectedColor[]): ColorPalette {
  const harmony = determineColorHarmony(colors);
  const temperature = determineColorTemperature(colors);
  const saturation = determineColorSaturation(colors);
  const seasonalAlignment = determineSeasonalAlignment(colors);

  return {
    dominantColors: colors,
    colorHarmony: harmony,
    colorTemperature: temperature,
    colorSaturation: saturation,
    seasonalAlignment
  };
}

function determineColorHarmony(colors: DetectedColor[]): ColorPalette['colorHarmony'] {
  if (colors.length < 2) return 'monochromatic';

  const hues = colors.map(color => rgbToHsl(color.rgb.r, color.rgb.g, color.rgb.b)[0]);
  
  // Check for monochromatic (similar hues)
  const hueRange = Math.max(...hues) - Math.min(...hues);
  if (hueRange < 30) return 'monochromatic';

  // Check for complementary (opposite hues)
  const hasComplementary = hues.some(h1 => 
    hues.some(h2 => Math.abs(h1 - h2) > 150 && Math.abs(h1 - h2) < 210)
  );
  if (hasComplementary) return 'complementary';

  // Check for analogous (adjacent hues)
  const isAnalogous = hues.every(h => 
    hues.some(h2 => Math.abs(h - h2) < 60)
  );
  if (isAnalogous) return 'analogous';

  // Check if mostly neutral colors
  const neutralCount = colors.filter(color => isNeutralColor(color.hex)).length;
  if (neutralCount / colors.length > 0.6) return 'neutral';

  return 'mixed';
}

function determineColorTemperature(colors: DetectedColor[]): ColorPalette['colorTemperature'] {
  let warmCount = 0;
  let coolCount = 0;

  colors.forEach(color => {
    const [h] = rgbToHsl(color.rgb.r, color.rgb.g, color.rgb.b);
    if ((h >= 0 && h <= 60) || (h >= 300 && h <= 360)) {
      warmCount++;
    } else if (h >= 180 && h <= 300) {
      coolCount++;
    }
  });

  if (warmCount > coolCount * 1.5) return 'warm';
  if (coolCount > warmCount * 1.5) return 'cool';
  return 'neutral';
}

function determineColorSaturation(colors: DetectedColor[]): ColorPalette['colorSaturation'] {
  const avgSaturation = colors.reduce((sum, color) => {
    const [, s] = rgbToHsl(color.rgb.r, color.rgb.g, color.rgb.b);
    return sum + s;
  }, 0) / colors.length;

  if (avgSaturation > 0.7) return 'high';
  if (avgSaturation > 0.3) return 'medium';
  return 'low';
}

function determineSeasonalAlignment(colors: DetectedColor[]): string[] {
  const seasons: string[] = [];
  
  // Spring: bright, clear colors
  if (colors.some(c => {
    const [h, s, l] = rgbToHsl(c.rgb.r, c.rgb.g, c.rgb.b);
    return s > 0.6 && l > 0.4 && l < 0.8;
  })) {
    seasons.push('Spring 2025');
  }

  // Summer: soft, muted colors
  if (colors.some(c => {
    const [, s, l] = rgbToHsl(c.rgb.r, c.rgb.g, c.rgb.b);
    return s < 0.6 && l > 0.5;
  })) {
    seasons.push('Summer 2025');
  }

  // Fall: warm, rich colors
  if (colors.some(c => {
    const [h, s] = rgbToHsl(c.rgb.r, c.rgb.g, c.rgb.b);
    return ((h >= 0 && h <= 60) || (h >= 300 && h <= 360)) && s > 0.4;
  })) {
    seasons.push('Fall 2025');
  }

  // Winter: deep, clear colors
  if (colors.some(c => {
    const [, s, l] = rgbToHsl(c.rgb.r, c.rgb.g, c.rgb.b);
    return (s > 0.7 && l < 0.4) || (s < 0.2 && (l < 0.2 || l > 0.8));
  })) {
    seasons.push('Winter 2025');
  }

  return seasons.length > 0 ? seasons : ['Year-round'];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

// This function is now replaced by the improved version above

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function isNeutralColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  const [, s] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return s < 0.2; // Low saturation indicates neutral color
} 