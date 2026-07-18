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
    cellClassName?: string;   // grid-cell class on the ControlBase row (e.g. col-N spans in a control-grid)
    rows?: number;
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
    fill?: boolean;   // on select, write every column of the chosen row into its matching param
    };

export type TextValueType = 'text' | 'int' | 'decimal' | 'email' | 'phone';

export type KeyboardType = HTMLAttributes<HTMLElement>['inputMode'];

export type ControlPdfBox = {
    x: number;
    y: number;
    w?: number;
    h?: number;
    fontSize?: number;                        // per-box override of settings.export.pdf.fontSize; 0/absent = use default
    align?: 'left' | 'center' | 'right';      // horizontal: relative to [x, x+w] when w set, else to the x anchor
    valign?: 'top' | 'middle' | 'bottom';     // vertical: relative to [y, y+h] when h set, else to the y anchor
    shrinkToFit?: boolean;                     // with w set: scale font down until the wrapped text fits w (and h); else ellipsis-clip to h
    };

export type ControlPdfDef = Record<string, ControlPdfBox[]>;

export type ControlDefBase<TType extends string, TValue = unknown> = {
    type: TType;
    param: string;
    label?: string;
    value?: TValue;
    hidden?: boolean;
    disabled?: boolean;
    placeholder?: string;
    stacked?: boolean;
    cellClassName?: string;
    rows?: number;
    pdf?: ControlPdfDef;
    };

export type LabelControlDef = ControlDefBase<'label', string> & {
    labelFor?: string;
    };
export type TextControlDef = ControlDefBase<'text', string> & {
    valueType?: TextValueType;
    keyboardType?: KeyboardType;
    };
export type TextAreaControlDef = ControlDefBase<'textarea', string> & {
    rows?: number;
    };
export type CheckboxControlDef = ControlDefBase<'checkbox', boolean>;
export type ImageControlDef = ControlDefBase<'image', string>;   // value is a URL/URN loaded into <img>; static (capture is future)
export type RadioControlDef = ControlDefBase<'radio', string> & {
    controls?: ControlOption[];
    dbOptions?: DbOptions;
    };
export type DropdownControlDef = ControlDefBase<'dropdown', string> & {
    controls?: ControlOption[];
    dbOptions?: DbOptions;
    };

export type LooperRowInstance = {
    formId?: string;
    instanceId?: string;
    dateModified?: string;
    controls: {
        param: string;
        [key: string]: unknown;
        }[];
    };

export type CollapsibleControlDef = ControlDefBase<'collapsible'> & {
    controls: ControlDef[];
    subtitle?: string;
    };
export type TabControlDef = ControlDefBase<'tab'> & {
    controls: ControlDef[];
    };
export type PopupControlDef = ControlDefBase<'popup'> & {
    controls: ControlDef[];
    };
export type LooperControlDef = ControlDefBase<'looper', LooperRowInstance[]> & {
    controls: ControlDef[];
    addRows?: boolean;
    };

export type ControlDef =
    | LabelControlDef
    | TextControlDef
    | TextAreaControlDef
    | CheckboxControlDef
    | ImageControlDef
    | RadioControlDef
    | DropdownControlDef
    | CollapsibleControlDef
    | TabControlDef
    | PopupControlDef
    | LooperControlDef;

// Intent: export-flatten plugin contract. A control's flatten returns { value } to emit under its param, or undefined to
// emit nothing (layout recurses via ctx). The walker owns the tree walk + pdf emission; plugins only shape their node.
export type FlattenResult = { value: unknown } | undefined;

export type FlattenCtx = {
    recurse: (children: ControlDef[]) => void;                                 // flatten children into the same flat scope
    scope: (children: ControlDef[], row: unknown) => Record<string, unknown>;  // flatten children into a fresh row scope
    };
