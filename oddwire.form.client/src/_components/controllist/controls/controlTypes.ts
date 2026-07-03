import type { HTMLAttributes } from 'react';

export type CoreControlProps<TValue> = {
    param: string;
    label?: string;
    value?: TValue;
    hidden?: boolean;
    stacked?: boolean;
    onChange?: (value: TValue, param: string) => void;
    };

export type ControlOption = {
    value: string;
    label: string;
    };

export type TextValueType = 'text' | 'int' | 'decimal' | 'email' | 'phone';

export type KeyboardType = HTMLAttributes<HTMLElement>['inputMode'];

// JSON control definitions — the config shape ControlItem dispatches on, distinct from
// the CoreControlProps a rendered leaf receives. Add a member here per new control type.
export type ControlDefBase<TType extends string, TValue = unknown> = {
    type: TType;
    param: string;
    label?: string;
    value?: TValue;
    hidden?: boolean;
    };

export type LabelControlDef = ControlDefBase<'label', string>;
export type TextControlDef = ControlDefBase<'text', string> & {
    valueType?: TextValueType;
    keyboardType?: KeyboardType;
    };
export type TextAreaControlDef = ControlDefBase<'textarea', string>;
export type CheckboxControlDef = ControlDefBase<'checkbox', boolean>;
export type RadioControlDef = ControlDefBase<'radio', string> & {
    controls: ControlOption[];
    };
export type DropdownControlDef = ControlDefBase<'dropdown', string> & {
    controls: ControlOption[];
    };

export type ControlDef =
    | LabelControlDef
    | TextControlDef
    | TextAreaControlDef
    | CheckboxControlDef
    | RadioControlDef
    | DropdownControlDef;
