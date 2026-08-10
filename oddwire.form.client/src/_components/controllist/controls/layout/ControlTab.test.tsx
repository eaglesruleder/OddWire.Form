import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ControlTab } from './ControlTab';

describe('ControlTab', () =>
{
    afterEach(() =>
    {
        vi.restoreAllMocks();
    });

    it('scrolls the page to the top when switching page-layout tabs', () =>
    {
        const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

        render(<ControlTab pageLayout sections={[
            { param: 'one', label: 'One', content: <div>First</div> },
            { param: 'two', label: 'Two', content: <div>Second</div> },
        ]} />);

        fireEvent.click(screen.getByRole('button', { name: 'Two' }));

        expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });
    });

    it('does not scroll the page when switching inline tabs', () =>
    {
        const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

        render(<ControlTab sections={[
            { param: 'one', label: 'One', content: <div>First</div> },
            { param: 'two', label: 'Two', content: <div>Second</div> },
        ]} />);

        fireEvent.click(screen.getByRole('button', { name: 'Two' }));

        expect(scrollTo).not.toHaveBeenCalled();
    });
});
