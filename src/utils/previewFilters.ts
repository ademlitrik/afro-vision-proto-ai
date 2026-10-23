import { EditParameters } from '../types/models';

export interface ComputedFilterStyle {
  filter: string;
  transform: string;
  vignetteStyle?: React.CSSProperties;
  tintOverlayColor?: string;
  tintOverlayOpacity?: number;
}

/**
 * Computes real-time CSS filter and transform styles from non-destructive EditParameters.
 * Enables zero-latency 60fps preview updates while dragging sliders.
 */
export function computePreviewFilterStyle(
  edits?: EditParameters | null,
  isBeforeMode: boolean = false
): ComputedFilterStyle {
  // In Before mode, return neutral unedited baseline
  if (!edits || isBeforeMode) {
    return {
      filter: 'none',
      transform: 'none'
    };
  }

  // 1. Exposure & Light
  // Exposure in EV stops: 2^EV (e.g. +1.0 EV = 200% brightness, -1.0 EV = 50% brightness)
  const exposureFactor = Math.pow(2, edits.exposure || 0);

  // Blend shadows (+open shadows) and highlights (-pull back highlights) into perceptual luminance
  const shadowLift = (edits.shadows || 0) * 0.0025;
  const highlightPull = -(edits.highlights || 0) * 0.002;
  const whitesBoost = (edits.whites || 0) * 0.002;
  const blacksPull = -(edits.blacks || 0) * 0.002;

  const totalBrightness = Math.max(0.1, Math.min(4.0, exposureFactor + shadowLift + highlightPull + whitesBoost + blacksPull));

  // 2. Contrast
  const contrastFactor = Math.max(0.2, Math.min(3.0, 1.0 + (edits.contrast || 0) / 100));

  // 3. Saturation & Vibrance
  const satDelta = (edits.saturation || 0) / 100;
  const vibDelta = (edits.vibrance || 0) / 100 * 0.65;
  const totalSaturation = Math.max(0, Math.min(3.0, 1.0 + satDelta + vibDelta));

  // 4. Clarity & Dehaze (mapped to midtone contrast & edge punch)
  const clarityBonus = (edits.clarity || 0) * 0.0015;
  const dehazeBonus = (edits.dehaze || 0) * 0.002;
  const finalContrast = Math.max(0.2, contrastFactor + clarityBonus + dehazeBonus);

  // 5. Sepia / Temperature & Tint Hue Rotation
  const temp = edits.temperature || 0;
  const tint = edits.tint || 0;

  let tintOverlayColor: string | undefined;
  let tintOverlayOpacity: number | undefined;

  if (Math.abs(temp) > 1 || Math.abs(tint) > 1) {
    // Generate blend color for accurate color temperature rendering
    if (temp > 0) {
      // Warm amber
      tintOverlayColor = '#ffaa33';
      tintOverlayOpacity = Math.min(0.35, (temp / 100) * 0.35);
    } else if (temp < 0) {
      // Cool blue
      tintOverlayColor = '#3388ff';
      tintOverlayOpacity = Math.min(0.35, (Math.abs(temp) / 100) * 0.35);
    }

    if (tint !== 0 && !tintOverlayColor) {
      if (tint > 0) {
        tintOverlayColor = '#ee33bb'; // magenta
        tintOverlayOpacity = Math.min(0.25, (tint / 100) * 0.25);
      } else {
        tintOverlayColor = '#33dd55'; // green
        tintOverlayOpacity = Math.min(0.25, (Math.abs(tint) / 100) * 0.25);
      }
    }
  }

  // 6. Transform: Rotate, Flip H, Flip V
  const rotateDeg = edits.rotate || 0;
  const scaleX = edits.flip_h === 1 ? -1 : 1;
  const scaleY = edits.flip_v === 1 ? -1 : 1;

  const transform = `rotate(${rotateDeg}deg) scale(${scaleX}, ${scaleY})`;
  const filter = `brightness(${totalBrightness.toFixed(3)}) contrast(${finalContrast.toFixed(3)}) saturate(${totalSaturation.toFixed(3)})`;

  // 7. Vignette
  let vignetteStyle: React.CSSProperties | undefined;
  const vignette = edits.vignette || 0;
  if (vignette !== 0) {
    const isDark = vignette < 0;
    const opacity = Math.min(0.85, (Math.abs(vignette) / 100) * 0.85);
    const color = isDark ? '0, 0, 0' : '255, 255, 255';
    vignetteStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      background: `radial-gradient(ellipse at center, transparent 40%, rgba(${color}, ${opacity.toFixed(2)}) 100%)`
    };
  }

  return {
    filter,
    transform,
    vignetteStyle,
    tintOverlayColor,
    tintOverlayOpacity
  };
}
