export type FlagType = 'pick' | 'unflagged' | 'reject';

export type LibraryFilterType = 
  | 'all' 
  | 'picks' 
  | 'rejects' 
  | 'unflagged' 
  | 'favorites' 
  | 'rated'
  | 'edited'
  | 'needs_review'
  | 'recent_imports';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
  is_active: number;
}

export interface Photo {
  id: string;
  project_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_format: string;
  file_hash: string | null;
  width: number;
  height: number;
  thumbnail_path: string | null;
  preview_path: string | null;
  rating: number;
  flag: FlagType;
  is_favorite: number;
  is_edited?: number;
  has_ai_analysis?: number;
  import_date: number;
  created_at: number;
  updated_at: number;
}

export interface PhotoMetadata {
  photo_id: string;
  camera_make: string | null;
  camera_model: string | null;
  lens_model: string | null;
  focal_length: number | null;
  iso: number | null;
  aperture: number | null;
  shutter_speed: string | null;
  exposure_bias: number | null;
  white_balance: string | null;
  color_space: string | null;
  date_taken: number | null;
  raw_exif_json: string | null;
}

export interface EditParameters {
  photo_id: string;
  version: number;
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  vibrance: number;
  saturation: number;
  texture: number;
  clarity: number;
  dehaze: number;
  sharpening: number;
  noise_reduction: number;
  lens_profile_enabled: number;
  chromatic_aberration: number;
  distortion: number;
  vignette: number;
  crop_x: number;
  crop_y: number;
  crop_w: number;
  crop_h: number;
  rotate: number;
  flip_h: number;
  flip_v: number;
  skin_protection_enabled: number;
  updated_at: number;
}

export interface MetricResult<T = number> {
  value: T;
  confidence: number;
  reason: string;
  warnings: string[];
}

export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
  l: number[];
}

export interface MeasuredAnalysis {
  luminanceMedian: number;
  luminanceMean: number;
  luminanceStdDev: number;
  highlightClippingPct: number;
  shadowClippingPct: number;
  dynamicRangeEV: number;
  contrastRatio: number;
  p1: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  estimatedColorTempK: number;
  estimatedTint: number;
  redMean: number;
  greenMean: number;
  blueMean: number;
  meanSaturation: number;
  maxSaturation: number;
  sharpnessScore: number;
  noiseScore: number;
  clarityEstimate: number;
  dehazeEstimate: number;
  histogram: HistogramData;
}

export interface AIRecommendations {
  exposure: MetricResult;
  contrast: MetricResult;
  highlights: MetricResult;
  shadows: MetricResult;
  whites: MetricResult;
  blacks: MetricResult;
  temperature: MetricResult;
  tint: MetricResult;
  vibrance: MetricResult;
  saturation: MetricResult;
  clarity: MetricResult;
  texture: MetricResult;
  sharpening: MetricResult;
  noiseReduction: MetricResult;
  dehaze: MetricResult;
}

export type MelaninSpectrum = 'deep' | 'dark' | 'medium' | 'olive' | 'warm' | 'light';

export interface SkinProtectionConstraints {
  maxSafeExposureEV: number;
  minSafeExposureEV: number;
  maxSafeClarity: number;
  maxSafeSaturation: number;
  maxSafeHighlights: number;
  minSafeShadows: number;
  recommendedVibranceBias: number;
  tempCorrectionDamping: number;
  ashyUndertoneProtection: boolean;
}

export interface SkinToneAnalysis {
  detected: boolean;
  skinPixelPercentage: number;
  dominantSpectrum: MelaninSpectrum | 'none';
  detectedSpectra: MelaninSpectrum[];
  meanLuminance: number;
  meanHue: number;
  meanSaturation: number;
  skinHighlightClippingPct: number;
  ashyRiskScore: number;
  undertoneTendency: 'neutral' | 'warm' | 'cool-ashy' | 'golden' | 'red';
  constraints: SkinProtectionConstraints;
}

export interface ImageAnalysisResult {
  photoId: string;
  version: string;
  analyzedAt: number;
  measured: MeasuredAnalysis;
  skin?: SkinToneAnalysis;
  recommendations: AIRecommendations;
  warnings: string[];
}

export interface SystemInfo {
  appName: string;
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  cpuCount: number;
  totalMemoryGb: number;
}

export interface LibraryCounts {
  all: number;
  picks: number;
  rejects: number;
  unflagged: number;
  favorites: number;
  rated: number;
  edited: number;
  needs_review: number;
  recent_imports: number;
}

export interface WorkerStatus {
  poolSize: number;
  activeWorkers: number;
  queueLength: number;
}

export interface ImportProgressEvent {
  jobId: string;
  total: number;
  current: number;
  percentage: number;
  currentFileName: string;
  importedCount: number;
  duplicateCount: number;
  failedCount: number;
  status: 'scanning' | 'processing' | 'completed' | 'cancelled' | 'failed';
}

export interface ImportFailure {
  filePath: string;
  fileName: string;
  reason: string;
}

export interface ImportResult {
  jobId: string;
  totalFound: number;
  importedCount: number;
  duplicateCount: number;
  failedCount: number;
  failures: ImportFailure[];
  cancelled: boolean;
}

export interface CacheStats {
  thumbnailCount: number;
  previewCount: number;
  totalSizeBytes: number;
}

export interface Preset {
  id: string;
  name: string;
  category: string;
  is_built_in: number;
  parameters_json: string;
  created_at: number;
  updated_at: number;
  parameters?: Partial<EditParameters>;
}
