import { describe, expect, it } from 'vitest';

import { InstanceEntity } from './InstanceEntity';
import type { ControlDef } from '../_components/controllist';

const textControl = (param: string, value: string): ControlDef =>
    ({ type: 'text', param, value }) as ControlDef;

describe('InstanceEntity clear values', () =>
{
    it('keeps an empty string as an explicit clear over a definition default', () =>
    {
        const entity = InstanceEntity.from({ formId: 'f1', controls: [] });
        const control = textControl('name', 'Default');

        entity.setValue('name', 'value', '');

        expect(entity.instance.controls).toContainEqual({ param: 'name', value: '' });
        expect(entity.resolve(control).value).toBe('');
    });

    it('keeps null as an explicit clear over a definition default', () =>
    {
        const entity = InstanceEntity.from({ formId: 'f1', controls: [] });
        const control = textControl('name', 'Default');

        entity.setValue('name', 'value', null);

        expect(entity.instance.controls).toContainEqual({ param: 'name', value: null });
        expect(entity.resolve(control).value).toBeNull();
    });

    it('uses undefined to crop the overlay and restore the definition default', () =>
    {
        const entity = InstanceEntity.from({ formId: 'f1', controls: [{ param: 'name', value: '' }] });
        const control = textControl('name', 'Default');

        entity.setValue('name', 'value', undefined);

        expect(entity.get('name')).toBeUndefined();
        expect(entity.resolve(control).value).toBe('Default');
    });
});
