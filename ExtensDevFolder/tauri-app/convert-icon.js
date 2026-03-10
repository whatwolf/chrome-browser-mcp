const fs = require('fs');

// Read the base64 data from app-icon.png
const base64Data = fs.readFileSync('app-icon.png', 'utf8').trim();

// Remove any trailing characters (like %)
const cleanBase64Data = base64Data.replace(/[^A-Za-z0-9+/=]/g, '');

// Convert base64 to buffer
const buffer = Buffer.from(cleanBase64Data, 'base64');

// Write buffer to src-tauri/icons/icon.png
fs.writeFileSync('src-tauri/icons/icon.png', buffer);

console.log('Icon converted successfully!');
