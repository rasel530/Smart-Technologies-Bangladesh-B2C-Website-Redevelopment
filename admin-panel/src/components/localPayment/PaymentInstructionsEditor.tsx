/**
 * Payment Instructions Editor Component
 *
 * Admin component for editing payment instructions in JSON format.
 */

import React, { useState, useEffect } from 'react';

interface PaymentInstruction {
  step: number;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
}

interface PaymentInstructionsEditorProps {
  instructions?: string;
  onChange: (instructions: string) => void;
}

const PaymentInstructionsEditor: React.FC<PaymentInstructionsEditorProps> = ({
  instructions,
  onChange
}) => {
  const [parsedInstructions, setParsedInstructions] = useState<PaymentInstruction[]>([]);

  useEffect(() => {
    if (instructions) {
      try {
        setParsedInstructions(JSON.parse(instructions));
      } catch (e) {
        console.error('[PaymentInstructionsEditor] Failed to parse instructions:', e);
      }
    }
  }, [instructions]);

  const handleAddStep = () => {
    const newStep: PaymentInstruction = {
      step: parsedInstructions.length + 1,
      title_en: '',
      title_bn: '',
      description_en: '',
      description_bn: ''
    };
    setParsedInstructions([...parsedInstructions, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    const updated = parsedInstructions.filter((_, i) => i !== index);
    // Renumber steps
    const renumbered = updated.map((step, i) => ({ ...step, step: i + 1 }));
    setParsedInstructions(renumbered);
  };

  const handleStepChange = (index: number, field: keyof PaymentInstruction, value: string) => {
    const updated = [...parsedInstructions];
    updated[index][field] = value;
    setParsedInstructions(updated);
  };

  useEffect(() => {
    onChange(JSON.stringify(parsedInstructions, null, 2));
  }, [parsedInstructions, onChange]);

  return (
    <div className="payment-instructions-editor">
      <h3 className="payment-instructions-editor__title">
        Payment Instructions
      </h3>

      <div className="payment-instructions-editor__steps">
        {parsedInstructions.map((step, index) => (
          <div key={index} className="payment-instructions-editor__step">
            <div className="payment-instructions-editor__step-header">
              <span className="payment-instructions-editor__step-number">
                Step {step.step}
              </span>
              <button
                className="payment-instructions-editor__remove-button"
                onClick={() => handleRemoveStep(index)}
                title="Remove step"
              >
                🗑️
              </button>
            </div>

            <div className="payment-instructions-editor__step-content">
              <div className="payment-instructions-editor__field-group">
                <div className="payment-instructions-editor__field">
                  <label>English Title</label>
                  <input
                    type="text"
                    value={step.title_en}
                    onChange={(e) => handleStepChange(index, 'title_en', e.target.value)}
                    placeholder="e.g., Open your bKash app"
                  />
                </div>
                <div className="payment-instructions-editor__field">
                  <label>Bengali Title</label>
                  <input
                    type="text"
                    value={step.title_bn}
                    onChange={(e) => handleStepChange(index, 'title_bn', e.target.value)}
                    placeholder="e.g., আপনার বিকাশ অ্যাপ খুলুন"
                  />
                </div>
              </div>

              <div className="payment-instructions-editor__field-group">
                <div className="payment-instructions-editor__field">
                  <label>English Description</label>
                  <textarea
                    value={step.description_en}
                    onChange={(e) => handleStepChange(index, 'description_en', e.target.value)}
                    placeholder="e.g., Go to 'Send Money' option"
                    rows={2}
                  />
                </div>
                <div className="payment-instructions-editor__field">
                  <label>Bengali Description</label>
                  <textarea
                    value={step.description_bn}
                    onChange={(e) => handleStepChange(index, 'description_bn', e.target.value)}
                    placeholder="e.g., 'টাকা পাঠান' অপশনে যান"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="payment-instructions-editor__add-button"
        onClick={handleAddStep}
      >
        + Add Step
      </button>

      <div className="payment-instructions-editor__preview">
        <h4>JSON Preview:</h4>
        <pre>{JSON.stringify(parsedInstructions, null, 2)}</pre>
      </div>
    </div>
  );
};

export default PaymentInstructionsEditor;
