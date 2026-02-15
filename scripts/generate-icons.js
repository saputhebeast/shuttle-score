const fs = require("fs");

function generateIcon(size) {
  const r = Math.round(size * 0.2);
  const cx = size / 2;
  const shuttleR = size * 0.15;
  const shuttleY = size * 0.35;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#111827"/>
  <!-- Shuttlecock head -->
  <circle cx="${cx}" cy="${shuttleY}" r="${shuttleR}" fill="#4ade80" opacity="0.9"/>
  <!-- Feathers -->
  <path d="M${cx - size * 0.18} ${shuttleY + size * 0.08} Q${cx} ${shuttleY + size * 0.35} ${cx + size * 0.18} ${shuttleY + size * 0.08}" 
        fill="none" stroke="#4ade80" stroke-width="${size * 0.03}" opacity="0.7"/>
  <path d="M${cx - size * 0.12} ${shuttleY + size * 0.12} Q${cx} ${shuttleY + size * 0.38} ${cx + size * 0.12} ${shuttleY + size * 0.12}" 
        fill="none" stroke="#4ade80" stroke-width="${size * 0.025}" opacity="0.5"/>
  <!-- Racket handle -->
  <line x1="${cx}" y1="${shuttleY + size * 0.25}" x2="${cx}" y2="${shuttleY + size * 0.45}" 
        stroke="#60a5fa" stroke-width="${size * 0.035}" stroke-linecap="round"/>
  <!-- Racket head -->
  <ellipse cx="${cx}" cy="${shuttleY + size * 0.5}" rx="${size * 0.12}" ry="${size * 0.15}" 
           fill="none" stroke="#60a5fa" stroke-width="${size * 0.03}"/>
  <!-- Score text -->
  <text x="${cx}" y="${size * 0.92}" text-anchor="middle" font-family="system-ui,sans-serif" 
        font-size="${size * 0.08}" font-weight="800" fill="white" opacity="0.6">SCORE</text>
</svg>`;
}

fs.writeFileSync("public/icons/icon-192.svg", generateIcon(192));
fs.writeFileSync("public/icons/icon-512.svg", generateIcon(512));

// Also copy SVG as a simple approach - manifest can reference SVGs
// For PNG fallback, we'll use the SVG directly
console.log("Icons generated successfully");
