#!/bin/bash

# Firebase Find and Replace Setup Script

echo "Setting up Firebase Find and Replace Script..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install firebase-admin

# Make the script executable
chmod +x firebase_find_replace.js

# Create backup directory
mkdir -p firebase_backups

echo ""
echo "Setup complete! 🎉"
echo ""
echo "Next steps:"
echo "1. Set up your Firebase credentials:"
echo "   export GOOGLE_APPLICATION_CREDENTIALS=\"./your-service-account-key.json\""
echo ""
echo "2. Test the script:"
echo "   node firebase_find_replace.js --help"
echo ""
echo "3. Run a dry-run test:"
echo "   node firebase_find_replace.js -c people -f name --find \"test\" --replace \"updated\" --dry-run"
echo ""
echo "For more information, see README_find_replace.md"
