import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { OutfitScorerProps, StyleScore, DetectedItem } from '../types';
import { processImage, loadModel, extractColorsFromImage } from '../utils/imageProcessing';
import { calculateScore } from '../utils/styleScoring';

export default function OutfitScorer({ className = '' }: OutfitScorerProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [score, setScore] = useState<StyleScore | null>(null);
  const [items, setItems] = useState<DetectedItem[]>([]);

  // Initialize model on component mount
  React.useEffect(() => {
    const initModel = async () => {
      try {
        await loadModel();
      } catch (err) {
        console.error('Failed to load model:', err);
        // Don't set error here as we have fallback detection
      }
    };
    initModel();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setScore(null);
    setItems([]);

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);

      // Process image and extract colors
      const [result, colorPalette] = await Promise.all([
        processImage(file),
        extractColorsFromImage(file)
      ]);
      
      if (!result || !result.items || result.items.length === 0) {
        throw new Error('No clothing items detected in the image');
      }

      setItems(result.items);
      const styleScore = calculateScore(result.items);
      
      // Update score with detected colors
      styleScore.detectedColors = colorPalette;
      setScore(styleScore);

      // Show warning if using fallback detection
      if (result.error) {
        console.warn('Using fallback detection:', result.error);
      }
    } catch (err) {
      setError('Failed to analyze outfit. Please try uploading a clearer image with visible clothing items.');
      console.error('Error processing image:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Outfit Style Scorer</h1>
        <p className="text-lg text-gray-600 mb-2">AI-Powered Fashion Analysis with 2025 Trend Insights</p>
        <p className="text-sm text-gray-500">Upload an outfit image to get detailed style feedback, color analysis, and trend alignment</p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
      >
        <input {...getInputProps()} data-testid="file-input" />
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop your outfit image here' : 'Upload an outfit image'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop or click to select • JPEG, PNG, WebP • Max 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-8 text-center" data-testid="loading-state">
          <div className="inline-flex items-center space-x-4 bg-white rounded-lg shadow-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-lg font-medium text-gray-900">Analyzing your outfit...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-8" data-testid="error-state">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {imageUrl && !loading && !error && score && (
        <div className="mt-8 space-y-8">
          {/* Top Section: Image and Overall Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Display */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Outfit</h2>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Uploaded outfit"
                  className="w-full h-auto max-h-80 object-contain"
                />
              </div>
            </div>
            
            {/* Analysis Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overall Score */}
              <div className={`${getScoreBgColor(score.overall)} rounded-lg p-6`} data-testid="score-display">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Overall Style Score</h2>
                  <div className={`text-5xl font-bold ${getScoreColor(score.overall)} mb-2`}>
                    {score.overall}/100
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Style Category:</span>
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-900">
                      {score.styleCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(score.breakdown).map(([key, value]) => {
                    const maxScore = key === 'baseScore' ? 30 : 
                                   key === 'itemVariety' || key === 'styleCoherence' || key === 'genderSpecificScore' ? 15 : 10;
                    const percentage = (value / maxScore) * 100;
                    
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-xs text-gray-900 font-medium">
                            {value}/{maxScore}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Occasion Suitability */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Occasion Suitability</h3>
                <div className="flex flex-wrap gap-2">
                  {score.occasionSuitability.map((occasion, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {occasion}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detected Items & Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detected Items */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Items</h3>
              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-900 font-medium capitalize">{item.label}</span>
                        {item.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 capitalize">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No specific items detected</p>
              )}
            </div>

            {/* Detected Colors */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Colors</h3>
              {score.detectedColors.dominantColors.length > 0 ? (
                <div className="space-y-3">
                  {score.detectedColors.dominantColors.slice(0, 5).map((color, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{color.name}</span>
                          <span className="text-xs text-gray-500">{color.percentage}%</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-600 capitalize">{color.dominance}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600">{color.hex}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Color Harmony:</span>
                      <span className="font-medium text-gray-900 capitalize">{score.detectedColors.colorHarmony}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Temperature:</span>
                      <span className="font-medium text-gray-900 capitalize">{score.detectedColors.colorTemperature}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Upload a clearer image for color analysis</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Strengths
              </h3>
              <ul className="space-y-2">
                {score.feedback.strengths.map((strength, index) => (
                  <li key={index} className="text-green-800 text-sm">
                    • {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Suggestions for Improvement
              </h3>
              <ul className="space-y-2">
                {score.feedback.improvements.map((improvement, index) => (
                  <li key={index} className="text-yellow-800 text-sm">
                    • {improvement}
                  </li>
                ))}
              </ul>
            </div>

            {/* Trend Alignment */}
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                2025 Trend Alignment
              </h3>
              <div className="space-y-3">
                {score.feedback.trendAlignment.map((trend, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-purple-900 text-sm">{trend.name}</h4>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        {Math.round(trend.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-purple-800 text-sm mb-2">{trend.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-purple-600">{trend.source}</span>
                      {trend.url && trend.url !== '#' && (
                        <a
                          href={trend.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-700 hover:text-purple-900 underline flex items-center"
                        >
                          Read More
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Color Advice */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                </svg>
                Color & Style Tips
              </h3>
              <ul className="space-y-2">
                {score.feedback.colorAdvice.map((advice, index) => (
                  <li key={index} className="text-blue-800 text-sm">
                    • {advice}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 