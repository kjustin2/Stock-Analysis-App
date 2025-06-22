import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine if this is a production build
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    
    // Base URL configuration for deployment
    base: env.VITE_BASE_URL || (isProduction ? '/Stock-Analysis-App/' : '/'),
    
    // Environment variables configuration
    define: {
      // Make environment variables available to the app
      'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || mode),
      'import.meta.env.VITE_DEBUG_MODE': JSON.stringify(env.VITE_DEBUG_MODE === 'true'),
      'import.meta.env.VITE_PRODUCTION_BUILD': JSON.stringify(isProduction),
    },
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['chart.js', 'react-chartjs-2'],
            utils: ['date-fns'],
          }
        }
      },
      // Enable source maps for better debugging in production
      sourcemap: env.VITE_DEBUG_MODE === 'true',
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Enable minification for production
      minify: 'terser',
      // Enable tree shaking
      treeshake: true,
      // Optimize for production
      reportCompressedSize: true,
      // Target modern browsers for better optimization
      target: 'es2015'
    },
    
    server: {
      port: 5173,
      host: true,
      // Development server configuration
      open: env.VITE_DEBUG_MODE === 'true',
      cors: true,
    },
    
    optimizeDeps: {
      include: ['react', 'react-dom', 'chart.js', 'react-chartjs-2'],
      exclude: [],
    },
    
    // Improve development experience
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      // Drop console logs in production
      drop: isProduction ? ['console', 'debugger'] : [],
    },
    
    // Environment variable validation
    envPrefix: 'VITE_',
    
    // Preview server configuration (for production testing)
    preview: {
      port: 4173,
      host: true,
      cors: true,
    },
    
    // Enable CSS code splitting
    css: {
      devSourcemap: true,
    },
  }
}) 