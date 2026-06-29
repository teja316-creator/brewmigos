// Run: node generate-icons.js
// Requires: npm install sharp (or use Canvas API below)
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Try using canvas if available; otherwise fall back to a solid-color placeholder
try {
  const { createCanvas } = require('canvas');

  function drawIcon(size) {
    const c = createCanvas(size, size);
    const ctx = c.getContext('2d');

    // Background
    ctx.fillStyle = '#1C0A00';
    const r = size * 0.18;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // Emoji (☕)
    ctx.font = `${size * 0.6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☕', size / 2, size / 2 + size * 0.04);

    return c.toBuffer('image/png');
  }

  fs.writeFileSync(path.join('icons', 'icon-192.png'), drawIcon(192));
  fs.writeFileSync(path.join('icons', 'icon-512.png'), drawIcon(512));
  console.log('Generated icon-192.png and icon-512.png');

} catch (e) {
  console.log('canvas module not available. Install with: npm install canvas');
  console.log('Or use an online SVG-to-PNG converter on icons/icon.svg');
}
