import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { StorageService } from './storageService';
import { ImportEngine } from './importEngine';
import { BrowserWindow } from 'electron';

export class SamplePhotoService {
  public static async createAndImportSamples(projectId: string, window?: BrowserWindow | null) {
    const storage = StorageService.getInstance();
    const samplesDir = path.join(storage.getCacheDir(), 'sample_photos');
    if (!fs.existsSync(samplesDir)) {
      fs.mkdirSync(samplesDir, { recursive: true });
    }

    const samples = [
      {
        fileName: 'studio_melanin_deep_vi.jpg',
        title: 'Editorial Deep Melanin (Fitzpatrick VI)',
        bg: '#181514',
        skinGradient: ['#3B2219', '#5A3825', '#24140E'],
        accent: '#E6A15C'
      },
      {
        fileName: 'studio_warm_bronze_v.jpg',
        title: 'Golden Hour Warm Bronze (Fitzpatrick V)',
        bg: '#1E1714',
        skinGradient: ['#7A4B2A', '#A3683F', '#4A2A14'],
        accent: '#F3B46E'
      },
      {
        fileName: 'studio_rich_espresso_vi.jpg',
        title: 'Studio Beauty Rich Espresso (Fitzpatrick VI)',
        bg: '#121216',
        skinGradient: ['#2F1B12', '#452A1C', '#1D1009'],
        accent: '#D48C46'
      },
      {
        fileName: 'studio_golden_olive_iv.jpg',
        title: 'Natural Light Golden Olive (Fitzpatrick IV)',
        bg: '#1A1C1A',
        skinGradient: ['#B88456', '#D6A575', '#8C5A32'],
        accent: '#F6CE98'
      }
    ];

    const filePaths: string[] = [];

    for (const item of samples) {
      const outPath = path.join(samplesDir, item.fileName);
      if (!fs.existsSync(outPath)) {
        const svg = `
          <svg width="1200" height="1500" viewBox="0 0 1200 1500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${item.bg}"/>
                <stop offset="100%" stop-color="#0a0a0c"/>
              </linearGradient>
              <radialGradient id="rimLight" cx="80%" cy="30%" r="50%">
                <stop offset="0%" stop-color="${item.accent}" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="${item.bg}" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="portraitSkin" cx="48%" cy="42%" r="35%">
                <stop offset="0%" stop-color="${item.skinGradient[1]}"/>
                <stop offset="55%" stop-color="${item.skinGradient[0]}"/>
                <stop offset="100%" stop-color="${item.skinGradient[2]}"/>
              </radialGradient>
              <radialGradient id="specularGlow" cx="45%" cy="38%" r="18%">
                <stop offset="0%" stop-color="${item.accent}" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="${item.skinGradient[1]}" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Background & Rim Light -->
            <rect width="1200" height="1500" fill="url(#bg)"/>
            <rect width="1200" height="1500" fill="url(#rimLight)"/>

            <!-- Torso & Shoulders -->
            <path d="M 250,1500 C 260,1100 400,950 600,950 C 800,950 940,1100 950,1500 Z" fill="#1e1e24"/>

            <!-- Head / Portrait Oval -->
            <ellipse cx="600" cy="580" rx="260" ry="340" fill="url(#portraitSkin)"/>
            <!-- Cheekbone Specular Warmth -->
            <ellipse cx="560" cy="530" rx="140" ry="170" fill="url(#specularGlow)"/>

            <!-- Eyes & Features Stylized -->
            <ellipse cx="500" cy="540" rx="36" ry="16" fill="#120c08"/>
            <ellipse cx="700" cy="540" rx="36" ry="16" fill="#120c08"/>
            <circle cx="500" cy="540" r="10" fill="#2d1c10"/>
            <circle cx="700" cy="540" r="10" fill="#2d1c10"/>
            <circle cx="504" cy="538" r="3" fill="#ffffff"/>
            <circle cx="704" cy="538" r="3" fill="#ffffff"/>

            <!-- Lips -->
            <path d="M 520,720 Q 600,705 680,720 Q 600,760 520,720 Z" fill="${item.skinGradient[2]}"/>

            <!-- Text Title Overlay -->
            <rect x="40" y="1370" width="1120" height="90" rx="12" fill="#000000" fill-opacity="0.65"/>
            <text x="70" y="1415" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#E6A15C" letter-spacing="1.5">AFRO VISION PROTO AI — STUDIO SAMPLE</text>
            <text x="70" y="1445" font-family="system-ui, sans-serif" font-size="20" fill="#e0e0e0">${item.title}</text>
          </svg>
        `;

        await sharp(Buffer.from(svg))
          .jpeg({ quality: 95 })
          .toFile(outPath);
      }
      filePaths.push(outPath);
    }

    return ImportEngine.importSources(filePaths, projectId, window);
  }
}
