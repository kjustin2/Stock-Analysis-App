/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side polyfills
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        process: require.resolve('process/browser')
      };

      config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
          process: 'process/browser'
        })
      ];
    }

    return config;
  },
  // Ensure we're using the proper transpilation
  transpilePackages: ['@tensorflow/tfjs', '@tensorflow-models/mobilenet'],
  env: {
    PORT: '3004',
  },
}

module.exports = nextConfig 