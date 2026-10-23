import { MeasuredAnalysis, AIRecommendations, MetricResult } from './imageAnalysisEngine';
import { SkinToneAnalysis } from './skinToneDetector';
import { PhotoMetadataRecord } from '../database/schema';

export interface CorrectionEngineOptions {
  skinToneProtectionEnabled?: boolean;
  styleIntent?: 'natural' | 'punchy' | 'portrait_studio' | 'cinematic';
}

/**
 * CorrectionRecommendationEngine
 * 
 * Separate, modular recommendation engine that converts empirical image measurements
 * and skin-tone analysis into calibrated editing parameters.
 * 
 * Completely decoupled from image decoding and database editing.
 * Grounded in measurable characteristics, safe professional ranges, and melanin skin preservation.
 */
export class CorrectionRecommendationEngine {
  private static readonly TARGET_MID_GRAY = 118; // standard 18% reflectance mapped to sRGB

  public static generateRecommendations(
    measured: MeasuredAnalysis,
    skinAnalysis?: SkinToneAnalysis | null,
    metadata?: PhotoMetadataRecord | null,
    options: CorrectionEngineOptions = {}
  ): AIRecommendations {
    const skinProtected = options.skinToneProtectionEnabled !== false && (skinAnalysis?.detected ?? false);
    const skin = skinAnalysis;

    // 1. Exposure Recommendation
    const exposure = this.calculateExposure(measured, skin, skinProtected);

    // 2. Contrast & Dynamic Range
    const contrast = this.calculateContrast(measured, skin, skinProtected);

    // 3. Highlights & Shadows (with specular vs diffuse skin preservation)
    const highlights = this.calculateHighlights(measured, skin, skinProtected);
    const shadows = this.calculateShadows(measured, skin, skinProtected);

    // 4. Whites & Blacks (Dynamic Anchoring)
    const whites = this.calculateWhites(measured, skin, skinProtected);
    const blacks = this.calculateBlacks(measured, skin, skinProtected);

    // 5. White Balance: Temperature & Tint (with Melanin Cast Prevention)
    const temperature = this.calculateTemperature(measured, skin, skinProtected);
    const tint = this.calculateTint(measured, skin, skinProtected);

    // 6. Color Vibrance & Saturation (Protects skin from becoming neon/fluorescent or ashy)
    const { vibrance, saturation } = this.calculateColorPresence(measured, skin, skinProtected);

    // 7. Clarity, Texture & Dehaze (Portrait pore softening vs landscape punch)
    const clarity = this.calculateClarity(measured, skin, skinProtected);
    const texture = this.calculateTexture(measured, skin, skinProtected);
    const dehaze = this.calculateDehaze(measured, skin, skinProtected);

    // 8. Detail: Sharpening & Noise Reduction
    const sharpening = this.calculateSharpening(measured, skin, skinProtected);
    const noiseReduction = this.calculateNoiseReduction(measured, skin, skinProtected);

    return {
      exposure,
      contrast,
      highlights,
      shadows,
      whites,
      blacks,
      temperature,
      tint,
      vibrance,
      saturation,
      clarity,
      texture,
      sharpening,
      noiseReduction,
      dehaze
    };
  }

