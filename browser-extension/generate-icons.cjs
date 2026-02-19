/**
 * Generate PNG icons from SVG
 * Run: node generate-icons.js
 * 
 * For now, we'll use base64 embedded PNGs. 
 * In production, you would use a proper tool like sharp or canvas.
 */

const fs = require('fs');
const path = require('path');

// Simple 1x1 blue pixel PNG as placeholder
// In production, use proper icon generation
const sizes = [16, 48, 128];

// We'll create a simple HTML file that can be opened in a browser 
// to download the icons manually
const html = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
</head>
<body>
  <h1>Özcük Icon Generator</h1>
  <p>Right-click each canvas and "Save image as..." to save the icons.</p>
  ${sizes.map(size => `
    <div style="margin: 20px;">
      <h2>icon-${size}.png</h2>
      <canvas id="canvas-${size}" width="${size}" height="${size}"></canvas>
    </div>
  `).join('')}
  
  <script>
    ${sizes.map(size => `
      (function() {
        const canvas = document.getElementById('canvas-${size}');
        const ctx = canvas.getContext('2d');
        const size = ${size};
        
        // Blue background with rounded corners
        ctx.fillStyle = '#2563eb';
        const radius = size * 0.125;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(size - radius, 0);
        ctx.quadraticCurveTo(size, 0, size, radius);
        ctx.lineTo(size, size - radius);
        ctx.quadraticCurveTo(size, size, size - radius, size);
        ctx.lineTo(radius, size);
        ctx.quadraticCurveTo(0, size, 0, size - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.fill();
        
        // White "Ö" letter
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold ' + (size * 0.6) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Ö', size / 2, size / 2 + size * 0.05);
      })();
    `).join('')}
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'icons', 'generate.html'), html);
console.log('Created icons/generate.html');
console.log('Open this file in a browser and right-click to save each icon.');

