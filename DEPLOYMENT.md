# Production Deployment Guide for Stock Analysis App

## Environment Variables Setup

### Required Environment Variables
Copy rontend/.env.example to rontend/.env and fill in the required values:

`
VITE_FINNHUB_API_KEY=your_actual_api_key_here
`

### Getting API Keys
1. **Finnhub API Key** (Required)
   - Visit: https://finnhub.io/register  
   - Register for a free account
   - Get your API key from the dashboard
   - Free tier: 60 calls/minute

### Deployment Platforms

#### GitHub Pages
1. Add secrets in repository settings:
   - Go to Settings > Secrets and variables > Actions
   - Add: VITE_FINNHUB_API_KEY with your API key
2. The GitHub Actions workflow will automatically deploy

#### Netlify
1. Connect your repository to Netlify
2. In site settings, add environment variables:
   - VITE_FINNHUB_API_KEY=your_api_key
3. Deploy will happen automatically on push

#### Vercel  
1. Connect repository to Vercel
2. In project settings, add environment variables:
   - VITE_FINNHUB_API_KEY=your_api_key
3. Deploy will happen automatically on push

### Build Commands
- **Development**: cd frontend && npm run dev
- **Production Build**: cd frontend && npm run build
- **Preview Build**: cd frontend && npm run preview

### Security Notes
- API keys are exposed in the client-side JavaScript
- For production apps with sensitive data, consider using a backend proxy
- Never commit actual .env files to version control
- All environment variables are already properly excluded in .gitignore
