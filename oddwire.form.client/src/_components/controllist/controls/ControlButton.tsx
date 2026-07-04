import Button from 'react-bootstrap/Button';

type ControlButtonProps = {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    };

export const ControlButton = ({ label, onClick, disabled }: ControlButtonProps) =>
    <Button type="button" onClick={onClick} disabled={disabled}>{label}</Button>;
