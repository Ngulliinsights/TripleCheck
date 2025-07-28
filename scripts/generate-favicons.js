#!/usr/bin/env node

/**
 * Favicon Generation Script
 * Generates all required favicon sizes from the Artmark.svg
 */

const fs = require('fs');
const path = require('path');

// Create a simple HTML file that can be used to generate favicons
const faviconHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Favicon Generator</title>
    <style>
        canvas { border: 1px solid #ccc; margin: 10px; }
        .favicon-preview { display: inline-block; margin: 10px; text-align: center; }
    </style>
</head>
<body>
    <h1>TripleCheck Favicon Generator</h1>
    <p>Use this page to manually create favicon files from the SVG.</p>
    
    <div id="favicons"></div>
    
    <script>
        const sizes = [16, 32, 48, 72, 96, 144, 180, 192, 512];
        const faviconContainer = document.getElementById('favicons');
        
        // Artmark-inspired favicon design
        function drawFavicon(canvas, size) {
            const ctx = canvas.getContext('2d');
            const center = size / 2;
            
            // Clear canvas
            ctx.clearRect(0, 0, size, size);
            
            // Background circle with gradient
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#14b8a6');
            gradient.addColorStop(1, '#0891b2');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(center, center, center - 1, 0, 2 * Math.PI);
            ctx.fill();
            
            // White border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = size > 32 ? 2 : 1;
            ctx.stroke();
            
            // Simplified Artmark design
            ctx.save();
            ctx.translate(center, center);
            ctx.scale(size / 32, size / 32);
            
            // Top arc (teal)
            ctx.fillStyle = '#14b8a6';
            ctx.beginPath();
            ctx.moveTo(-8, -12);
            ctx.quadraticCurveTo(0, -16, 8, -12);
            ctx.lineTo(8, 0);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();
            
            // Center circle (coral)
            ctx.fillStyle = '#ff6f61';
            ctx.beginPath();
            ctx.arc(0, -6, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Bottom shield
            ctx.fillStyle = '#14b8a6';
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.quadraticCurveTo(4, 8, 0, 12);
            ctx.quadraticCurveTo(-4, 8, -8, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
            
            // Verification checkmark
            if (size >= 24) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = size > 32 ? 2 : 1.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                const checkSize = size * 0.15;
                const checkX = center + size * 0.2;
                const checkY = center + size * 0.25;
                
                ctx.beginPath();
                ctx.moveTo(checkX - checkSize, checkY);
                ctx.lineTo(checkX, checkY + checkSize);
                ctx.lineTo(checkX + checkSize * 1.5, checkY - checkSize);
                ctx.stroke();
            }
        }
        
        sizes.forEach(size => {
            const container = document.createElement('div');
            container.className = 'favicon-preview';
            
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            canvas.style.width = Math.min(size, 64) + 'px';
            canvas.style.height = Math.min(size, 64) + 'px';
            
            drawFavicon(canvas, size);
            
            const label = document.createElement('div');
            label.textContent = size + 'x' + size;
            
            const downloadLink = document.createElement('a');
            downloadLink.textContent = 'Download';
            downloadLink.href = canvas.toDataURL('image/png');
            downloadLink.download = \`favicon-\${size}x\${size}.png\`;
            downloadLink.style.display = 'block';
            downloadLink.style.marginTop = '5px';
            
            container.appendChild(canvas);
            container.appendChild(label);
            container.appendChild(downloadLink);
            faviconContainer.appendChild(container);
        });
    </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon-generator.html'), faviconHTML);

console.log('Favicon generator HTML created at public/favicon-generator.html');
console.log('Open this file in a browser to generate and download favicon PNG files.');
console.log('');
console.log('Required favicon files:');
console.log('- favicon-16x16.png');
console.log('- favicon-32x32.png');
console.log('- apple-touch-icon.png (180x180)');
console.log('- android-chrome-192x192.png');
console.log('- android-chrome-512x512.png');
console.log('- mstile-150x150.png');