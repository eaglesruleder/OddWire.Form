import type { HTMLAttributes } from 'react';

export type CoreControlProps<TValue> = {
    param: string;
    label?: string;
    value?: TValue;
    hidden?: boolean;
    stacked?: boolean;
    onChange?: (value: TValue, key: string, subkey?: string) => void;
    };

export type ControlOption = {
    value: string;
    label: string;
    };

export type TextValueType = 'text' | 'int' | 'decimal' | 'email' | 'phone';

export type KeyboardType = HTMLAttributes<HTMLElement>['inputMode'];

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

export type CollapsibleControlDef = ControlDefBase<'collapsible'> & {
    controls: ControlDef[];
    };
export type TabControlDef = ControlDefBase<'tab'> & {
    controls: ControlDef[];
    };
export type PopupControlDef = ControlDefBase<'popup'> & {
    controls: ControlDef[];
    };

export type ControlDef =
    | LabelControlDef
    | TextControlDef
    | TextAreaControlDef
    | CheckboxControlDef
    | RadioControlDef
    | DropdownControlDef
    | CollapsibleControlDef
    | TabControlDef
    | PopupControlDef;
