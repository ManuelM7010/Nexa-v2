const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Primary standard icon SVG (for Web, desktop, and standard PWA)
const standardIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep midnight sapphire canvas with radial luminance -->
    <radialGradient id="bgGrad" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="45%" stop-color="#0f172a"/>
      <stop offset="80%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>

    <!-- Electric cobalt-to-sky gradient -->
    <linearGradient id="valoraBlue" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="45%" stop-color="#2563eb"/>
      <stop offset="85%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>

    <!-- Emerald wealth growth gradient -->
    <linearGradient id="valoraEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="40%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>

    <!-- Metallic bevel ribbon highlight -->
    <linearGradient id="metalBevel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="#bae6fd" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="#38bdf8" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.9"/>
    </linearGradient>

    <!-- Outer rim light -->
    <linearGradient id="rimLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.65"/>
      <stop offset="50%" stop-color="#1e293b" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.45"/>
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="dropShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Squircle Base / Mobile App Tile -->
  <rect width="512" height="512" rx="116" fill="url(#bgGrad)"/>
  <rect x="6" y="6" width="500" height="500" rx="110" fill="none" stroke="url(#rimLight)" stroke-width="4"/>

  <!-- Subtle ambient halo behind emblem -->
  <circle cx="256" cy="256" r="145" fill="#0284c7" opacity="0.18" filter="url(#glow)"/>

  <!-- Geometric Vault Diamond Shield Foundation -->
  <g filter="url(#dropShadow)">
    <rect x="112" y="112" width="288" height="288" rx="64" transform="rotate(45 256 256)" fill="#0f172a" stroke="#1e293b" stroke-width="5"/>
    <rect x="118" y="118" width="276" height="276" rx="58" transform="rotate(45 256 256)" fill="none" stroke="url(#metalBevel)" stroke-width="2.5" opacity="0.45"/>
  </g>

  <!-- VALORA EMBLEM: Interlocking Ascendant 'V' Precision Wings -->
  <g filter="url(#dropShadow)">
    <!-- Left Wing (Cobalt to Sky) -->
    <path d="M 166 172 L 250 376 C 253 383 259 383 262 376 L 294 308 L 222 140 C 217 129 196 131 187 144 Z" fill="url(#valoraBlue)"/>
    
    <!-- Right Wing (Sky to Emerald Mint) -->
    <path d="M 346 172 L 262 376 C 259 383 253 383 250 376 L 218 308 L 290 140 C 295 129 316 131 325 144 Z" fill="url(#valoraEmerald)"/>

    <!-- Polished Bevel Ridge on Left Wing -->
    <path d="M 222 140 L 256 366 L 250 376 L 166 172 Z" fill="#ffffff" opacity="0.18"/>

    <!-- Central Wealth Core Vault Node -->
    <circle cx="256" cy="262" r="24" fill="#38bdf8" filter="url(#glow)"/>
    <circle cx="256" cy="262" r="12" fill="#ffffff"/>
  </g>
</svg>`;

// 2. Maskable Icon SVG (with safe-zone 20% margin for Android circular/squircle adaptive icons)
const maskableIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="mBgGrad" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="45%" stop-color="#0f172a"/>
      <stop offset="80%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>

    <linearGradient id="mValoraBlue" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="45%" stop-color="#2563eb"/>
      <stop offset="85%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>

    <linearGradient id="mValoraEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="40%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>

    <linearGradient id="mMetalBevel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="#bae6fd" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="#38bdf8" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.9"/>
    </linearGradient>

    <filter id="mDropShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Full bleed background for Android adaptive masking -->
  <rect width="512" height="512" fill="url(#mBgGrad)"/>

  <!-- Scaled down to 74% to fit comfortably in the 80% safe zone circle -->
  <g transform="translate(66.56, 66.56) scale(0.74)">
    <circle cx="256" cy="256" r="145" fill="#0284c7" opacity="0.2"/>

    <!-- Diamond Foundation -->
    <g filter="url(#mDropShadow)">
      <rect x="112" y="112" width="288" height="288" rx="64" transform="rotate(45 256 256)" fill="#0f172a" stroke="#1e293b" stroke-width="5"/>
      <rect x="118" y="118" width="276" height="276" rx="58" transform="rotate(45 256 256)" fill="none" stroke="url(#mMetalBevel)" stroke-width="2.5" opacity="0.45"/>
    </g>

    <!-- Emblem -->
    <g filter="url(#mDropShadow)">
      <path d="M 166 172 L 250 376 C 253 383 259 383 262 376 L 294 308 L 222 140 C 217 129 196 131 187 144 Z" fill="url(#mValoraBlue)"/>
      <path d="M 346 172 L 262 376 C 259 383 253 383 250 376 L 218 308 L 290 140 C 295 129 316 131 325 144 Z" fill="url(#mValoraEmerald)"/>
      <path d="M 222 140 L 256 366 L 250 376 L 166 172 Z" fill="#ffffff" opacity="0.18"/>
      <circle cx="256" cy="262" r="24" fill="#38bdf8"/>
      <circle cx="256" cy="262" r="12" fill="#ffffff"/>
    </g>
  </g>
</svg>`;

async function run() {
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardIconSvg, 'utf8');
  console.log('Saved public/icon.svg');

  // 2. Generate PNGs with sharp
  // apple-touch-icon.png (180x180)
  await sharp(Buffer.from(standardIconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png (180x180)');

  // pwa-192x192.png (192x192)
  await sharp(Buffer.from(standardIconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png (192x192)');

  // pwa-512x512.png (512x512)
  await sharp(Buffer.from(standardIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png (512x512)');

  // pwa-maskable-512x512.png (512x512)
  await sharp(Buffer.from(maskableIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png (512x512 maskable)');

  // favicon.ico (64x64 png buffer)
  const faviconBuffer = await sharp(Buffer.from(standardIconSvg))
    .resize(64, 64)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconBuffer);
  console.log('Generated favicon.ico');
}

run().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
