#!/bin/sh

# Replace placeholders in env.template.js and create env.js with the actual values
echo "Replacing environment variables..."
envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js
echo "Environment variables replaced successfully."