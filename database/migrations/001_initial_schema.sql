-- AFRO VISION PROTO AI: Schema Definition Migration 001
-- Strict SQLite database schema with foreign keys and WAL mode

PRAGMA foreign_keys = ON;

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0
);

-- Photos Catalog
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_format TEXT NOT NULL,
  file_hash TEXT,
  width INTEGER NOT NULL DEFAULT 0,
  height INTEGER NOT NULL DEFAULT 0,
  thumbnail_path TEXT,
  preview_path TEXT,
  rating INTEGER NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  flag TEXT NOT NULL DEFAULT 'unflagged' CHECK (flag IN ('pick', 'unflagged', 'reject')),
  is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
  import_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_project_id ON photos(project_id);
CREATE INDEX IF NOT EXISTS idx_photos_rating ON photos(rating);
CREATE INDEX IF NOT EXISTS idx_photos_flag ON photos(flag);
CREATE INDEX IF NOT EXISTS idx_photos_favorite ON photos(is_favorite);

-- Metadata (EXIF / Lens / Sensor)
CREATE TABLE IF NOT EXISTS photo_metadata (
  photo_id TEXT PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
  camera_make TEXT,
  camera_model TEXT,
  lens_model TEXT,
  focal_length REAL,
  iso INTEGER,
  aperture REAL,
  shutter_speed TEXT,
  exposure_bias REAL,
  white_balance TEXT,
  color_space TEXT,
  date_taken INTEGER,
  raw_exif_json TEXT
);

-- AI Analyses (Deterministically Grounded Pixel Metrics)
CREATE TABLE IF NOT EXISTS ai_analyses (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  analysis_version TEXT NOT NULL,
  analyzed_at INTEGER NOT NULL,
  exposure_value REAL,
  exposure_confidence REAL,
  luminance_median REAL,
  contrast_ratio REAL,
  dynamic_range_ev REAL,
  highlight_clipping_pct REAL,
  shadow_clipping_pct REAL,
  estimated_color_temp_k REAL,
  estimated_tint REAL,
  skin_detected INTEGER NOT NULL DEFAULT 0,
  skin_regions_json TEXT,
  sharpness_score REAL,
  noise_score REAL,
  measured_analysis_json TEXT NOT NULL,
  ai_recommendations_json TEXT NOT NULL,
  warnings_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_photo ON ai_analyses(photo_id);

-- Non-Destructive Edits
CREATE TABLE IF NOT EXISTS edits (
  photo_id TEXT PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  -- Light
  exposure REAL NOT NULL DEFAULT 0.0,
  contrast REAL NOT NULL DEFAULT 0.0,
  highlights REAL NOT NULL DEFAULT 0.0,
  shadows REAL NOT NULL DEFAULT 0.0,
  whites REAL NOT NULL DEFAULT 0.0,
  blacks REAL NOT NULL DEFAULT 0.0,
  -- Color
  temperature REAL NOT NULL DEFAULT 0.0,
  tint REAL NOT NULL DEFAULT 0.0,
  vibrance REAL NOT NULL DEFAULT 0.0,
  saturation REAL NOT NULL DEFAULT 0.0,
  -- Presence
  texture REAL NOT NULL DEFAULT 0.0,
  clarity REAL NOT NULL DEFAULT 0.0,
  dehaze REAL NOT NULL DEFAULT 0.0,
  -- Detail
  sharpening REAL NOT NULL DEFAULT 0.0,
  noise_reduction REAL NOT NULL DEFAULT 0.0,
  -- Lens
  lens_profile_enabled INTEGER NOT NULL DEFAULT 0,
  chromatic_aberration INTEGER NOT NULL DEFAULT 0,
  distortion REAL NOT NULL DEFAULT 0.0,
  vignette REAL NOT NULL DEFAULT 0.0,
  -- Transform
  crop_x REAL NOT NULL DEFAULT 0.0,
  crop_y REAL NOT NULL DEFAULT 0.0,
  crop_w REAL NOT NULL DEFAULT 1.0,
  crop_h REAL NOT NULL DEFAULT 1.0,
  rotate REAL NOT NULL DEFAULT 0.0,
  flip_h INTEGER NOT NULL DEFAULT 0,
  flip_v INTEGER NOT NULL DEFAULT 0,
  -- Skin Tone Protection
  skin_protection_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

-- Edit History Audit Log (Undo/Redo & History Navigation)
CREATE TABLE IF NOT EXISTS edit_history (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  action_description TEXT NOT NULL,
  parameter_name TEXT NOT NULL,
  previous_value REAL,
  new_value REAL,
  snapshot_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edit_history_photo ON edit_history(photo_id, step_index);

-- Presets
CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'User',
  is_built_in INTEGER NOT NULL DEFAULT 0,
  parameters_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Ratings Record
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 0 AND 5),
  updated_at INTEGER NOT NULL
);

-- Flags Record
CREATE TABLE IF NOT EXISTS flags (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  flag TEXT NOT NULL CHECK (flag IN ('pick', 'unflagged', 'reject')),
  updated_at INTEGER NOT NULL
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filter_query_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_photos (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, photo_id)
);

-- Export Jobs
CREATE TABLE IF NOT EXISTS export_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  format TEXT NOT NULL,
  quality INTEGER NOT NULL,
  destination_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  error_log_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Processing Jobs (Worker Queue Audit)
CREATE TABLE IF NOT EXISTS processing_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled', 'paused')),
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Application Settings
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
