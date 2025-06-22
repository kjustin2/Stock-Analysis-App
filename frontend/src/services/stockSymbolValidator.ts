export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  fixedSymbol?: string;
}

export interface ValidationOptions {
  allowETFs?: boolean;
  allowCrypto?: boolean;
  allowInternational?: boolean;
  maxLength?: number;
}

export class StockSymbolValidator {
  private static instance: StockSymbolValidator;
  
  // Common stock exchanges and their symbol patterns
  private readonly symbolPatterns = {
    US: /^[A-Z]{1,5}$/,                    // US stocks: 1-5 letters
    ETF: /^[A-Z]{2,4}$/,                   // ETFs: typically 2-4 letters
    CRYPTO: /^[A-Z]{3,5}-USD$/,            // Crypto pairs like BTC-USD
    INTERNATIONAL: /^[A-Z]{1,6}\.[A-Z]{1,3}$/, // International like TSM.TW
  };

  // Known stock symbols for better validation
  private readonly knownSymbols = new Set([
    // Major tech stocks
    'AAPL', 'GOOGL', 'GOOG', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
    'CRM', 'ADBE', 'PYPL', 'ORCL', 'IBM', 'UBER', 'LYFT', 'ZOOM', 'SHOP', 'SQ', 'TWLO',
    
    // Major ETFs
    'SPY', 'QQQ', 'VTI', 'VOO', 'IWM', 'EFA', 'EEM', 'GLD', 'SLV', 'TLT', 'HYG', 'LQD',
    
    // Major indices and other popular stocks
    'ARKK', 'ARKQ', 'ARKG', 'DIS', 'BA', 'JPM', 'BAC', 'WFC', 'GS', 'V', 'MA', 'KO', 'PEP',
    'JNJ', 'PFE', 'UNH', 'T', 'VZ', 'XOM', 'CVX', 'WMT', 'HD', 'PG', 'COST', 'NKE'
  ]);

  // Common typing mistakes and their corrections
  private readonly commonMistakes = new Map([
    ['APPLE', 'AAPL'],
    ['GOOGLE', 'GOOGL'],
    ['MICROSOFT', 'MSFT'],
    ['AMAZON', 'AMZN'],
    ['TESLA', 'TSLA'],
    ['FACEBOOK', 'META'],
    ['META-PLATFORMS', 'META'],
    ['NVIDIA', 'NVDA'],
    ['NETFLIX', 'NFLX'],
    ['AMD', 'AMD'],
    ['INTEL', 'INTC'],
    ['SALESFORCE', 'CRM'],
    ['ADOBE', 'ADBE'],
    ['PAYPAL', 'PYPL'],
    ['ORACLE', 'ORCL'],
    ['IBM', 'IBM'],
    ['UBER', 'UBER'],
    ['LYFT', 'LYFT'],
    ['ZOOM', 'ZM'],
    ['SHOPIFY', 'SHOP'],
    ['SQUARE', 'SQ'],
    ['SPY', 'SPY'],
    ['QQQ', 'QQQ'],
    ['VTI', 'VTI']
  ]);

  // Invalid characters and patterns
  private readonly invalidPatterns = [
    /[^A-Za-z0-9.-]/,    // Only allow letters, numbers, dots, hyphens
    /^\d+$/,             // Pure numbers
    /^\.+$/,             // Only dots
    /^-+$/,              // Only hyphens
    /\s/,                // Any whitespace
  ];

  private constructor() {}

  public static getInstance(): StockSymbolValidator {
    if (!StockSymbolValidator.instance) {
      StockSymbolValidator.instance = new StockSymbolValidator();
    }
    return StockSymbolValidator.instance;
  }

