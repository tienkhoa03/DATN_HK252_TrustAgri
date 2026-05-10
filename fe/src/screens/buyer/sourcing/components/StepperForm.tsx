/**
 * StepperForm — generic multi-step form with draft persistence
 *
 * Requirements: FR-U02, FR-U03, NFR-U01, NFR-U03
 */

import React, { useState, useEffect } from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

export interface StepConfig<S> {
  id: string;
  title: string;
  render: (state: S, setState: React.Dispatch<React.SetStateAction<S>>) => React.ReactNode;
  validate?: (state: S) => string | null;
}

export interface StepperFormProps<S> {
  steps: StepConfig<S>[];
  initialState: S;
  onSubmit: (state: S) => void | Promise<void>;
  draftKey?: string;
  onCancel?: () => void;
}

export function StepperForm<S>({
  steps,
  initialState,
  onSubmit,
  draftKey,
  onCancel,
}: StepperFormProps<S>): React.ReactElement {
  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<S>(() => {
    if (draftKey) {
      try {
        const raw = sessionStorage.getItem(draftKey);
        if (raw) return JSON.parse(raw) as S;
      } catch {
        // ignore corrupt draft
      }
    }
    return initialState;
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Persist draft on state change
  useEffect(() => {
    if (draftKey) {
      try {
        sessionStorage.setItem(draftKey, JSON.stringify(formState));
      } catch {
        // quota exceeded — ignore
      }
    }
  }, [formState, draftKey]);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = async () => {
    const err = step.validate?.(formState) ?? null;
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);

    if (isLast) {
      setSubmitting(true);
      try {
        await onSubmit(formState);
        if (draftKey) sessionStorage.removeItem(draftKey);
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (isFirst) {
      onCancel?.();
    } else {
      setCurrentStep((s) => s - 1);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  const progressBarStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.tertiary}`,
  };

  const dotActive: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: fontWeight.bold,
    flexShrink: 0,
  };

  const dotDone: React.CSSProperties = {
    ...dotActive,
    backgroundColor: colors.primary.agriGreenDark,
    opacity: 0.7,
  };

  const dotInactive: React.CSSProperties = {
    ...dotActive,
    backgroundColor: colors.background.secondary,
    color: colors.text.secondary,
    border: `1px solid ${colors.background.tertiary}`,
  };

  const connectorStyles: React.CSSProperties = {
    flex: 1,
    height: '2px',
    backgroundColor: colors.background.tertiary,
    maxWidth: '40px',
  };

  const connectorDoneStyles: React.CSSProperties = {
    ...connectorStyles,
    backgroundColor: colors.primary.agriGreen,
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: spacing.md,
  };

  const footerStyles: React.CSSProperties = {
    position: 'sticky',
    bottom: 0,
    backgroundColor: colors.background.primary,
    borderTop: `1px solid ${colors.background.tertiary}`,
    padding: spacing.md,
    display: 'flex',
    gap: spacing.sm,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
  };

  const backBtnStyles: React.CSSProperties = {
    flex: 1,
    minHeight: '44px',
    border: `1px solid ${colors.background.tertiary}`,
    borderRadius: '8px',
    backgroundColor: colors.background.secondary,
    color: colors.text.secondary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    cursor: isFirst ? 'default' : 'pointer',
    opacity: isFirst ? 0.5 : 1,
  };

  const nextBtnStyles: React.CSSProperties = {
    flex: 2,
    minHeight: '44px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: submitting ? colors.primary.agriGreenDark : colors.primary.agriGreen,
    color: colors.text.inverse,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: submitting ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s',
  };

  const errorStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: 'rgba(245,0,0,0.08)',
    borderRadius: '6px',
    marginBottom: spacing.sm,
    fontSize: fontSize.caption,
    color: colors.functional.alertRed,
    border: `1px solid ${colors.functional.alertRed}`,
  };

  return (
    <div style={containerStyles}>
      {/* Progress indicator */}
      <div style={progressBarStyles}>
        {steps.map((s, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && (
                <div style={isDone ? connectorDoneStyles : connectorStyles} />
              )}
              <div style={isDone ? dotDone : isActive ? dotActive : dotInactive}>
                {isDone ? '✓' : i + 1}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Step title */}
      <div style={{ padding: `${spacing.sm} ${spacing.md} 0`, backgroundColor: colors.background.primary }}>
        <Text style={{
          fontSize: fontSize.body,
          fontWeight: fontWeight.semibold,
          color: colors.text.primary,
        }}>
          {step.title}
        </Text>
        <Text style={{
          fontSize: '12px',
          color: colors.text.secondary,
        }}>
          Bước {currentStep + 1} / {steps.length}
        </Text>
      </div>

      {/* Step content */}
      <div style={contentStyles}>
        {validationError && (
          <div style={errorStyles}>{validationError}</div>
        )}
        {step.render(formState, setFormState)}
      </div>

      {/* Footer */}
      <div style={footerStyles}>
        <button
          type="button"
          style={backBtnStyles}
          onClick={handleBack}
          disabled={submitting}
        >
          {isFirst ? 'Hủy' : 'Quay lại'}
        </button>
        <button
          type="button"
          style={nextBtnStyles}
          onClick={handleNext}
          disabled={submitting}
        >
          {submitting ? 'Đang gửi...' : isLast ? 'Hoàn tất' : 'Tiếp theo'}
        </button>
      </div>
    </div>
  );
}