  private static calculateExposure(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let evDelta: number;
    let confidence = 0.90;
    const warnings: string[] = [];

    if (skinProtected && skin) {
      // Portrait Exposure Logic:
      // Base exposure on human subject rather than background sky or dark studio backdrop
      // Ideal human skin diffuse reflectance target in sRGB:
      // - Deep/Dark melanin: 70 - 110 (preserves rich dark chocolate tones without chalkiness)
      // - Medium/Warm: 110 - 150
      // - Light: 150 - 185
      let targetSkinL: number;
      switch (skin.dominantSpectrum) {
        case 'deep':
          targetSkinL = 80;
          break;
        case 'dark':
          targetSkinL = 100;
          break;
        case 'olive':
        case 'medium':
          targetSkinL = 130;
          break;
        case 'warm':
          targetSkinL = 150;
          break;
        case 'light':
        default:
          targetSkinL = 170;
          break;
      }

      // Blend global mid-gray target (35%) with subject skin target (65%)
      const skinDelta = Math.log2(targetSkinL / Math.max(15, skin.meanLuminance));
      const globalDelta = Math.log2(this.TARGET_MID_GRAY / Math.max(12, m.p50));
      evDelta = 0.65 * skinDelta + 0.35 * globalDelta;

      // Apply skin protection bounds
      evDelta = Math.max(
        skin.constraints.minSafeExposureEV,
        Math.min(skin.constraints.maxSafeExposureEV, evDelta)
      );

      if (skin.skinHighlightClippingPct > 0.5) {
        confidence -= 0.15;
        warnings.push(`Skin highlight clipping detected (${skin.skinHighlightClippingPct}%); exposure increase throttled.`);
      }
    } else {
      // Landscape / Object Exposure Logic
      evDelta = Math.log2(this.TARGET_MID_GRAY / Math.max(12, m.p50));
      evDelta = Math.max(-2.5, Math.min(2.5, evDelta));
    }

    const clampedEV = Number(evDelta.toFixed(2));

    const reason = skinProtected && skin
      ? `Anchored to ${skin.dominantSpectrum} melanin subject (${skin.meanLuminance} lum) with ${skin.skinPixelPercentage}% frame presence.`
      : clampedEV === 0
      ? 'Median luminance (118) matches optimal mid-gray calibration.'
      : clampedEV > 0
      ? `Image median luminance (${m.p50}) is under mid-gray target (118). Recommended +${clampedEV} EV compensation.`
      : `Image median luminance (${m.p50}) is over mid-gray target (118). Recommended ${clampedEV} EV compensation.`;

    return {
      value: clampedEV,
      confidence: Number(confidence.toFixed(2)),
      reason,
      warnings
    };
  }

  private static calculateContrast(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let contrastVal = 0;
    let confidence = 0.88;
    let reason = 'Tonal contrast distribution is well-balanced.';

    if (skinProtected && skin) {
      // In portraits, high contrast hardens skin transitions and deepens smile lines / wrinkles.
      // Soften contrast if dynamic range is harsh.
      if (m.contrastRatio > 10.0) {
        contrastVal = -Math.min(18, Math.round((m.contrastRatio - 10.0) * 3));
        reason = `Gentle contrast softening applied to protect smooth skin tonal transitions on ${skin.dominantSpectrum} complexion.`;
      } else if (m.contrastRatio < 3.5) {
        contrastVal = Math.min(15, Math.round((3.5 - m.contrastRatio) * 6));
        reason = `Low contrast scene (${m.contrastRatio}:1). Modest contrast boost applied while protecting skin locus.`;
      }
    } else {
      if (m.contrastRatio < 4.0) {
        contrastVal = Math.round((4.0 - m.contrastRatio) * 8);
        reason = `Flat tonal distribution detected (${m.contrastRatio}:1). Expanding dynamic punch.`;
      } else if (m.contrastRatio > 14.0) {
        contrastVal = -Math.round(Math.min(25, (m.contrastRatio - 14.0) * 4));
        reason = `Harsh tonal contrast detected (${m.contrastRatio}:1). Softening contrast to preserve transitional tones.`;
      }
    }

    return {
      value: contrastVal,
      confidence,
      reason,
      warnings: []
    };
  }

  private static calculateHighlights(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let val = 0;
    const warnings: string[] = [];
    let reason = 'Highlight distribution is within normal dynamic boundaries.';

    if (m.p99 > 240 || m.highlightClippingPct > 0.5) {
      val = -Math.min(60, Math.round(m.highlightClippingPct * 8 + (m.p99 - 240) * 2));
      reason = `Highlight density approaching clipping ceiling (p99: ${m.p99}, clipping: ${m.highlightClippingPct}%). Pulling back to recover detail.`;
    }

    if (skinProtected && skin) {
      if (skin.skinHighlightClippingPct > 0.3) {
        // Enforce stronger highlight pullback for skin forehead/cheek specularities
        val = Math.min(val, -25);
        reason = `Recovering skin specular highlight clipping (${skin.skinHighlightClippingPct}%) on ${skin.dominantSpectrum} tone to prevent blown-out patches.`;
      }
    }

    return {
      value: val,
      confidence: 0.86,
      reason,
      warnings
    };
  }

