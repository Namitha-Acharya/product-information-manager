#!/bin/bash

# Baserow Development Server Startup Script
# This script starts the Nuxt development server for Baserow
# Usage: ./start-baserow-dev.sh

echo "Starting Baserow development server..."
echo "This may take a few minutes on first run..."

cd "$(dirname "$0")/web-frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the development server
echo "Starting Nuxt dev server..."
echo "The server will be available at: http://localhost:3000"
echo ""
npm run dev
