import Button from 'react-bootstrap/Button';
import type { ButtonProps } from 'react-bootstrap/Button';

type ControlButtonProps = {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    className?: string;
    };

export const ControlButton = ({ label, onClick, disabled, variant, size, className }: ControlButtonProps) =>
    <Button type="button" onClick={onClick} disabled={disabled} variant={variant} size={size} className={className}>{label}</Button>;
