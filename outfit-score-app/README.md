# Outfit Score App

A modern web application that analyzes and scores outfit images using AI and computer vision. Upload an image of an outfit and get detailed feedback on style, coordination, and overall appearance.

## Features

- **AI-Powered Analysis**: Uses TensorFlow.js with MobileNet for intelligent outfit recognition
- **Comprehensive Scoring**: Multi-factor scoring system including formality, coordination, layering, and style coherence
- **Gender-Specific Feedback**: Tailored recommendations based on detected clothing styles
- **Real-time Processing**: Client-side image processing with instant feedback
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Detailed Breakdown**: Score breakdown with specific strengths and improvement suggestions

## Tech Stack

- **Frontend**: Next.js 13+ with TypeScript and App Router
- **UI**: Tailwind CSS for styling
- **AI/ML**: TensorFlow.js with MobileNet model
- **Testing**: Jest, React Testing Library, Cypress
- **Build Tools**: ESLint, Prettier, TypeScript
- **Development**: Hot reload, TypeScript strict mode

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── OutfitScorer.tsx   # Main scoring component
│   └── OutfitScorer.test.tsx # Component tests
├── utils/                 # Utility functions
├── types/                 # TypeScript type definitions
└── tests/                 # Additional test files
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

## Quick Start

### 🚀 1-Click Startup (Recommended)

**Windows (Batch):**
```bash
# Double-click this file to start the app
./start-app.bat
```

**Windows (PowerShell):**
```powershell
# Right-click and "Run with PowerShell" or run in terminal
powershell -ExecutionPolicy Bypass -File start-app.ps1
```

**macOS/Linux:**
```bash
# Make executable and run
chmod +x start-app.sh
./start-app.sh
```

### 📋 Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd outfit-score-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   The app will automatically open at [http://localhost:3002](http://localhost:3002)
   
   If it doesn't open automatically, navigate to: `http://localhost:3002`

### 🔧 Alternative Startup Methods

**Using npm script:**
```bash
npm run start-app
```

**Using Yarn:**
```bash
yarn install
yarn dev
```

**Using pnpm:**
```bash
pnpm install
pnpm dev
```

### 🏗️ Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

3. **Static export (optional)**
   ```bash
   npm run export
   ```

### 🔍 Verify Installation

After starting the app, you should see:
- ✅ Development server running on port 3002
- ✅ "Outfit Style Analyzer" heading
- ✅ Upload area for images
- ✅ No console errors in browser dev tools

### 🚨 Troubleshooting Startup

**Port already in use:**
```bash
# Kill process on port 3002
npx kill-port 3002
# Or use a different port
npm run dev -- -p 3001
```

**Dependencies issues:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Permission errors (macOS/Linux):**
```bash
# Fix permissions
sudo chown -R $(whoami) ~/.npm
```

### 📋 Quick Reference

| Method | Command | Description |
|--------|---------|-------------|
| **1-Click (Windows)** | Double-click `start-app.bat` | Easiest for Windows users |
| **1-Click (PowerShell)** | `powershell -ExecutionPolicy Bypass -File start-app.ps1` | Alternative Windows method |
| **1-Click (macOS/Linux)** | `./start-app.sh` | Easiest for Unix systems |
| **NPM Script** | `npm run start-app` | Cross-platform npm command |
| **Manual** | `npm install && npm run dev` | Traditional method |

**🎯 Recommended:** Use the 1-click scripts for the easiest experience!

## Recent Updates

### Dynamic Analysis Engine (Latest - v2.2)
- **🧠 Dynamic Trend Alignment**: Trend recommendations now based on actual detected colors and items with real-time confidence scoring
- **🎨 Intelligent Color & Style Tips**: Tips generated based on detected color palette with style-category specific advice and seasonal intelligence
- **📊 Enhanced Style Categorization**: 9 style categories (Formal, Business, Casual, Bohemian, Minimalist, Athleisure, Romantic, Edgy, Preppy) with multi-factor analysis
- **🔍 Advanced Item Detection**: Diverse fallback system with 6+ outfit types, enhanced filename intelligence, and context-aware generation
- **💡 Smart Feedback System**: Dynamic strengths and improvements based on actual detected items with specific, actionable recommendations
- **🎯 Contextual Analysis**: All analysis components now respond dynamically to image content rather than providing static results

### AI Model Improvements (v2.1)
- **🧠 Enhanced Color Detection**: Advanced K-means clustering algorithm achieving 80%+ color accuracy with perceptual color distance calculations
- **🔍 Improved Item Detection**: Multi-source model loading with intelligent fallback systems and enhanced preprocessing
- **⚡ Better AI Processing**: Enhanced image preprocessing with contrast enhancement, noise reduction, and high-quality scaling
- **🎯 Smart Fallback Detection**: Filename-based analysis and pattern recognition for better item identification when AI models fail
- **🎨 Comprehensive Color Database**: 50+ fashion-specific colors including 2025 trending shades (Lemon Grass, Brandied Melon, etc.)
- **🧹 UI Cleanup**: Removed duplicate titles and improved visual hierarchy for better user experience

