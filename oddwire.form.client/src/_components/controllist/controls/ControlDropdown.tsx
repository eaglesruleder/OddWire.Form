import { useEffect, useMemo, useRef, useState } from 'react';
import Form from 'react-bootstrap/Form';

import type { ControlOption, CoreControlProps } from './controlTypes';

import { ControlBase } from './ControlBase';
import './controlDropdown.css';

type ControlDropdownProps = CoreControlProps<string> & {
    controls?: ControlOption[];
    };

export function ControlDropdown(props: ControlDropdownProps)
{
    const options = props.controls ?? [];
    const selected = options.find(option => option.value === props.value);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(selected?.label ?? '');
    const [highlight, setHighlight] = useState(0);
    const root = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if (!open)
            setQuery(selected?.label ?? '');
    }, [open, selected?.label]);

    useEffect(() =>
    {
        const onPointerDown = (event: PointerEvent) =>
        {
            if (root.current && !root.current.contains(event.target as Node))
                setOpen(false);
        };

        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, []);

    const filtered = useMemo(() =>
    {
        const needle = query.trim().toLowerCase();
        return needle
        ?   options.filter(option => option.label.toLowerCase().includes(needle))
        :   options;
    }, [options, query]);

    const choose = (option: ControlOption) =>
    {
        setQuery(option.label);
        setOpen(false);
        props.onChange?.(option.value, props.param);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) =>
    {
        if (event.key === 'ArrowDown')
        {
            event.preventDefault();
            setOpen(true);
            setHighlight(value => Math.min(value + 1, filtered.length - 1));
        }
        else if (event.key === 'ArrowUp')
        {
            event.preventDefault();
            setHighlight(value => Math.max(value - 1, 0));
        }
        else if (event.key === 'Enter')
        {
            if (open && filtered[highlight])
            {
                event.preventDefault();
                choose(filtered[highlight]);
            }
        }
        else if (event.key === 'Escape')
        {
            setOpen(false);
        }
    };

    return (
        <ControlBase {...props}>
            <div className="combo" ref={root}>
                <Form.Control
                    id={props.param}
                    type="text"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={`${props.param}-options`}
                    aria-autocomplete="list"
                    placeholder={props.placeholder ?? 'Select...'}
                    value={query}
                    disabled={props.disabled}
                    autoComplete="off"
                    onFocus={() => setOpen(true)}
                    onClick={() => setOpen(true)}
                    onChange={event =>
                    {
                        setQuery(event.target.value);
                        setOpen(true);
                        setHighlight(0);
                    }}
                    onKeyDown={onKeyDown}
                />
                <button
                    type="button"
                    className="combo-toggle"
                    tabIndex={-1}
                    disabled={props.disabled}
                    aria-label="Show options"
                    onClick={() => setOpen(value => !value)}
                >
                    ▾
                </button>

                {open && !props.disabled &&
                <div id={`${props.param}-options`} className="combo-menu" role="listbox">
                    {filtered.length > 0
                    ?   filtered.map((option, index) =>
                        <button
                            key={option.value}
                            type="button"
                            className={['combo-option', index === highlight ? 'active' : '', option.value === props.value ? 'selected' : ''].filter(Boolean).join(' ')}
                            role="option"
                            aria-selected={option.value === props.value}
                            onMouseEnter={() => setHighlight(index)}
                            onClick={() => choose(option)}
                        >
                            {option.label}
                        </button>
                        )
                    :   <span className="combo-empty">{props.placeholder ?? 'No options'}</span>
                    }
                </div>
                }
            </div>
        </ControlBase>
        );
}
