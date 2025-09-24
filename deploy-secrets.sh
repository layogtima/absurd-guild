#!/bin/bash

# Script to deploy secrets to Cloudflare using wrangler
# Reads from .env.example and prompts for actual values

set -e

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

echo "Deploying secrets to Cloudflare from $ENV_FILE..."
echo

# Read each line from .env
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi

    # Extract variable name and value
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        SECRET_NAME="${BASH_REMATCH[1]}"
        SECRET_VALUE="${BASH_REMATCH[2]}"

        if [ -n "$SECRET_VALUE" ]; then
            echo "Setting secret: $SECRET_NAME"
            echo "$SECRET_VALUE" | wrangler secret put "$SECRET_NAME"
            echo "✓ $SECRET_NAME set successfully"
        else
            echo "⚠ Skipping $SECRET_NAME (empty value)"
        fi
        echo
    fi
done < "$ENV_FILE"

echo "All secrets have been processed!"