import type { HTMLAttributes, ReactNode } from 'react';

export type CoreControlProps<TValue> = {
    param: string;
    label?: string;
    value?: TValue;
    hidden?: boolean;
    stacked?: boolean;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    // Intent: true → render the value as static text; a function → render its own node in place of the control
    // (param is fixed to the unknown-valued props so readonly stays invariant across TValue and rides the {...props} spread)
    readonly?: boolean | ((props: CoreControlProps<unknown>) => ReactNode);
    onChange?: (value: TValue, key: string, subkey?: string) => void;
    };

export type ControlOption = {
    value: string;
    label: string;
    };

// Intent: filter string means formParam === tableParam (dependent list on one shared param name)
export type DbOptionsFilter = string | { formParam: string; tableParam: string };

export type DbOptions = string | {
    table: string;
    valueParam: string;
    labelParam?: string;
    filter?: DbOptionsFilter;
    joinOptions?: boolean;
    };

export type TextValueType = 'text' | 'int' | 'decimal' | 'email' | 'phone';

export type KeyboardType = HTMLAttributes<HTMLElement>['inputMode'];

export type ControlDefBase<TType extends string, TValue = unknown> = {
    type: TType;
    param: string;
    label?: string;
    value?: TValue;
    hidden?: boolean;
    disabled?: boolean;
    placeholder?: string;
    };

export type LabelControlDef = ControlDefBase<'label', string>;
export type TextControlDef = ControlDefBase<'text', string> & {
    valueType?: TextValueType;
    keyboardType?: KeyboardType;
    };
export type TextAreaControlDef = ControlDefBase<'textarea', string>;
export type CheckboxControlDef = ControlDefBase<'checkbox', boolean>;
export type RadioControlDef = ControlDefBase<'radio', string> & {
    controls?: ControlOption[];
    dbOptions?: DbOptions;
    };
export type DropdownControlDef = ControlDefBase<'dropdown', string> & {
    controls?: ControlOption[];
    dbOptions?: DbOptions;
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
