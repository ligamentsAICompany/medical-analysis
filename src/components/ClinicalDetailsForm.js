'use client';

import React from 'react';
import { X } from 'lucide-react';

export const EMPTY_CLINICAL_CONTEXT = {
  patientSex: '',
  patientAge: '',
  presentComplaint: '',
  pastHistory: '',
  priorSurgicalHistory: '',
  noSignificantHistory: false,
};

export function hasClinicalContext (value) {
  if (!value) return false;
  return Boolean(
    value.patientSex ||
    value.patientAge ||
    value.presentComplaint ||
    value.pastHistory ||
    value.priorSurgicalHistory ||
    value.noSignificantHistory
  );
}

/**
 * Inline, skippable "New finding" clinical-details form. Not a modal —
 * renders as a page section so it never blocks the existing fast upload path.
 * Visibility is controlled by the parent (via the "New finding" table action);
 * this component always renders its fields once mounted.
 */
export function ClinicalDetailsForm ({ value, onChange, onClear, onClose }) {
  const setField = (field) => (e) => {
    if (field === 'noSignificantHistory') {
      const checked = e.target.checked;
      onChange({
        ...value,
        noSignificantHistory: checked,
        pastHistory: checked ? '' : value.pastHistory,
        priorSurgicalHistory: checked ? '' : value.priorSurgicalHistory,
      });
      return;
    }
    onChange({ ...value, [field]: e.target.value });
  };

  return (
    <div className="clinical-form clinical-form--open">
      <div className="clinical-form__header">
        <div>
          <h3 className="clinical-form__title">Clinical details</h3>
          <p className="clinical-form__hint">
            Optional context for the AI — sex, age, complaint and history help sharpen the
            analysis. Skip this if you&apos;re in a hurry; upload works the same either way.
          </p>
        </div>
        <button
          type="button"
          className="shell-icon-btn clinical-form__close"
          onClick={onClose}
          aria-label="Close clinical details"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className="clinical-form__grid">
        <label className="clinical-form__field">
          <span>Sex</span>
          <select value={value.patientSex} onChange={setField('patientSex')}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unspecified">Prefer not to say</option>
          </select>
        </label>

        <label className="clinical-form__field">
          <span>Age</span>
          <input
            type="number"
            min="0"
            max="130"
            value={value.patientAge}
            onChange={setField('patientAge')}
            placeholder="e.g. 45"
          />
        </label>

        <label className="clinical-form__field clinical-form__field--wide">
          <span>Present complaint</span>
          <input
            type="text"
            value={value.presentComplaint}
            onChange={setField('presentComplaint')}
            placeholder="e.g. Abdominal pain, 3 days"
          />
        </label>

        <label className="clinical-form__field clinical-form__field--wide">
          <span>Past history</span>
          <textarea
            rows={2}
            value={value.pastHistory}
            onChange={setField('pastHistory')}
            disabled={value.noSignificantHistory}
            placeholder="e.g. Type 2 diabetes, hypertension"
          />
        </label>

        <label className="clinical-form__field clinical-form__field--wide">
          <span>Prior surgical history / interventions</span>
          <textarea
            rows={2}
            value={value.priorSurgicalHistory}
            onChange={setField('priorSurgicalHistory')}
            disabled={value.noSignificantHistory}
            placeholder="e.g. Appendectomy 2018"
          />
        </label>

        <label className="clinical-form__checkbox clinical-form__field--wide">
          <input
            type="checkbox"
            checked={value.noSignificantHistory}
            onChange={setField('noSignificantHistory')}
          />
          <span>No significant previous history or surgical interventions</span>
        </label>
      </div>

      <div className="clinical-form__actions">
        <button
          type="button"
          className="shell-btn shell-btn--secondary"
          onClick={() => {
            onClear();
          }}
        >
          Clear
        </button>
        <button type="button" className="shell-btn shell-btn--primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
