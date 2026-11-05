#!/usr/bin/env bash
# Render build script for Optimach-AI
# Builds React frontend and copies into backend/static/ for Flask to serve

set -o errexit

echo "========================================"
echo "  Optimach-AI Build Script"
echo "========================================"

# 1. Install Python dependencies
echo "[1/4] Installing Python dependencies..."
pip install -r requirements.txt

# 2. Install Node.js dependencies and build frontend
echo "[2/4] Installing Node.js dependencies..."
cd frontend
npm install

echo "[3/4] Building React frontend..."
npm run build

# 3. Copy built files to backend/static
echo "[4/4] Copying build output to backend/static/..."
cd ..
rm -rf backend/static
cp -r frontend/dist backend/static

echo "========================================"
echo "  Build complete!"
echo "  Frontend built and copied to backend/static/"
echo "========================================"
