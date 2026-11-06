#!/usr/bin/env bash
# High-Performance Render Build Script for Optimach-AI
# Builds React frontend, pre-compresses static assets, and links to backend/static

set -o errexit

echo "========================================"
echo "  Optimach-AI High-Performance Build"
echo "========================================"

# 1. Install lean Python dependencies
echo "[1/4] Installing lean Python dependencies..."
pip install -r requirements.txt

# 2. Build code-split React frontend
echo "[2/4] Installing Node dependencies and building frontend..."
cd frontend
npm install
npm run build
cd ..

# 3. Copy dist to backend/static
echo "[3/4] Copying build output to backend/static/..."
rm -rf backend/static
cp -r frontend/dist backend/static

# 4. Pre-compress JS and CSS with gzip for lightning-fast loads
echo "[4/4] Pre-compressing static assets with Gzip..."
python -c "
import os, gzip
assets_dir = 'backend/static/assets'
if os.path.isdir(assets_dir):
    for f in os.listdir(assets_dir):
        if (f.endswith('.js') or f.endswith('.css')) and not f.endswith('.gz'):
            src = os.path.join(assets_dir, f)
            dst = src + '.gz'
            with open(src, 'rb') as f_in, gzip.open(dst, 'wb', compresslevel=9) as f_out:
                f_out.write(f_in.read())
            print(f'Compressed: {f} -> {os.path.getsize(dst)} bytes')
"

echo "========================================"
echo "  Build successful! Fast assets ready."
echo "========================================"