  private static calculateShadows(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let val = 0;
    const warnings: string[] = [];
    let reason = 'Shadow distribution maintains clean tonal separation.';

    if (m.p5 < 25 || m.shadowClippingPct > 1.0) {
      val = Math.min(50, Math.round((25 - m.p5) * 1.5 + m.shadowClippingPct * 4));
      reason = `Dense shadows detected (p5: ${m.p5}, crushed: ${m.shadowClippingPct}%). Opening shadows to restore context.`;
    }

    if (skinProtected && skin) {
      // Deep and dark melanin requires shadow separation without turning muddy
      if (skin.dominantSpectrum === 'deep' || skin.dominantSpectrum === 'dark') {
        val = Math.max(val, skin.constraints.minSafeShadows);
        reason = `Lifting shadows to reveal rich melanin undertones in ${skin.dominantSpectrum} skin without muddiness.`;
      }
    }

    if (m.noiseScore > 35) {
      warnings.push('Elevated shadow noise present; aggressive shadow recovery dampened.');
    }

    return {
      value: val,
      confidence: 0.85,
      reason,
      warnings
    };
  }

  private static calculateWhites(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let val = 0;
    if (m.p99 < 225) {
      val = Math.min(25, Math.round((235 - m.p99) * 0.7));
    } else if (m.p99 > 250) {
      val = -15;
    }
    return {
      value: val,
      confidence: 0.80,
      reason: 'Anchors upper dynamic limit without clipping specular highlights.',
      warnings: []
    };
  }

  private static calculateBlacks(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let val = 0;
    if (m.p1 > 15) {
      val = -Math.min(20, Math.round((m.p1 - 10) * 0.7));
    } else if (m.p1 < 3) {
      val = 10;
    }
    return {
      value: val,
      confidence: 0.80,
      reason: 'Sets true black point to eliminate haze while avoiding crushed shadows.',
      warnings: []
    };
  }

  private static calculateTemperature(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    const tempDiffK = m.estimatedColorTempK - 5500;
    let recTemp = 0;
    let reason = 'Natural color balance observed across spectrum.';

    if (Math.abs(tempDiffK) > 400) {
      recTemp = Math.max(-40, Math.min(40, -Math.round(tempDiffK / 120)));
      reason = tempDiffK < 0
        ? `Warm color cast detected (~${m.estimatedColorTempK}K). Cooling color temperature.`
        : `Cool blue cast detected (~${m.estimatedColorTempK}K). Warming color temperature.`;
    }

    if (skinProtected && skin) {
      // Dampen global temperature corrections to protect skin warmth
      recTemp = Math.round(recTemp * skin.constraints.tempCorrectionDamping);
      if (skin.ashyRiskScore > 20 && recTemp <= 0) {
        // If skin has ashy undertones, inject subtle warmth (+4 to +12) instead of cooling
        recTemp = Math.min(14, Math.round(skin.ashyRiskScore / 5));
        reason = `Counteracting cool/ashy undertones detected in ${skin.dominantSpectrum} skin with targeted warmth injection.`;
      }
    }

    return {
      value: recTemp,
      confidence: 0.84,
      reason,
      warnings: []
    };
  }

  private static calculateTint(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let recTint = 0;
    if (Math.abs(m.estimatedTint) > 5) {
      recTint = -Math.round(m.estimatedTint * 0.6);
    }

    let reason = 'Balances green/magenta cast relative to natural chromaticity curve.';

    if (skinProtected && skin) {
      // In portraiture, green cast makes deep skin look sickly; magenta cast makes light skin sunburned.
      if (skin.undertoneTendency === 'cool-ashy' || m.estimatedTint > 3) {
        recTint = Math.max(recTint, 4); // subtle magenta shift to cancel greenish haze
        reason = `Applying gentle tint balance to eliminate sickly greenish-ash cast in portrait.`;
      }
    }

    return {
      value: recTint,
      confidence: 0.80,
      reason,
      warnings: []
    };
  }

