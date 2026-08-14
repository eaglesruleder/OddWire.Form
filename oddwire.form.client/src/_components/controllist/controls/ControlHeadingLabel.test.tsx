import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InstanceEntity } from '../../../_context';

import { ControlCheckbox } from './ControlCheckbox';
import { ControlText } from './ControlText';
import { ControlTextField } from './ControlTextField';
import { ControlCollapsible } from './layout/ControlCollapsible';

describe('control label headings', () =>
{
    it('renders label controls as h2 headings by default', () =>
    {
        render(<ControlText param="summary" label="Summary" value="Body" />);

        const heading = screen.getByRole('heading', { level: 2, name: 'Summary' });

        expect(heading.tagName).toBe('H2');
        expect(heading).toHaveClass('control-heading', 'h2', 'separator');
    });

    it('lets label controls override their heading level', () =>
    {
        render(<ControlText param="summary" label="Summary" labelHeading="h2" value="Body" />);

        expect(screen.getByRole('heading', { level: 2, name: 'Summary' })).toHaveClass('h2');
    });

    it('styles field labels as h5 by default and keeps input association', () =>
    {
        render(<ControlTextField param="name" label="Name" value="" onChange={vi.fn()} />);

        const label = screen.getByText('Name');

        expect(label.tagName).toBe('LABEL');
        expect(label).toHaveClass('control-heading', 'h5');
        expect(screen.getByLabelText('Name')).toHaveAttribute('id', 'name');
    });

    it('lets field and layout labels override their heading class', () =>
    {
        render(
            <>
                <ControlCheckbox param="enabled" label="Enabled" labelHeading="h6" value={false} onChange={vi.fn()} />
                <ControlCollapsible
                    param="section"
                    label="Section"
                    labelHeading="h4"
                    controls={[]}
                    instance={new InstanceEntity({ controls: [] })}
                    onChange={vi.fn()}
                />
            </>
        );

        expect(screen.getByText('Enabled')).toHaveClass('h6');
        expect(screen.getByText('Section')).toHaveClass('h4');
    });
});
