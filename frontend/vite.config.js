import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/Stock-Analysis-App/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        chunkSizeWarningLimit: 2000, // Increased to reduce warnings while we optimize
        rollupOptions: {
            output: {
                manualChunks: {
                    // Keep it simple and focused on the largest libraries
                    'chart-vendor': ['chart.js', 'react-chartjs-2', 'chartjs-adapter-date-fns'],
                    'react-vendor': ['react', 'react-dom'],
                    'utils-vendor': ['axios', 'date-fns'],
                    'math-vendor': ['ml-matrix', 'simple-statistics']
                }
            }
        },
        // Enable source maps for better debugging in production
        sourcemap: false,
        // Optimize CSS
        cssCodeSplit: true,
        // Enable minification
        minify: 'esbuild',
        // Target modern browsers for better optimization
        target: 'esnext'
    },
    server: {
        port: 5173,
        host: true
    },
    optimizeDeps: {
        include: [
            'chart.js',
            'react-chartjs-2',
            'chartjs-adapter-date-fns',
            'date-fns',
            'axios',
            'ml-matrix',
            'simple-statistics'
        ],
        exclude: ['@vite/client', '@vite/env']
    },
    // Improve development experience
    esbuild: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' }
    }
});
