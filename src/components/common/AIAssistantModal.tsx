import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { EditParameters } from '../../types/models';
import {
  Sparkles,
  X,
  CheckCircle2,
  Sliders,
  Send,
  Loader2,
  Wand2,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AIProposal {
  explanation: string;
  adjustments: Partial<EditParameters>;
  tag: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const { activePhoto, activeEdits, updateEditParam, refreshPhotos } = useApp();

  const [prompt, setPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [proposal, setProposal] = useState<AIProposal | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    'Make this photo brighter without losing highlight detail',
    'Give this photograph a warm cinematic colour grade',
    'Suggest a natural portrait edit with rich melanin glow',
    'Add contrast and texture while preserving skin smoothness',
    'Cool tone moody aesthetic with punchy blacks'
  ];

  const handleProcessPrompt = async (text: string) => {
    const query = text.toLowerCase().trim();
    if (!query) return;

    setIsProcessing(true);
    setProposal(null);

    // Simulate intelligent typed analysis of natural language prompt
    setTimeout(() => {
      let adj: Partial<EditParameters> = {};
      let explanation = '';
      let tag = 'Custom Look';

      if (query.includes('bright') || query.includes('light')) {
        adj = {
          exposure: 0.65,
          highlights: -25,
          shadows: 35,
          whites: 10,
          blacks: 5
        };
        explanation = 'Lifted exposure (+0.65 EV) and boosted shadows (+35) while protecting highlight detail by reigning in highlights (-25).';
        tag = 'Highlight-Protected Exposure';
      } else if (query.includes('warm') || query.includes('cinematic')) {
        adj = {
          temperature: 18,
          tint: 6,
          contrast: 18,
          shadows: 15,
          vibrance: 22,
          saturation: 8,
          vignette: -15
        };
        explanation = 'Applied warm golden amber temperature (+18), deepened contrast (+18), enriched vibrance (+22), and added a subtle cinematic vignette (-15).';
        tag = 'Warm Cinematic Grade';
      } else if (query.includes('portrait') || query.includes('melanin') || query.includes('skin')) {
        adj = {
          exposure: 0.35,
          shadows: 28,
          temperature: 12,
          texture: -8,
          clarity: 4,
          vibrance: 16,
          sharpening: 35
        };
        explanation = 'Optimized portrait melanin glow: lifted shadows (+28), smoothed micro-texture (-8) for gentle skin softening, and boosted warm undertones.';
        tag = 'Melanin Portrait Retouch';
      } else if (query.includes('contrast') || query.includes('punchy') || query.includes('texture')) {
        adj = {
          contrast: 32,
          blacks: -18,
          whites: 15,
          clarity: 14,
          texture: 18,
          sharpening: 40
        };
        explanation = 'Accentuated depth: boosted contrast (+32), deepened black points (-18), and heightened architectural texture (+18).';
        tag = 'High Contrast Texture';
      } else if (query.includes('cool') || query.includes('moody')) {
        adj = {
          temperature: -16,
          tint: -4,
          contrast: 22,
          shadows: -10,
          saturation: -12,
          vignette: -20
        };
        explanation = 'Shifted white balance to cool Nordic hues (-16), pulled back shadows (-10), and desaturated muted tones (-12).';
        tag = 'Cool Moody Aesthetic';
      } else {
        adj = {
          exposure: 0.4,
          contrast: 15,
          highlights: -15,
          shadows: 20,
          vibrance: 15,
          texture: 5
        };
        explanation = 'Applied balanced studio auto-enhancement with balanced dynamic range and gentle color boost.';
        tag = 'Intelligent Studio Enhance';
      }

      setProposal({ explanation, adjustments: adj, tag });
      setIsProcessing(false);
    }, 400);
  };

  const handleApplyProposal = async () => {
    if (!proposal || !activePhoto) return;
    for (const [key, val] of Object.entries(proposal.adjustments)) {
      if (typeof val === 'number') {
        await updateEditParam(key as keyof EditParameters, val);
      }
    }
    await refreshPhotos();
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <Wand2 size={18} color="var(--accent-gold)" />
            <span style={styles.title}>AI Studio Natural-Language Assistant</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          <p style={styles.subtitle}>
            Describe the edit you want in plain English. The AI assistant translates your request into safe, non-destructive adjustment parameters for <strong>{activePhoto ? activePhoto.file_name : 'the active photograph'}</strong>.
          </p>

          {/* Prompt Input Form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleProcessPrompt(prompt);
            }}
            style={styles.inputForm}
          >
            <input
              type="text"
              autoFocus
              placeholder="e.g., Make this photo brighter without losing highlight detail..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              style={styles.textInput}
              disabled={isProcessing}
            />
            <button
              type="submit"
              style={{ ...styles.submitBtn, ...(isProcessing ? { opacity: 0.7 } : {}) }}
              disabled={isProcessing || !prompt.trim()}
            >
              {isProcessing ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
            </button>
          </form>

          {/* Quick Prompts */}
          <div style={styles.quickPromptsContainer}>
            <span style={styles.quickLabel}>
              <Lightbulb size={12} color="#e2a439" style={{ marginRight: 4 }} />
              Quick Suggestions:
            </span>
            <div style={styles.promptChips}>
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  type="button"
                  style={styles.chip}
                  onClick={() => {
                    setPrompt(qp);
                    handleProcessPrompt(qp);
                  }}
                  disabled={isProcessing}
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Proposal Preview Box */}
          {proposal && (
            <div style={styles.proposalBox}>
              <div style={styles.proposalHeader}>
                <span style={styles.proposalBadge}>{proposal.tag}</span>
                <span style={styles.previewNotice}>Preview Proposal</span>
              </div>
              <p style={styles.proposalExplanation}>{proposal.explanation}</p>

              <div style={styles.paramsGrid}>
                {Object.entries(proposal.adjustments).map(([key, val]) => (
                  <div key={key} style={styles.paramPill}>
                    <span style={styles.paramKey}>{key}:</span>
                    <span style={styles.paramVal}>
                      {Number(val) > 0 ? `+${val}` : `${val}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
          {proposal && (
            <button
              style={styles.applyBtn}
              onClick={handleApplyProposal}
              disabled={isProcessing || !activePhoto}
            >
              <CheckCircle2 size={14} style={{ marginRight: 6 }} />
              Apply Adjustments to Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
    backdropFilter: 'blur(3px)'
  },
  modal: {
    backgroundColor: '#1c1d22',
    border: '1px solid #2e3039',
    borderRadius: 8,
    width: 600,
    maxWidth: '92vw',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid #2e3039',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: '#ffffff'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#9da3af',
    cursor: 'pointer',
    padding: 4,
    display: 'flex'
  },
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  subtitle: {
    fontSize: 13,
    color: '#9da3af',
    lineHeight: 1.5,
    margin: 0
  },
  inputForm: {
    display: 'flex',
    gap: 8
  },
  textInput: {
    flex: 1,
    backgroundColor: '#141416',
    border: '1px solid #2e3039',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 13,
    color: '#ffffff',
    outline: 'none'
  },
  submitBtn: {
    backgroundColor: '#e2a439',
    border: 'none',
    borderRadius: 6,
    padding: '0 18px',
    color: '#000',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickPromptsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  quickLabel: {
    fontSize: 11,
    color: '#9da3af',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 500
  },
  promptChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6
  },
  chip: {
    backgroundColor: '#262832',
    border: '1px solid #363945',
    borderRadius: 14,
    padding: '5px 12px',
    fontSize: 11,
    color: '#d1d5db',
    cursor: 'pointer',
    textAlign: 'left'
  },
  proposalBox: {
    backgroundColor: '#22242c',
    border: '1px solid #3e4250',
    borderRadius: 6,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  proposalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  proposalBadge: {
    backgroundColor: '#e2a439',
    color: '#000',
    fontWeight: 700,
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 4
  },
  previewNotice: {
    fontSize: 11,
    color: '#9da3af'
  },
  proposalExplanation: {
    fontSize: 12,
    color: '#e5e7eb',
    lineHeight: 1.4,
    margin: 0
  },
  paramsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6
  },
  paramPill: {
    backgroundColor: '#141416',
    border: '1px solid #2e3039',
    borderRadius: 4,
    padding: '3px 8px',
    fontSize: 11,
    display: 'flex',
    gap: 4
  },
  paramKey: {
    color: '#9da3af'
  },
  paramVal: {
    color: '#e2a439',
    fontWeight: 600
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #2e3039',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    backgroundColor: '#16171a'
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #2e3039',
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 12,
    color: '#9da3af',
    cursor: 'pointer'
  },
  applyBtn: {
    backgroundColor: '#e2a439',
    border: 'none',
    borderRadius: 6,
    padding: '8px 18px',
    fontSize: 12,
    color: '#000000',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  }
};
