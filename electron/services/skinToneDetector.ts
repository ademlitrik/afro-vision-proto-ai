export type MelaninSpectrum = 'deep' | 'dark' | 'medium' | 'olive' | 'warm' | 'light';

export interface SkinProtectionConstraints {
  maxSafeExposureEV: number;
  minSafeExposureEV: number;
  maxSafeClarity: number;
  maxSafeSaturation: number;
  maxSafeHighlights: number;
  minSafeShadows: number;
  recommendedVibranceBias: number; // preference for vibrance over global saturation
  tempCorrectionDamping: number;   // damp global temperature to preserve skin warmth
  ashyUndertoneProtection: boolean;
}

export interface SkinToneAnalysis {
  detected: boolean;
  skinPixelPercentage: number;
  dominantSpectrum: MelaninSpectrum | 'none';
  detectedSpectra: MelaninSpectrum[];
  meanLuminance: number;     // 0-255
  meanHue: number;           // 0-360 degrees
  meanSaturation: number;    // 0-1.0
  skinHighlightClippingPct: number;
  ashyRiskScore: number;     // 0-100: detects excessive blue/gray in skin shadows
  undertoneTendency: 'neutral' | 'warm' | 'cool-ashy' | 'golden' | 'red';
  constraints: SkinProtectionConstraints;
}

/**
 * SkinToneDetector
 * 
 * Multi-ethnic, melanin-inclusive skin locus analysis.
 * Analyzes raw RGB pixel data across the full spectrum:
 * Fitzpatrick I through VI (light, warm, olive, medium, dark, and deep melanin).
 * 
 * Never simulates or hardcodes values.
 */