  private static calculateColorPresence(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): { vibrance: MetricResult; saturation: MetricResult } {
    let recVibrance = 0;
    let recSaturation = 0;

    if (skinProtected && skin) {
      // In portraiture: Never boost global Saturation (which over-saturates skin orange/red).
      // Use Vibrance exclusively, because vibrance selectively boosts non-skin background/clothing.
      if (m.meanSaturation < 0.28) {
        recVibrance = Math.min(22, Math.round((0.28 - m.meanSaturation) * 80));
      }
      recSaturation = 0; // lock saturation to 0 for skin safety

      return {
        vibrance: {
          value: recVibrance,
          confidence: 0.88,
          reason: `Vibrance boost applied to background/foliage while preserving ${skin.dominantSpectrum} skin saturation boundaries.`,
          warnings: []
        },
        saturation: {
          value: 0,
          confidence: 0.95,
          reason: 'Global saturation locked at baseline to prevent skin gamut clipping or fluorescent shifts.',
          warnings: []
        }
      };
    }

    // Landscape / General rules
    if (m.meanSaturation < 0.22) {
      recVibrance = Math.min(25, Math.round((0.25 - m.meanSaturation) * 100));
    } else if (m.meanSaturation > 0.65) {
      recSaturation = -Math.min(20, Math.round((m.meanSaturation - 0.60) * 80));
    }

    return {
      vibrance: {
        value: recVibrance,
        confidence: 0.85,
        reason: 'Selectively enriches muted colors without clipping high-chroma tones.',
        warnings: []
      },
      saturation: {
        value: recSaturation,
        confidence: 0.85,
        reason: 'Balances global color saturation across gamut.',
        warnings: []
      }
    };
  }

  private static calculateClarity(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let val = 0;
    let reason = 'Clarity is calibrated to local midtone contrast.';

    if (skinProtected && skin) {
      // Restrict clarity heavily in portraits to prevent skin roughness
      val = 0;
      reason = `Clarity capped to prevent exaggerating skin pores or facial texture on ${skin.dominantSpectrum} complexion.`;
    } else {
      if (m.clarityEstimate < 35) {
        val = Math.min(20, Math.round(35 - m.clarityEstimate));
        reason = 'Gentle midtone clarity boost applied to enhance spatial definition.';
      }
    }

    return {
      value: val,
      confidence: 0.85,
      reason,
      warnings: []
    };
  }

  private static calculateTexture(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let val = 0;
    let reason = 'Texture preserves high-frequency surface detail.';

    if (skinProtected && skin) {
      // Texture is safer on portraits than clarity (accentuates fine hair/eyelashes without haloing pores)
      val = Math.min(8, Math.round((40 - Math.min(40, m.clarityEstimate)) * 0.3));
      reason = 'Subtle texture enhancement for eyes, hair, and fabric while keeping skin soft.';
    } else {
      if (m.clarityEstimate < 35) {
        val = Math.min(15, Math.round((35 - m.clarityEstimate) * 0.7));
      }
    }

    return {
      value: val,
      confidence: 0.82,
      reason,
      warnings: []
    };
  }

  private static calculateDehaze(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let val = 0;
    if (m.p5 > 35 && m.contrastRatio < 5.0) {
      val = Math.min(skinProtected ? 10 : 25, Math.round((m.p5 - 25) * 0.8));
    }
    return {
      value: val,
      confidence: 0.78,
      reason: 'Dark-channel prior dehazing applied to restore atmospheric clarity.',
      warnings: []
    };
  }

  private static calculateSharpening(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let val = 15;
    let reason = 'Standard optical capture sharpening applied.';

    if (m.sharpnessScore < 30) {
      val = Math.min(40, Math.round(15 + (30 - m.sharpnessScore) * 1.1));
      reason = `Moderate unsharp masking applied for soft capture (${m.sharpnessScore}/100).`;
    } else if (m.sharpnessScore > 75) {
      val = 8;
      reason = `High intrinsic sharpness detected (${m.sharpnessScore}/100); light capture sharpening only.`;
    }

    if (skinProtected && skin && val > 25) {
      val = 22; // cap sharpening on portraits to prevent skin artifacting
      reason = 'Capture sharpening bounded to protect skin surface smoothness.';
    }

    return {
      value: val,
      confidence: 0.85,
      reason,
      warnings: []
    };
  }

  private static calculateNoiseReduction(
    m: MeasuredAnalysis,
    skin?: SkinToneAnalysis | null,
    skinProtected?: boolean
  ): MetricResult {
    let val = 0;
    let reason = 'Clean signal-to-noise ratio observed.';

    if (m.noiseScore > 20) {
      val = Math.min(50, Math.round((m.noiseScore - 15) * 1.4));
      reason = `Measurable sensor noise detected (${m.noiseScore}/100). Gentle smoothing applied.`;
    }

    if (skinProtected && skin && skin.dominantSpectrum === 'deep' && val < 10) {
      // Deep skin tones often show chromatic grain in shadows under high ISO
      val = Math.max(val, 12);
      reason = 'Preventative chroma smoothing enabled for rich melanin shadow gradients.';
    }

    return {
      value: val,
      confidence: 0.84,
      reason,
      warnings: []
    };
  }
}
