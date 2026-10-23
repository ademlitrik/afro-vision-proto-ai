import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { EditParameters } from '../../types/models';
import {
  Sparkles,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  SunMedium,
  Palette,
  Eye,
  Focus,
  Crop,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  BarChart2,
  Loader2,
  Bookmark,
  Plus
} from 'lucide-react';

export const EditingPanel: React.FC = () => {
  const {
    activePhoto,
    activePhotoMetadata,
    activeEdits,
    activeAnalysis,
    isAnalyzing,
    analysisError,
    analyzeCurrentPhoto,
    updateEditParam,
    applyAiRecommendations,
    resetEdits,
    presets,
    applyPresetToActive,
    saveCurrentAsPreset,
    deletePreset,
    showSidePanels
  } = useApp();

  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    presets: true,
    histogram: true,
    aiAuto: true,
    skinTone: true,
    measuredData: true,
    aiRecommendations: true,
    light: true,
    color: true,
    presence: true,
    detail: false,
    lens: false
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderSlider = (
    label: string,
    key: keyof EditParameters,
    min: number,
    max: number,
    step: number = 1,
    unit: string = ''
  ) => {
    const val = activeEdits ? (activeEdits[key] as number) : 0;
    const formattedVal = step < 1 ? Number(val).toFixed(2) : Math.round(val);
    const displayVal = val > 0 ? `+${formattedVal}` : `${formattedVal}`;

    return (
      <div style={styles.sliderRow}>
        <div style={styles.sliderLabelRow}>
          <span
            style={{ ...styles.sliderLabel, cursor: 'pointer' }}
            title="Double-click to reset"
            onDoubleClick={() => updateEditParam(key, 0)}
          >
            {label}
          </span>
          <span style={styles.sliderValue}>{displayVal}{unit}</span>
        </div>
        <div style={styles.sliderTrackContainer}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={val}
            disabled={!activePhoto}
            style={styles.sliderInput}
            onChange={(e) => updateEditParam(key, parseFloat(e.target.value))}
          />
        </div>
      </div>
    );
  };

  // Helper to convert 64-bin histogram array into SVG path
  const makeHistogramPath = (data: number[], width: number, height: number): string => {
    if (!data || data.length === 0) return '';
    const step = width / (data.length - 1);
    let d = `M 0 ${height}`;
    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = height - (data[i] / 100) * height;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    d += ` L ${width} ${height} Z`;
    return d;
  };

  const hist = activeAnalysis?.measured?.histogram;

  return (
    <aside style={styles.container}>
      {/* HISTOGRAM & EXIF */}
      <div style={styles.sectionHeader} onClick={() => toggleSection('histogram')}>
        <div style={styles.sectionHeaderTitle}>
          {openSections.histogram ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <BarChart2 size={13} color="var(--accent-gold)" />
          <span>HISTOGRAM & EXIF</span>
        </div>
      </div>

      {openSections.histogram && (
        <div style={styles.histogramContainer}>
          <div style={styles.histogramCanvas}>
            <div style={styles.histogramGridLine} />
            <div style={styles.histogramGridLine25} />
            <div style={styles.histogramGridLine75} />

            {hist ? (
              <svg width="100%" height="90" viewBox="0 0 260 90" preserveAspectRatio="none" style={styles.histogramSvg}>
                {/* Red channel */}
                <path d={makeHistogramPath(hist.r, 260, 90)} fill="rgba(239, 68, 68, 0.40)" />
                {/* Green channel */}
                <path d={makeHistogramPath(hist.g, 260, 90)} fill="rgba(34, 197, 94, 0.40)" />
                {/* Blue channel */}
                <path d={makeHistogramPath(hist.b, 260, 90)} fill="rgba(59, 130, 246, 0.40)" />
                {/* Luminance channel */}
                <path d={makeHistogramPath(hist.l, 260, 90)} fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.2" />
              </svg>
            ) : (
              <div style={styles.histogramPlaceholder}>
                <span style={styles.histogramPlaceholderText}>
                  {activePhoto ? 'Analyze photo to render pixel histogram' : 'No photo selected'}
                </span>
              </div>
            )}
          </div>

          {/* Real EXIF Readout */}
          <div style={styles.exifBar}>
            <div style={styles.exifItem}>
              <span style={styles.exifKey}>ISO</span>
              <span style={styles.exifVal}>{activePhotoMetadata?.iso || '—'}</span>
            </div>
            <div style={styles.exifItem}>
              <span style={styles.exifKey}>LEN</span>
              <span style={styles.exifVal}>
                {activePhotoMetadata?.focal_length ? `${Math.round(activePhotoMetadata.focal_length)}mm` : '—'}
              </span>
            </div>
            <div style={styles.exifItem}>
              <span style={styles.exifKey}>ƒ</span>
              <span style={styles.exifVal}>
                {activePhotoMetadata?.aperture ? `ƒ/${activePhotoMetadata.aperture}` : '—'}
              </span>
            </div>
            <div style={styles.exifItem}>
              <span style={styles.exifKey}>SEC</span>
              <span style={styles.exifVal}>{activePhotoMetadata?.shutter_speed || '—'}</span>
            </div>
          </div>

          {activePhotoMetadata?.camera_make && (
            <div style={styles.cameraBanner}>
              <Camera size={11} color="var(--text-muted)" />
              <span className="truncate" style={styles.cameraText}>
                {activePhotoMetadata.camera_make} {activePhotoMetadata.camera_model || ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* STUDIO PRESETS SECTION (Stage 7) */}
      <div style={styles.sectionHeader} onClick={() => toggleSection('presets')}>
        <div style={styles.sectionHeaderTitle}>
          {openSections.presets ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Bookmark size={14} color="var(--accent-gold)" />
          <span>STUDIO PRESETS</span>
        </div>
        <button
          style={styles.savePresetMiniBtn}
          title="Save current edits as new preset"
          disabled={!activePhoto || !activeEdits}
          onClick={(e) => {
            e.stopPropagation();
            setIsSavingPreset(prev => !prev);
          }}
        >
          <Plus size={12} /> Save
        </button>
      </div>

      {openSections.presets && (
        <div style={styles.presetsSection}>
          {isSavingPreset && (
            <div style={styles.savePresetDialog}>
              <span style={styles.savePresetLabel}>New Preset Name:</span>
              <div style={styles.savePresetInputRow}>
                <input
                  type="text"
                  placeholder="e.g. Bronze Studio Glow"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  style={styles.savePresetInput}
                  autoFocus
                />
                <button
                  style={styles.savePresetConfirmBtn}
                  disabled={!newPresetName.trim()}
                  onClick={async () => {
                    if (newPresetName.trim()) {
                      await saveCurrentAsPreset(newPresetName.trim(), 'User');
                      setNewPresetName('');
                      setIsSavingPreset(false);
                    }
                  }}
                >
                  Save
                </button>
                <button
                  style={styles.savePresetCancelBtn}
                  onClick={() => setIsSavingPreset(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Preset Category Filter Chips */}
          <div style={styles.presetCategoryRow}>
            {['All', 'Melanin Studio', 'Portrait', 'Monochrome', 'User'].map(cat => (
              <button
                key={cat}
                style={{
                  ...styles.presetCategoryChip,
                  ...(selectedCategory === cat ? styles.presetCategoryChipActive : {})
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Preset Buttons Grid */}
          <div style={styles.presetGrid}>
            {presets
              .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
              .map(p => (
                <div key={p.id} style={styles.presetCard}>
                  <div style={styles.presetHeader}>
                    <span style={styles.presetName}>{p.name}</span>
                    <span style={styles.presetBadge}>{p.category}</span>
                  </div>
                  <div style={styles.presetActionRow}>
                    <button
                      style={styles.presetApplyBtn}
                      disabled={!activePhoto}
                      onClick={() => applyPresetToActive(p.id)}
                      title={`Apply ${p.name} to active photo`}
                    >
                      Apply
                    </button>
                    {p.is_built_in === 0 && (
                      <button
                        style={styles.presetDeleteBtn}
                        onClick={() => deletePreset(p.id)}
                        title="Delete custom preset"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* AFRO VISION AI ENGINE */}
      <div style={styles.sectionHeader} onClick={() => toggleSection('aiAuto')}>
        <div style={styles.sectionHeaderTitle}>
          {openSections.aiAuto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Sparkles size={14} color="var(--accent-gold)" />
          <span>AFRO VISION AI ENGINE</span>
        </div>
      </div>

      {openSections.aiAuto && (
        <div style={styles.aiSection}>
          <div style={styles.aiBadgeRow}>
            <div style={styles.aiBadge}>
              <ShieldCheck size={13} color="var(--accent-green)" />
              <span>Skin-Tone Protection Active</span>
            </div>
            <span style={styles.aiMethodBadge}>Empirical Pixels</span>
          </div>

          <div style={styles.aiButtonRow}>
            <button
              style={{
                ...styles.aiAutoButton,
                opacity: !activePhoto || isAnalyzing ? 0.6 : 1,
                cursor: !activePhoto || isAnalyzing ? 'not-allowed' : 'pointer'
              }}
              disabled={!activePhoto || isAnalyzing}
              onClick={analyzeCurrentPhoto}
              title="Perform real deterministic pixel analysis"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Analyzing Pixels...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{activeAnalysis ? 'Re-Analyze Image' : 'Analyze Image'}</span>
                </>
              )}
            </button>
            <button
              style={styles.aiOptionsButton}
              disabled={!activePhoto}
              onClick={resetEdits}
              title="Reset all adjustments"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {analysisError && (
            <div style={styles.errorBanner}>
              <AlertTriangle size={12} color="var(--accent-red)" />
              <span>{analysisError}</span>
            </div>
          )}

          {activeAnalysis && activeAnalysis.warnings.length > 0 && (
            <div style={styles.warningsList}>
              {activeAnalysis.warnings.map((w, idx) => (
                <div key={idx} style={styles.warningItem}>
                  <AlertTriangle size={11} color="var(--accent-gold)" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <div style={styles.aiNote}>
            Deterministically derived from luminance histograms, clipping percentiles, channel ratios, and high-frequency edge energy.
          </div>
        </div>
      )}

      {/* MEASURED ANALYSIS (EMPIRICAL FACTS) */}
      {activeAnalysis && (
        <>
          <div style={styles.sectionHeader} onClick={() => toggleSection('measuredData')}>
            <div style={styles.sectionHeaderTitle}>
              {openSections.measuredData ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <BarChart2 size={13} color="#60a5fa" />
              <span>MEASURED PIXEL ANALYSIS</span>
            </div>
          </div>

          {openSections.measuredData && (
            <div style={styles.metricsContainer}>
              <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Median Lum</span>
                  <span style={styles.metricVal}>{activeAnalysis.measured.luminanceMedian} / 255</span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Dynamic Range</span>
                  <span style={styles.metricVal}>{activeAnalysis.measured.dynamicRangeEV} EV</span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Contrast Ratio</span>
                  <span style={styles.metricVal}>{activeAnalysis.measured.contrastRatio}:1</span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Highlight Clip</span>
                  <span style={{
                    ...styles.metricVal,
                    color: activeAnalysis.measured.highlightClippingPct > 1 ? 'var(--accent-red)' : 'var(--text-primary)'
                  }}>
                    {activeAnalysis.measured.highlightClippingPct}%
                  </span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Shadow Clip</span>
                  <span style={{
                    ...styles.metricVal,
                    color: activeAnalysis.measured.shadowClippingPct > 2 ? 'var(--accent-red)' : 'var(--text-primary)'
                  }}>
                    {activeAnalysis.measured.shadowClippingPct}%
                  </span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Est. Color Temp</span>
                  <span style={styles.metricVal}>{activeAnalysis.measured.estimatedColorTempK} K</span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Est. Tint</span>
                  <span style={styles.metricVal}>
                    {activeAnalysis.measured.estimatedTint > 0 ? `+${activeAnalysis.measured.estimatedTint}` : activeAnalysis.measured.estimatedTint}
                  </span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Sharpness Score</span>
                  <span style={styles.metricVal}>{activeAnalysis.measured.sharpnessScore} / 100</span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Noise Score</span>
                  <span style={styles.metricVal}>{activeAnalysis.measured.noiseScore} / 100</span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Mean Saturation</span>
                  <span style={styles.metricVal}>{Math.round(activeAnalysis.measured.meanSaturation * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* SKIN-TONE & MELANIN SPECTRUM (Stage 5) */}
          {activeAnalysis.skin && (
            <>
              <div style={styles.sectionHeader} onClick={() => toggleSection('skinTone')}>
                <div style={styles.sectionHeaderTitle}>
                  {openSections.skinTone ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <ShieldCheck size={13} color="var(--accent-green)" />
                  <span>SKIN-TONE & MELANIN SPECTRUM</span>
                </div>
              </div>

              {openSections.skinTone && (
                <div style={styles.skinSection}>
                  {activeAnalysis.skin.detected ? (
                    <>
                      <div style={styles.skinHeaderRow}>
                        <div style={styles.skinStatusPill}>
                          <span style={styles.skinStatusDot} />
                          <span>{activeAnalysis.skin.dominantSpectrum.toUpperCase()} MELANIN</span>
                        </div>
                        <span style={styles.skinCoverage}>
                          {activeAnalysis.skin.skinPixelPercentage}% frame
                        </span>
                      </div>

                      <div style={styles.skinMetricsGrid}>
                        <div style={styles.metricCard}>
                          <span style={styles.metricLabel}>Dominant Spectrum</span>
                          <span style={{ ...styles.metricVal, textTransform: 'capitalize' }}>
                            {activeAnalysis.skin.dominantSpectrum}
                          </span>
                        </div>
                        <div style={styles.metricCard}>
                          <span style={styles.metricLabel}>Undertone</span>
                          <span style={{
                            ...styles.metricVal,
                            color: activeAnalysis.skin.undertoneTendency === 'cool-ashy' ? 'var(--accent-gold)' : 'var(--accent-green)',
                            textTransform: 'capitalize'
                          }}>
                            {activeAnalysis.skin.undertoneTendency}
                          </span>
                        </div>
                        <div style={styles.metricCard}>
                          <span style={styles.metricLabel}>Skin Luminance</span>
                          <span style={styles.metricVal}>{activeAnalysis.skin.meanLuminance} / 255</span>
                        </div>
                        <div style={styles.metricCard}>
                          <span style={styles.metricLabel}>Ashy Risk Score</span>
                          <span style={{
                            ...styles.metricVal,
                            color: activeAnalysis.skin.ashyRiskScore > 20 ? 'var(--accent-gold)' : 'var(--accent-green)'
                          }}>
                            {activeAnalysis.skin.ashyRiskScore} / 100
                          </span>
                        </div>
                      </div>

                      {/* Active Protection Safeguards */}
                      <div style={styles.safeguardsBox}>
                        <span style={styles.safeguardTitle}>ACTIVE MELANIN SAFEGUARDS</span>
                        <div style={styles.safeguardsList}>
                          <div style={styles.safeguardPill}>
                            <CheckCircle2 size={10} color="var(--accent-green)" />
                            <span>Clarity capped ≤ +{activeAnalysis.skin.constraints.maxSafeClarity} (pore safe)</span>
                          </div>
                          <div style={styles.safeguardPill}>
                            <CheckCircle2 size={10} color="var(--accent-green)" />
                            <span>Vibrance preferred over saturation ({activeAnalysis.skin.constraints.recommendedVibranceBias}x)</span>
                          </div>
                          <div style={styles.safeguardPill}>
                            <CheckCircle2 size={10} color="var(--accent-green)" />
                            <span>Warmth shielded ({Math.round(activeAnalysis.skin.constraints.tempCorrectionDamping * 100)}% temp damping)</span>
                          </div>
                          {activeAnalysis.skin.constraints.ashyUndertoneProtection && (
                            <div style={styles.safeguardPill}>
                              <Sparkles size={10} color="var(--accent-gold)" />
                              <span>Ashy undertone protection active (warmth injected)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={styles.noSkinText}>
                      No prominent skin region detected (&lt; 2.5% frame). Full dynamic range landscape processing active.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* AI RECOMMENDATIONS */}
          <div style={styles.sectionHeader} onClick={() => toggleSection('aiRecommendations')}>
            <div style={styles.sectionHeaderTitle}>
              {openSections.aiRecommendations ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <CheckCircle2 size={13} color="var(--accent-green)" />
              <span>AI RECOMMENDATIONS</span>
            </div>
          </div>

          {openSections.aiRecommendations && (
            <div style={styles.recommendationsContainer}>
              <button
                style={styles.applyRecButton}
                onClick={applyAiRecommendations}
                title="Apply all recommended parameters to sliders"
              >
                <Sliders size={13} />
                <span>Apply All AI Recommendations</span>
              </button>

              <div style={styles.recList}>
                {Object.entries(activeAnalysis.recommendations)
                  .filter(([, rec]) => rec.value !== 0)
                  .map(([key, rec]) => (
                    <div key={key} style={styles.recCard}>
                      <div style={styles.recHeaderRow}>
                        <span style={styles.recKey}>{key.toUpperCase()}</span>
                        <span style={styles.recVal}>
                          {rec.value > 0 ? `+${rec.value}` : rec.value}
                        </span>
                        <span style={styles.recConfidence}>
                          {Math.round(rec.confidence * 100)}% conf
                        </span>
                      </div>
                      <div style={styles.recReason}>{rec.reason}</div>
                      {rec.warnings.length > 0 && (
                        <div style={styles.recWarnText}>
                          {rec.warnings.join(' ')}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* LIGHT */}
      <div style={styles.sectionHeader} onClick={() => toggleSection('light')}>
        <div style={styles.sectionHeaderTitle}>
          {openSections.light ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <SunMedium size={14} color="#9da3af" />
          <span>LIGHT</span>
        </div>
      </div>
      {openSections.light && (
        <div style={styles.sectionBody}>
          {renderSlider('Exposure', 'exposure', -5.0, 5.0, 0.05, ' EV')}
          {renderSlider('Contrast', 'contrast', -100, 100, 1)}
          {renderSlider('Highlights', 'highlights', -100, 100, 1)}
          {renderSlider('Shadows', 'shadows', -100, 100, 1)}
          {renderSlider('Whites', 'whites', -100, 100, 1)}
          {renderSlider('Blacks', 'blacks', -100, 100, 1)}
        </div>
      )}

      {/* COLOR */}
      <div style={styles.sectionHeader} onClick={() => toggleSection('color')}>
        <div style={styles.sectionHeaderTitle}>
          {openSections.color ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Palette size={14} color="#9da3af" />
          <span>COLOR</span>
        </div>
      </div>
      {openSections.color && (
        <div style={styles.sectionBody}>
          {renderSlider('Temp', 'temperature', -100, 100, 1)}
          {renderSlider('Tint', 'tint', -100, 100, 1)}
          {renderSlider('Vibrance', 'vibrance', -100, 100, 1)}
          {renderSlider('Saturation', 'saturation', -100, 100, 1)}
        </div>
      )}

      {/* PRESENCE */}
      <div style={styles.sectionHeader} onClick={() => toggleSection('presence')}>
        <div style={styles.sectionHeaderTitle}>
          {openSections.presence ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Eye size={14} color="#9da3af" />
          <span>PRESENCE</span>
        </div>
      </div>
      {openSections.presence && (
        <div style={styles.sectionBody}>
          {renderSlider('Texture', 'texture', -100, 100, 1)}
          {renderSlider('Clarity', 'clarity', -100, 100, 1)}
          {renderSlider('Dehaze', 'dehaze', -100, 100, 1)}
        </div>
      )}

      {/* DETAIL */}
      <div style={styles.sectionHeader} onClick={() => toggleSection('detail')}>
        <div style={styles.sectionHeaderTitle}>
          {openSections.detail ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Focus size={14} color="#9da3af" />
          <span>DETAIL</span>
        </div>
      </div>
      {openSections.detail && (
        <div style={styles.sectionBody}>
          {renderSlider('Sharpening', 'sharpening', 0, 100, 1)}
          {renderSlider('Noise Reduction', 'noise_reduction', 0, 100, 1)}
        </div>
      )}

      {/* LENS & TRANSFORM */}
      <div style={styles.sectionHeader} onClick={() => toggleSection('lens')}>
        <div style={styles.sectionHeaderTitle}>
          {openSections.lens ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Crop size={14} color="#9da3af" />
          <span>LENS & TRANSFORM</span>
        </div>
      </div>
      {openSections.lens && (
        <div style={styles.sectionBody}>
          {renderSlider('Vignette', 'vignette', -100, 100, 1)}
          {renderSlider('Distortion', 'distortion', -100, 100, 1)}
        </div>
      )}

      {/* Sticky Bottom Actions */}
      <div style={styles.bottomActions}>
        <button style={styles.footerBtn} onClick={resetEdits} disabled={!activePhoto}>
          <RotateCcw size={12} style={{ marginRight: 4 }} />
          <span>Reset All</span>
        </button>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 'var(--edit-panel-width)',
    backgroundColor: 'var(--bg-panel)',
    borderLeft: '1px solid var(--border-default)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    flexShrink: 0
  },
  sectionHeader: {
    padding: '8px 12px',
    backgroundColor: 'var(--bg-panel-elevated)',
    borderBottom: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    userSelect: 'none'
  },
  sectionHeaderTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: 'var(--text-secondary)'
  },
  histogramContainer: {
    padding: 10,
    backgroundColor: 'var(--bg-app)',
    borderBottom: '1px solid var(--border-default)'
  },
  histogramCanvas: {
    height: 90,
    backgroundColor: '#070709',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid var(--border-subtle)'
  },
  histogramSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  },
  histogramPlaceholder: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    textAlign: 'center'
  },
  histogramPlaceholderText: {
    fontSize: 10,
    color: 'var(--text-muted)'
  },
  histogramGridLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  histogramGridLine25: {
    position: 'absolute',
    left: '25%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.04)'
  },
  histogramGridLine75: {
    position: 'absolute',
    left: '75%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.04)'
  },
  exifBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 4px 2px 4px',
    fontSize: 11
  },
  exifItem: {
    display: 'flex',
    gap: 4
  },
  exifKey: {
    color: 'var(--text-muted)',
    fontWeight: 600
  },
  exifVal: {
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)'
  },
  cameraBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 4px 0 4px',
    borderTop: '1px solid var(--border-subtle)',
    marginTop: 4
  },
  cameraText: {
    fontSize: 10,
    color: 'var(--text-secondary)'
  },
  savePresetMiniBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '2px 6px',
    fontSize: 10,
    fontWeight: 600,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 3,
    color: 'var(--accent-gold)',
    cursor: 'pointer'
  },
  presetsSection: {
    padding: 10,
    backgroundColor: 'var(--bg-app)',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  savePresetDialog: {
    padding: 8,
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border-default)',
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  savePresetLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  savePresetInputRow: {
    display: 'flex',
    gap: 6
  },
  savePresetInput: {
    flex: 1,
    padding: '3px 6px',
    fontSize: 11,
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 3,
    color: 'var(--text-primary)'
  },
  savePresetConfirmBtn: {
    padding: '3px 8px',
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: 'var(--accent-gold)',
    color: '#000',
    border: 'none',
    borderRadius: 3,
    cursor: 'pointer'
  },
  savePresetCancelBtn: {
    padding: '3px 8px',
    fontSize: 10,
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 3,
    cursor: 'pointer'
  },
  presetCategoryRow: {
    display: 'flex',
    gap: 4,
    overflowX: 'auto',
    paddingBottom: 2
  },
  presetCategoryChip: {
    padding: '2px 6px',
    fontSize: 9,
    fontWeight: 600,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 3,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  presetCategoryChipActive: {
    backgroundColor: 'rgba(230, 161, 92, 0.15)',
    borderColor: 'var(--accent-gold)',
    color: 'var(--accent-gold)'
  },
  presetGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  presetCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 4
  },
  presetHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  presetName: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  presetBadge: {
    fontSize: 9,
    color: 'var(--text-muted)'
  },
  presetActionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  presetApplyBtn: {
    padding: '3px 8px',
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: 'var(--accent-gold)',
    color: '#000',
    border: 'none',
    borderRadius: 3,
    cursor: 'pointer'
  },
  presetDeleteBtn: {
    padding: '2px 5px',
    fontSize: 9,
    backgroundColor: 'transparent',
    color: 'var(--accent-red)',
    border: '1px solid var(--accent-red)',
    borderRadius: 3,
    cursor: 'pointer'
  },
  aiSection: {
    padding: 12,
    backgroundColor: 'var(--bg-app)',
    borderBottom: '1px solid var(--border-default)'
  },
  aiBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  aiBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--accent-green)'
  },
  aiMethodBadge: {
    fontSize: 9,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-surface)',
    padding: '2px 5px',
    borderRadius: 3
  },
  aiButtonRow: {
    display: 'flex',
    gap: 6,
    marginBottom: 8
  },
  aiAutoButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 12px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--accent-gold)',
    borderRadius: 5,
    color: 'var(--accent-gold)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer'
  },
  aiOptionsButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 5,
    color: 'var(--text-secondary)',
    cursor: 'pointer'
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 4,
    color: 'var(--accent-red)',
    fontSize: 10,
    marginBottom: 8
  },
  warningsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 8
  },
  warningItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 6px',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    border: '1px solid rgba(234, 179, 8, 0.25)',
    borderRadius: 3,
    color: 'var(--accent-gold)',
    fontSize: 10
  },
  aiNote: {
    fontSize: 10,
    color: 'var(--text-muted)',
    lineHeight: 1.4
  },
  metricsContainer: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-subtle)'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 6
  },
  skinSection: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  skinHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  skinStatusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '2px 8px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--accent-green)'
  },
  skinStatusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: 'var(--accent-green)'
  },
  skinCoverage: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)'
  },
  skinMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 6
  },
  safeguardsBox: {
    padding: '8px 10px',
    backgroundColor: 'var(--bg-app)',
    borderRadius: 4,
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: 5
  },
  safeguardTitle: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: 'var(--text-muted)'
  },
  safeguardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  safeguardPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 9,
    color: 'var(--text-secondary)'
  },
  noSkinText: {
    fontSize: 10,
    color: 'var(--text-muted)',
    lineHeight: 1.4
  },
  metricCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '5px 8px',
    backgroundColor: 'var(--bg-app)',
    borderRadius: 4,
    border: '1px solid var(--border-subtle)'
  },
  metricLabel: {
    fontSize: 9,
    color: 'var(--text-muted)',
    marginBottom: 2
  },
  metricVal: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  recommendationsContainer: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-subtle)'
  },
  applyRecButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '7px 10px',
    backgroundColor: 'var(--accent-gold)',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    fontWeight: 700,
    fontSize: 11,
    cursor: 'pointer',
    marginBottom: 10
  },
  recList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  recCard: {
    padding: '6px 8px',
    backgroundColor: 'var(--bg-app)',
    borderRadius: 4,
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  recHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 10
  },
  recKey: {
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  recVal: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    color: 'var(--accent-gold)'
  },
  recConfidence: {
    fontSize: 9,
    color: 'var(--accent-green)',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: '1px 4px',
    borderRadius: 2
  },
  recReason: {
    fontSize: 10,
    color: 'var(--text-secondary)',
    lineHeight: 1.3
  },
  recWarnText: {
    fontSize: 9,
    color: 'var(--accent-red)'
  },
  sectionBody: {
    padding: '10px 14px',
    backgroundColor: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  sliderRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  sliderLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 11
  },
  sliderLabel: {
    color: 'var(--text-secondary)',
    userSelect: 'none'
  },
  sliderValue: {
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10
  },
  sliderTrackContainer: {
    width: '100%'
  },
  sliderInput: {
    width: '100%',
    height: 4,
    accentColor: 'var(--accent-gold)',
    borderRadius: 2,
    backgroundColor: 'var(--bg-surface)',
    cursor: 'pointer'
  },
  bottomActions: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'flex-start',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-panel-elevated)',
    borderTop: '1px solid var(--border-default)'
  },
  footerBtn: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    color: 'var(--text-secondary)',
    padding: '4px 8px',
    borderRadius: 4,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer'
  }
};