export class SkinToneDetector {
  /**
   * Analyzes an interleaved raw RGB buffer for skin-tone distribution and protection metrics.
   * @param rgbData Interleaved RGB buffer [R, G, B, R, G, B, ...]
   * @param width Image width in pixels
   * @param height Image height in pixels
   */
  public static analyze(rgbData: Buffer | Uint8Array, width: number, height: number): SkinToneAnalysis {
    const totalPixels = width * height;
    if (totalPixels === 0) {
      return this.emptyResult();
    }

    let skinPixelCount = 0;
    let skinSumL = 0;
    let skinSumH = 0;
    let skinSumS = 0;
    let skinClippedHighlights = 0;

    // Track spectrum counts
    const spectrumCounts: Record<MelaninSpectrum, number> = {
      deep: 0,
      dark: 0,
      medium: 0,
      olive: 0,
      warm: 0,
      light: 0
    };

    let ashyPixels = 0; // skin pixels where Blue is disproportionately elevated relative to Red/Green

    // Step across pixels (sample every 2 pixels for performance while retaining statistical fidelity)
    const step = 2;
    let sampledPixels = 0;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 3;
        sampledPixels++;

        const r = rgbData[i];
        const g = rgbData[i + 1];
        const b = rgbData[i + 2];

        // 1. Biological skin color physics:
        // Melanin absorbs light with an exponential decay toward the red spectrum.
        // Therefore, for human skin of any race: R > G and R > B, except in extreme specular highlights.
        if (r <= g || r <= b) {
          continue;
        }

        // 2. YCbCr Transformation
        // Y  = 0.299*R + 0.587*G + 0.114*B
        // Cb = 128 - 0.168736*R - 0.331264*G + 0.5*B
        // Cr = 128 + 0.5*R - 0.418688*G - 0.081312*B
        const Y = 0.299 * r + 0.587 * g + 0.114 * b;
        const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

        // 3. Multi-Spectrum Melanin Boundaries in YCbCr
        // Standard multi-ethnic skin locus: Cb in [77, 133], Cr in [130, 178]
        const inSkinLocus = (Cb >= 77 && Cb <= 133 && Cr >= 130 && Cr <= 178);

        if (!inSkinLocus) {
          continue;
        }

        // 4. HSV computation for hue angle and saturation verification
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        let hue = 0;
        if (delta > 0) {
          if (max === r) {
            hue = 60 * (((g - b) / delta) % 6);
          } else if (max === g) {
            hue = 60 * ((b - r) / delta + 2);
          } else {
            hue = 60 * ((r - g) / delta + 4);
          }
          if (hue < 0) hue += 360;
        }
        const sat = max > 0 ? delta / max : 0;

        // Human melanin hue is strictly centered between 0° and 52°
        if (hue > 52 && hue < 345) {
          continue;
        }
        // Exclude completely desaturated grays
        if (sat < 0.12 && Y < 220) {
          continue;
        }

        skinPixelCount++;
        skinSumL += Y;
        skinSumH += hue >= 345 ? hue - 360 : hue; // normalize around 0°
        skinSumS += sat;

        // Highlight clipping in skin: diffuse vs specular blowout
        if (r >= 250 && g >= 245) {
          skinClippedHighlights++;
        }

        // Ashy / chalky undertone check:
        // Natural melanin has G/B ratio > 1.2. If B rises closer to G (G - B < 8) in dark/medium skin,
        // it reflects uncalibrated camera profile or cool light creating ashy skin.
        if (Y < 140 && (g - b) < 10 && b > 25) {
          ashyPixels++;
        }

        // Classify Melanin Spectrum
        if (Y < 65) {
          spectrumCounts.deep++;
        } else if (Y < 105) {
          spectrumCounts.dark++;
        } else if (Y < 145) {
          if (Cr - Cb < 20) {
            spectrumCounts.olive++;
          } else {
            spectrumCounts.medium++;
          }
        } else if (Y < 180) {
          spectrumCounts.warm++;
        } else {
          spectrumCounts.light++;
        }
      }
    }

    const skinPct = Number(((skinPixelCount / sampledPixels) * 100).toFixed(2));
    // Require at least 2.5% of pixels to classify as skin-present portrait
    const detected = skinPct >= 2.5;

    if (!detected || skinPixelCount === 0) {
      return this.emptyResult();
    }

    const meanL = Number((skinSumL / skinPixelCount).toFixed(1));
    let meanH = skinSumH / skinPixelCount;
    if (meanH < 0) meanH += 360;
    meanH = Number(meanH.toFixed(1));
    const meanS = Number((skinSumS / skinPixelCount).toFixed(3));
    const skinHighlightClippingPct = Number(((skinClippedHighlights / skinPixelCount) * 100).toFixed(2));
    const ashyRiskScore = Math.min(100, Math.round((ashyPixels / skinPixelCount) * 150));

    // Determine dominant spectrum
    let dominantSpectrum: MelaninSpectrum = 'medium';
    let maxCount = -1;
    const detectedSpectra: MelaninSpectrum[] = [];

    for (const [spectrum, count] of Object.entries(spectrumCounts)) {
      if (count > 0) {
        detectedSpectra.push(spectrum as MelaninSpectrum);
      }
      if (count > maxCount) {
        maxCount = count;
        dominantSpectrum = spectrum as MelaninSpectrum;
      }
    }

    // Determine undertone
    let undertone: 'neutral' | 'warm' | 'cool-ashy' | 'golden' | 'red' = 'neutral';
    if (ashyRiskScore > 25) {
      undertone = 'cool-ashy';
    } else if (meanH > 28) {
      undertone = 'golden';
    } else if (meanH < 14) {
      undertone = 'red';
    } else if (meanH >= 14 && meanH <= 28) {
      undertone = 'warm';
    }

    // Determine protective constraints
    const constraints: SkinProtectionConstraints = this.calculateConstraints(
      dominantSpectrum,
      meanL,
      skinHighlightClippingPct,
      ashyRiskScore
    );

    return {
      detected: true,
      skinPixelPercentage: skinPct,
      dominantSpectrum,
      detectedSpectra,
      meanLuminance: meanL,
      meanHue: meanH,
      meanSaturation: meanS,
      skinHighlightClippingPct,
      ashyRiskScore,
      undertoneTendency: undertone,
      constraints
    };
  }

  private static calculateConstraints(
    spectrum: MelaninSpectrum,
    meanL: number,
    clipPct: number,
    ashyScore: number
  ): SkinProtectionConstraints {
    // Default safe portrait boundaries
    let maxSafeExposureEV = 1.2;
    let minSafeExposureEV = -1.5;
    let maxSafeClarity = 12; // never allow aggressive clarity on portraits (exaggerates pores)
    let maxSafeSaturation = 15;
    let maxSafeHighlights = -10;
    let minSafeShadows = 5;
    const recommendedVibranceBias = 2.5; // 2.5x preference for vibrance over saturation
    let tempCorrectionDamping = 0.65;   // damp global temp corrections by 35% to protect natural skin locus
    const ashyUndertoneProtection = ashyScore > 20;

    // Specific protection for deep & dark melanin tones:
    // 1. Prevent shadow crushing from turning rich skin muddy.
    // 2. Prevent highlight clipping on cheek/forehead bones.
    // 3. Counteract ashy/gray undertones without turning skin orange.
    if (spectrum === 'deep' || spectrum === 'dark') {
      minSafeShadows = 15; // enforce gentle shadow lifting for deep skin separation
      maxSafeClarity = 8;  // extra gentle clarity to prevent ashy edge grain
      maxSafeExposureEV = clipPct > 0.5 ? 0.6 : 1.4;
      maxSafeSaturation = 10; // prevent fluorescent yellow/red cast
      tempCorrectionDamping = 0.50; // preserve rich natural warmth
    } else if (spectrum === 'light') {
      maxSafeExposureEV = clipPct > 1.0 ? 0.4 : 1.0;
      maxSafeHighlights = -20; // pull back highlights to retain skin texture on fair complexions
    }

    return {
      maxSafeExposureEV,
      minSafeExposureEV,
      maxSafeClarity,
      maxSafeSaturation,
      maxSafeHighlights,
      minSafeShadows,
      recommendedVibranceBias,
      tempCorrectionDamping,
      ashyUndertoneProtection
    };
  }

  private static emptyResult(): SkinToneAnalysis {
    return {
      detected: false,
      skinPixelPercentage: 0,
      dominantSpectrum: 'none',
      detectedSpectra: [],
      meanLuminance: 0,
      meanHue: 0,
      meanSaturation: 0,
      skinHighlightClippingPct: 0,
      ashyRiskScore: 0,
      undertoneTendency: 'neutral',
      constraints: {
        maxSafeExposureEV: 2.5,
        minSafeExposureEV: -2.5,
        maxSafeClarity: 50,
        maxSafeSaturation: 50,
        maxSafeHighlights: 0,
        minSafeShadows: 0,
        recommendedVibranceBias: 1.0,
        tempCorrectionDamping: 1.0,
        ashyUndertoneProtection: false
      }
    };
  }
}