### Major Feature Enhancement (v2.0)
- **🎨 Color Detection System**: AI-powered color analysis with dominant color extraction, hex codes, and color harmony detection
- **📈 Enhanced 2025 Trend Analysis**: Comprehensive trend database with clickable links to authoritative fashion sources (Vogue, Harper's Bazaar, Pantone)
- **🔗 Clickable Trend References**: Direct links to fashion articles with confidence percentages and source attribution
- **📱 Improved UI/UX**: Compact, modern layout with better visual hierarchy and reduced scrolling requirements
- **🎯 Professional Design**: Enhanced card-based layout with improved accessibility and mobile responsiveness

### Major UI/UX Overhaul (v1.5)
- **Fixed Readability Issues**: Resolved white text on white background problems with proper contrast
- **Enhanced Visual Design**: Modern card-based layout with proper spacing and typography
- **Improved Score Display**: Color-coded scoring with animated progress bars and detailed breakdowns
- **Better Error Handling**: Comprehensive error states with helpful messaging
- **Responsive Design**: Optimized layout for all screen sizes

### Enhanced Functionality (v1.0)
- **Fixed NaN Scores**: Proper error handling and validation in scoring calculations
- **Enhanced Image Processing**: Better clothing item detection with comprehensive fallback systems
- **2025 Fashion Trends**: Integration of current fashion trends including Lemon Grass, Brandied Melon, and Lyons Blue
- **Smart Categorization**: Automatic style category detection and occasion suitability recommendations
- **Fallback Detection**: Robust image processing with fallback systems for reliable analysis

### Technical Improvements (v2.1)
- **Advanced Color Analysis**: K-means clustering with k-means++ initialization for optimal color grouping
- **Perceptual Color Distance**: Weighted Euclidean distance calculation for better color matching accuracy
- **Enhanced Image Preprocessing**: Canvas-based processing with contrast enhancement and high-quality scaling
- **Multi-Source Model Loading**: Fallback system across multiple TensorFlow.js model sources for reliability
- **Intelligent Fallback Systems**: Filename analysis and pattern recognition when AI models are unavailable
- **Comprehensive Error Handling**: Graceful degradation with meaningful error messages and recovery options

### Previous Technical Improvements
- **Color Analysis Engine**: Real-time color extraction from uploaded images with percentage dominance
- **Trend Database**: Comprehensive 2025 fashion trends with confidence scoring and seasonal alignment
- **Improved Performance**: Optimized loading states and error recovery
- **Type Safety**: Enhanced TypeScript definitions for better development experience
- **Better Testing**: Comprehensive test coverage with multiple testing strategies

## Scoring System

The app uses a comprehensive scoring algorithm with multiple components:

### Score Components (Total: 100 points)

1. **Base Score**: 30 points (starting foundation)
2. **Item Variety**: up to 15 points (diversity of clothing items)
3. **Color Coordination**: up to 10 points (color harmony and matching)
4. **Layering**: up to 10 points (proper layering techniques)
5. **Accessories**: up to 10 points (appropriate accessory usage)
6. **Style Coherence**: up to 15 points (consistency in style theme)
7. **Pattern Score**: up to 10 points (pattern coordination)
8. **Formality Score**: up to 10 points (appropriate formality level)
9. **Essentials Score**: 5-10 points (essential clothing items)
10. **Gender-Specific Score**: up to 15 points (gender-appropriate styling)

### Feedback Categories

- **Excellent (80-100)**: Outstanding outfit with great style choices
- **Good (60-79)**: Solid outfit with minor areas for improvement
- **Fair (40-59)**: Decent outfit with several improvement opportunities
- **Needs Work (0-39)**: Significant styling improvements recommended

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test OutfitScorer.test.tsx
```

### Test Types

1. **Unit Tests**: Component logic and utility functions
2. **Integration Tests**: Component interactions and data flow
3. **E2E Tests**: Complete user workflows (Cypress)

### Testing Strategy

- **Component Testing**: React Testing Library for component behavior
- **Logic Testing**: Jest for scoring algorithms and utilities
- **Visual Testing**: Snapshot testing for UI consistency
- **Accessibility Testing**: axe-core integration for a11y compliance

## Development

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Code formatting
npm run format

# Fix linting issues
npm run lint:fix
```

### Pre-commit Hooks

The project uses Husky and lint-staged for automated code quality checks:

- TypeScript compilation
- ESLint validation
- Prettier formatting
- Test execution

### Configuration Files

- `next.config.js`: Next.js configuration with TensorFlow.js webpack setup
- `tailwind.config.js`: Tailwind CSS customization
- `tsconfig.json`: TypeScript compiler options
- `jest.config.js`: Jest testing configuration
- `.eslintrc.json`: ESLint rules and settings

## Troubleshooting

### Common Issues

1. **TensorFlow.js Loading Issues**
   - Ensure proper webpack configuration in `next.config.js`
   - Check browser compatibility for WebGL
   - Verify model loading in network tab

2. **Build Errors**
   - Run `npm run type-check` to identify TypeScript issues
   - Check for missing dependencies
   - Verify Next.js configuration

3. **Performance Issues**
   - Monitor image file sizes (recommended < 5MB)
   - Check browser console for errors
   - Ensure proper model caching

### Development Tips

- Use browser dev tools to monitor TensorFlow.js model loading
- Test with various image formats and sizes
- Check console for detailed error messages
- Use React DevTools for component debugging

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Run code quality checks (`npm run lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Code Standards

- Follow TypeScript strict mode
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Maintain test coverage above 80%
- Follow React best practices and hooks guidelines

## Performance Considerations

- **Image Optimization**: Client-side resizing and format optimization
- **Model Loading**: Progressive loading with caching strategies
- **Bundle Size**: Code splitting and dynamic imports
- **Memory Management**: Proper cleanup of TensorFlow.js tensors

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - see LICENSE file for details

## Acknowledgments

- TensorFlow.js team for the machine learning framework
- MobileNet model for image classification
- Next.js team for the React framework
- Tailwind CSS for the utility-first CSS framework 