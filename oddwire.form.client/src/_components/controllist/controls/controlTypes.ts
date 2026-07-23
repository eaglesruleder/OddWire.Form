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

// Intent: an image control's value is a string (external URL/data-URI) OR a captured record — id keys the full-res blob
// store, thumbnail is a small data-URI shown natively. isCapturedImage discriminates the two; imageValueText keeps the
// object from stringifying to [object Object] wherever a value is projected as text (landing labels, etc.).
export type CapturedImage = {
    id: string;
    thumbnail: string;
    };

export function isCapturedImage(value: unknown): value is CapturedImage
{
    return typeof value === 'object'
    &&  value !== null
    && 'id' in value
    && 'thumbnail' in value;
}

// Intent: single text representation of an image value. `display` (default) is the type-blind projection view — it can only
// recognise the captured object; a bare string is indistinguishable from a text field there, so it returns ''. `export` is
// for callers that KNOW the control is an image (the flatten/export walkers), so a string is labelled 'External image'.
export function imageValueText(value: unknown, mode: 'display' | 'export' = 'display'): string
{
    if (isCapturedImage(value))
        return 'Captured image';

    if (mode === 'export' && typeof value === 'string' && value !== '')
        return 'External image';

    return '';
}

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
// Intent: enable the draw/signature capture surface. Bare true → a plain draw pad; the object tunes canvas size, pen, an
// optional solid background, and whether file upload is offered alongside draw (allowUpload → annotate an uploaded image).
export type DrawConfig = boolean | {
    w?: number;
    h?: number;
    penColor?: string;
    background?: string;
    allowUpload?: boolean;
    };

export type ImageControlDef = ControlDefBase<'image', string | CapturedImage> & {   // string = external URL/data-URI; object = captured (full-res in blob store)
    draw?: DrawConfig;
    };
// Intent: authoring alias — a signature is an image control preset to draw-only with a wide-short canvas (ControlItem maps it)
export type SignatureControlDef = ControlDefBase<'signature', string | CapturedImage> & {
    draw?: DrawConfig;
    };
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
    icon?: string;    // corner glyph — a literal (emoji/char) or a {param} token resolved against the instance
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
    | SignatureControlDef
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
