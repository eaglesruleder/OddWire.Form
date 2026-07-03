import type { HTMLAttributes } from 'react';

// Shared control contracts. Kept deliberately small for Stage 1 —
// the full discriminated ControlDef union arrives with the JSON renderer (Stage 2).

export type CoreControlProps<TValue> = {
  param: string;
  label?: string;
  value?: TValue;
  hidden?: boolean;
  onChange?: (value: TValue, param: string) => void;
};

export type ControlOption = {
  value: string;
  label: string;
};

// Semantic meaning of a text control's value. Drives later parse/normalise — not typing behaviour yet.
export type TextValueType = 'text' | 'int' | 'decimal' | 'email' | 'phone';

// UI/input hint only — the on-screen keyboard, nothing more.
export type KeyboardType = HTMLAttributes<HTMLElement>['inputMode'];
