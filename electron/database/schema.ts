export interface ProjectRecord {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
  is_active: number;
}

export interface PhotoRecord {
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
  flag: 'pick' | 'unflagged' | 'reject';
  is_favorite: number;
  import_date: number;
  created_at: number;
  updated_at: number;
}

export interface PhotoMetadataRecord {
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

export interface EditRecord {
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

export interface AIAnalysisRecord {
  id: string;
  photo_id: string;
  analysis_version: string;
  analyzed_at: number;
  exposure_value: number;
  exposure_confidence: number;
  luminance_median: number;
  contrast_ratio: number;
  dynamic_range_ev: number;
  highlight_clipping_pct: number;
  shadow_clipping_pct: number;
  estimated_color_temp_k: number;
  estimated_tint: number;
  skin_detected: number;
  skin_regions_json: string | null;
  sharpness_score: number;
  noise_score: number;
  measured_analysis_json: string;
  ai_recommendations_json: string;
  warnings_json: string | null;
}
