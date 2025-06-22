# Stock Analysis App

A sophisticated front-end application designed for real-time stock analysis, data visualization, and market insights. This application provides users with a powerful toolset to monitor stock performance, analyze trends with technical indicators, and receive AI-driven recommendations.

## ✨ Features

- **Real-Time Stock Data**: Live price updates and detailed stock information from multiple reliable sources (Finnhub and Yahoo Finance).
- **Advanced Charting**: Interactive charts with multiple time periods, technical indicators (SMA, RSI, MACD, etc.), and volume data.
- **AI-Powered Recommendations**: A recommendation engine that analyzes market data to provide `UP`, `DOWN`, or `HOLD` signals.
- **Robust API Service**: Features a resilient API service with built-in fallback mechanisms, rate limiting, and caching to ensure high availability and performance.
- **Smart Search**: An intelligent search component with autocomplete and symbol validation.
- **Error Handling**: Graceful error handling with clear user-facing messages and a component-level error boundary.
- **Performance Optimized**: Lazy loading for heavy components and a production-optimized build process for fast load times.

## 🛠️ Tech Stack

- **Framework**: React
- **Language**: TypeScript
- **Bundler**: Vite
- **Charting**: Chart.js with `react-chartjs-2`
- **Styling**: (Not specified, but assumes CSS/Tailwind)
- **HTTP Client**: Axios

## 🚀 Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd stock-analysis-app
    ```

2.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Set up environment variables:**
    - Create a `.env` file in the `frontend` directory by copying the `.env.example` file.
    -   ```bash
        cp .env.example .env
        ```
    - Add your API key for Finnhub to the `.env` file.

## 🏃 Running the Application

As per the project's development workflow, the application should be built for production and then served manually.

1.  **Build the application:**
    ```bash
    npm run build
    ```
    This command compiles the application and places the optimized build artifacts in the `frontend/dist` directory.

2.  **Serve the production build:**
    You can use any static file server to serve the contents of the `frontend/dist` directory. A common tool for this is `serve`.
    ```bash
    # If you don't have serve, install it globally
    npm install -g serve

    # Serve the dist directory
    serve -s dist
    ```
    The application will then be available at the URL provided by the server (usually `http://localhost:3000`).

## 🔑 Environment Variables

To run this application, you need to provide the following environment variable in a `.env` file in the `frontend` directory:

-   `VITE_FINNHUB_API_KEY`: Your API key for the Finnhub.io service.

See `.env.example` for a template.
