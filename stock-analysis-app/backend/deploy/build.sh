#!/bin/bash

# AWS Lambda Build Script for Stock Analysis API

set -e

echo "Building Lambda deployment package..."

# Clean previous builds
rm -rf build/
rm -f lambda-deployment.zip

# Create build directory
mkdir -p build

# Copy application code
echo "Copying application code..."
cp -r app/ build/
cp lambda_function.py build/
cp lambda_requirements.txt build/requirements.txt

# Install dependencies
echo "Installing dependencies..."
cd build
pip install -r requirements.txt -t .

# Remove unnecessary files to reduce package size
echo "Optimizing package size..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "*.pyo" -delete 2>/dev/null || true

# Remove large unnecessary packages
rm -rf pandas/tests/ 2>/dev/null || true
rm -rf numpy/tests/ 2>/dev/null || true
rm -rf scipy/tests/ 2>/dev/null || true

# Create deployment package
echo "Creating deployment package..."
zip -r ../lambda-deployment.zip . -x "*.git*" "*.DS_Store*"

cd ..
echo "Build complete! Package size:"
ls -lh lambda-deployment.zip

echo "Build completed successfully!" 