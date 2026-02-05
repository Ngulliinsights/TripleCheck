#!/usr/bin/env node

/**
 * Create PNG favicon files from SVG
 * This script creates the required PNG favicon files
 */

import fs from './cleanup-redundancies';
import path from './cleanup-redundancies';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the required favicon sizes and their purposes
const faviconSizes = [
  { size: 16, name: 'favicon-16x16.png', purpose: 'Browser tab icon (small)' },
  { size: 32, name: 'favicon-32x32.png', purpose: 'Browser tab icon (standard)' },
  { size: 48, name: 'favicon-48x48.png', purpose: 'Windows taskbar' },
  { size: 72, name: 'favicon-72x72.png', purpose: 'Android home screen' },
  { size: 96, name: 'favicon-96x96.png', purpose: 'Android home screen (high-res)' },
  { size: 144, name: 'favicon-144x144.png', purpose: 'Windows Metro tile' },
  { size: 150, name: 'mstile-150x150.png', purpose: 'Windows Metro tile (square)' },
  { size: 180, name: 'apple-touch-icon.png', purpose: 'iOS home screen icon' },
  { size: 192, name: 'android-chrome-192x192.png', purpose: 'Android Chrome icon' },
  { size: 512, name: 'android-chrome-512x512.png', purpose: 'Android Chrome icon (high-res)' }
];

// Create a simple SVG-based favicon for each size
function createFaviconSVG(size) {
  const strokeWidth = size >= 32 ? 2 : 1;
  const checkmarkSize = Math.max(2, size * 0.15);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#14b8a6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0891b2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="url(#gradient)" stroke="#ffffff" stroke-width="0.5"/>
  
  <!-- Simplified Artmark design -->
  <g transform="translate(${size/2},${size/2}) scale(${size/32})">
    <!-- Top arc (teal) -->
    <path d="M-8,-12 C-2,-16 2,-16 8,-12 C8,-8 8,-4 8,0 L-8,0 C-8,-4 -8,-8 -8,-12 Z" fill="#14b8a6"/>
    
    <!-- Center circle (coral/orange) -->
    <circle cx="0" cy="-6" r="3" fill="#ff6f61"/>
    
    <!-- Bottom shield shape -->
    <path d="M-8,0 L8,0 C6,4 4,8 0,12 C-4,8 -6,4 -8,0 Z" fill="#14b8a6"/>
  </g>
  
  ${size >= 24 ? `<!-- Verification checkmark -->
  <path d="M${size*0.65} ${size*0.75} L${size*0.75} ${size*0.85} L${size*0.9} ${size*0.65}" stroke="#ffffff" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
</svg>`;
}

// Create the assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('Creating TripleCheck favicon files...\n');

// Create SVG files for each size (these can be converted to PNG manually or with tools)
faviconSizes.forEach(({ size, name, purpose }) => {
  const svgContent = createFaviconSVG(size);
  const svgPath = path.join(assetsDir, name.replace('.png', '.svg'));
  
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✓ Created ${name.replace('.png', '.svg')} (${size}x${size}) - ${purpose}`);
});

console.log('\n📝 SVG files created successfully!');
console.log('\n🔧 To convert SVG files to PNG:');
console.log('1. Use an online converter like https://convertio.co/svg-png/');
console.log('2. Or use ImageMagick: convert favicon-16x16.svg favicon-16x16.png');
console.log('3. Or use Inkscape: inkscape --export-png=favicon-16x16.png favicon-16x16.svg');
console.log('\n📁 All files should be placed in public/assets/');

// Create a simple HTML preview file
const previewHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TripleCheck Favicon Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .favicon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .favicon-item { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .favicon-display { width: 64px; height: 64px; margin: 0 auto 10px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; }
        .favicon-display img { max-width: 100%; max-height: 100%; }
        .size-label { font-weight: bold; color: #14b8a6; }
        .purpose { font-size: 12px; color: #666; margin-top: 5px; }
        h1 { color: #14b8a6; text-align: center; }
        .instructions { background: #e6fffa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #14b8a6; }
    </style>
</head>
<body>
    <h1>🏠 TripleCheck Favicon Preview</h1>
    
    <div class="instructions">
        <h3>📋 Instructions:</h3>
        <p>1. Convert the SVG files to PNG using your preferred tool</p>
        <p>2. Rename them according to the required names shown below</p>
        <p>3. Place all PNG files in the <code>public/assets/</code> directory</p>
    </div>
    
    <div class="favicon-grid">
        ${faviconSizes.map(({ size, name, purpose }) => `
        <div class="favicon-item">
            <div class="favicon-display">
                <img src="/assets/${name.replace('.png', '.svg')}" alt="${name}" />
            </div>
            <div class="size-label">${size}×${size}px</div>
            <div><strong>${name}</strong></div>
            <div class="purpose">${purpose}</div>
        </div>
        `).join('')}
    </div>
    
    <div class="instructions">
        <h3>🔍 Testing Your Favicons:</h3>
        <p>• Check browser tabs for 16x16 and 32x32 icons</p>
        <p>• Test iOS home screen with apple-touch-icon.png</p>
        <p>• Verify Android Chrome icons work properly</p>
        <p>• Test Windows Metro tiles on Windows devices</p>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon-preview.html'), previewHTML);
console.log('\n🌐 Preview file created: public/favicon-preview.html');
console.log('   Open this in your browser to see all favicon sizes');

console.log('\n✨ Favicon generation complete!');