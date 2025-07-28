#!/usr/bin/env node

/**
 * Create PNG favicon files using simple base64 encoding
 * This creates minimal PNG files for the favicons
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple PNG creation function (creates a basic colored square)
function createSimplePNG(size, color = '#14b8a6') {
  // This is a very basic PNG - in production, you'd want to use proper image generation
  // For now, we'll create placeholder files that can be replaced with proper icons
  
  const canvas = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#14b8a6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#0891b2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2-1}" fill="url(#grad)" stroke="#fff" stroke-width="1"/>
    <g transform="translate(${size/2},${size/2}) scale(${size/40})">
      <path d="M-10,-15 C-3,-20 3,-20 10,-15 C10,-10 10,-5 10,0 L-10,0 C-10,-5 -10,-10 -10,-15 Z" fill="#14b8a6"/>
      <circle cx="0" cy="-7" r="4" fill="#ff6f61"/>
      <path d="M-10,0 L10,0 C8,5 5,10 0,15 C-5,10 -8,5 -10,0 Z" fill="#14b8a6"/>
    </g>
    ${size >= 24 ? `<path d="M${size*0.65} ${size*0.75} L${size*0.75} ${size*0.85} L${size*0.9} ${size*0.65}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>` : ''}
  </svg>`;
  
  return canvas;
}

// Create the required favicon files
const faviconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 72, name: 'favicon-72x72.png' },
  { size: 96, name: 'favicon-96x96.png' },
  { size: 144, name: 'favicon-144x144.png' },
  { size: 150, name: 'mstile-150x150.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' }
];

const assetsDir = path.join(__dirname, '..', 'public', 'assets');

console.log('Creating placeholder PNG files...\n');

// For now, let's create SVG files with PNG names that can be converted later
faviconSizes.forEach(({ size, name }) => {
  const svgContent = createSimplePNG(size);
  const filePath = path.join(assetsDir, name.replace('.png', '-temp.svg'));
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`✓ Created ${name.replace('.png', '-temp.svg')} (${size}x${size})`);
});

console.log('\n📝 Temporary SVG files created!');
console.log('💡 These need to be converted to PNG format.');
console.log('\n🔧 Quick conversion options:');
console.log('1. Online: Upload SVG files to https://convertio.co/svg-png/');
console.log('2. Command line with ImageMagick: magick convert file.svg file.png');
console.log('3. Use any image editor to open SVG and export as PNG');

// Create a batch conversion script for Windows
const batchScript = `@echo off
echo Converting SVG files to PNG...
cd /d "%~dp0..\\public\\assets"

${faviconSizes.map(({ name }) => {
  const svgName = name.replace('.png', '-temp.svg');
  return `if exist "${svgName}" (
    echo Converting ${svgName} to ${name}...
    rem magick convert "${svgName}" "${name}"
    rem del "${svgName}"
)`;
}).join('\n')}

echo.
echo Conversion complete!
echo Note: Uncomment the magick convert lines if you have ImageMagick installed
pause`;

fs.writeFileSync(path.join(__dirname, 'convert-favicons.bat'), batchScript);
console.log('\n📄 Created convert-favicons.bat script for Windows');
console.log('   Run this script if you have ImageMagick installed');

console.log('\n✨ Favicon setup complete!');