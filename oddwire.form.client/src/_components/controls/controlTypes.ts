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