  /**
   * Validate a stock symbol with comprehensive error checking
   */
  public validateSymbol(input: string, options: ValidationOptions = {}): ValidationResult {
    const {
      allowETFs = true,
      allowCrypto = false,
      allowInternational = false,
      maxLength = 6
    } = options;

    // Handle empty or null input
    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        error: 'Please enter a stock symbol',
        suggestion: 'Try entering a symbol like AAPL, GOOGL, or MSFT'
      };
    }

    const trimmed = input.trim();
    
    // Handle empty after trim
    if (trimmed.length === 0) {
      return {
        isValid: false,
        error: 'Please enter a stock symbol',
        suggestion: 'Try entering a symbol like AAPL, GOOGL, or MSFT'
      };
    }

    // Check for common company name mistakes
    const upperInput = trimmed.toUpperCase();
    if (this.commonMistakes.has(upperInput)) {
      const correctedSymbol = this.commonMistakes.get(upperInput)!;
      return {
        isValid: true,
        fixedSymbol: correctedSymbol,
        suggestion: `Did you mean "${correctedSymbol}"?`
      };
    }

    // Check for invalid characters/patterns
    for (const pattern of this.invalidPatterns) {
      if (pattern.test(trimmed)) {
        return {
          isValid: false,
          error: 'Invalid characters in symbol',
          suggestion: 'Stock symbols should only contain letters and numbers (e.g., AAPL, GOOGL)'
        };
      }
    }

    // Check length
    if (trimmed.length > maxLength) {
      return {
        isValid: false,
        error: `Symbol too long (max ${maxLength} characters)`,
        suggestion: 'Most stock symbols are 1-5 characters long'
      };
    }

    const upperSymbol = trimmed.toUpperCase();

    // Check against known symbols first (fastest validation)
    if (this.knownSymbols.has(upperSymbol)) {
      return {
        isValid: true,
        fixedSymbol: upperSymbol
      };
    }

    // Pattern-based validation
    if (this.symbolPatterns.US.test(upperSymbol)) {
      return {
        isValid: true,
        fixedSymbol: upperSymbol
      };
    }

    if (allowETFs && this.symbolPatterns.ETF.test(upperSymbol)) {
      return {
        isValid: true,
        fixedSymbol: upperSymbol
      };
    }

    if (allowCrypto && this.symbolPatterns.CRYPTO.test(upperSymbol)) {
      return {
        isValid: true,
        fixedSymbol: upperSymbol
      };
    }

    if (allowInternational && this.symbolPatterns.INTERNATIONAL.test(upperSymbol)) {
      return {
        isValid: true,
        fixedSymbol: upperSymbol
      };
    }

    // Provide helpful suggestions for common cases
    if (trimmed.length === 1) {
      return {
        isValid: false,
        error: 'Symbol too short',
        suggestion: 'Most stock symbols are 2-5 characters long (e.g., V, MA for shorter symbols)'
      };
    }

    if (trimmed.length > 5 && trimmed.length <= maxLength) {
      return {
        isValid: false,
        error: 'Unusual symbol length',
        suggestion: 'Most US stock symbols are 1-5 characters. Check if this is an international symbol.'
      };
    }

    // Check for possible typos in known symbols
    const possibleMatch = this.findSimilarSymbol(upperSymbol);
    if (possibleMatch) {
      return {
        isValid: false,
        error: 'Symbol not found',
        suggestion: `Did you mean "${possibleMatch}"?`
      };
    }

    // Default case - symbol format looks valid but unknown
    return {
      isValid: true,
      fixedSymbol: upperSymbol,
      suggestion: 'Symbol format is valid, but please verify it exists on the exchange'
    };
  }

  /**
   * Find similar known symbols using simple string distance
   */
  private findSimilarSymbol(input: string): string | null {
    let bestMatch: string | null = null;
    let bestScore = Infinity;
    const maxDistance = 2; // Allow up to 2 character differences

    for (const knownSymbol of this.knownSymbols) {
      const distance = this.levenshteinDistance(input, knownSymbol);
      if (distance < bestScore && distance <= maxDistance) {
        bestScore = distance;
        bestMatch = knownSymbol;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get validation options for different contexts
   */
  public getContextualOptions(context: 'general' | 'crypto' | 'international' | 'etf-focused'): ValidationOptions {
    switch (context) {
      case 'crypto':
        return { allowCrypto: true, allowETFs: false, allowInternational: false };
      case 'international':
        return { allowInternational: true, allowETFs: true, maxLength: 8 };
      case 'etf-focused':
        return { allowETFs: true, allowCrypto: false, allowInternational: false };
      case 'general':
      default:
        return { allowETFs: true, allowCrypto: false, allowInternational: false };
    }
  }

  /**
   * Batch validate multiple symbols
   */
  public validateBatch(symbols: string[], options: ValidationOptions = {}): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();
    
    for (const symbol of symbols) {
      results.set(symbol, this.validateSymbol(symbol, options));
    }
    
    return results;
  }
}

export const stockSymbolValidator = StockSymbolValidator.getInstance(); 