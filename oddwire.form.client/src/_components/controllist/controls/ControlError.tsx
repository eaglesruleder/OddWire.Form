import type { ReactNode } from 'react';

import { ControlBase } from './ControlBase';

type ControlErrorProps = {
    param?: string;
    children: ReactNode;
    };

export const ControlError = ({ param, children }: ControlErrorProps) =>
    <ControlBase param={param ?? 'error'} label="Error" className="error" labelClassName="bold">{children}</ControlBase>;
