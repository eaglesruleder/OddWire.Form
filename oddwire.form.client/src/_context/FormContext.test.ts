import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('localforage');

import { formStore, paramList } from './FormContext';
import { instanceStore } from './InstanceContext';
import type { FormDefinition } from './types';
import type { ControlDef } from '../_components/controllist';
import { __resetLocalforage } from '../../__mocks__/localforage';

const control = (def: Partial<ControlDef> & { type: string; param: string }): ControlDef =>
    def as unknown as ControlDef;

const form = (controls: ControlDef[], extra: Partial<FormDefinition> = {}): FormDefinition =>
    ({ formId: 'f1', label: 'F', controls, ...extra });

beforeEach(() =>
{
    __resetLocalforage();
    formStore.index = [];
    formStore.initialised = false;
    instanceStore.index = [];
    instanceStore.initialised = false;
});

describe('paramList', () =>
{
    it('normalises undefined / string / array into a string[]', () =>
    {
        expect(paramList(undefined)).toEqual([]);
        expect(paramList('a')).toEqual(['a']);
        expect(paramList(['a', 'b'])).toEqual(['a', 'b']);
    });
});

describe('FormStore.saveForm', () =>
{
    it('assigns a formId when missing and indexes the form', async () =>
    {
        const id = await formStore.saveForm({ label: 'X', controls: [] } as unknown as FormDefinition);
        expect(id).toBeTruthy();
        expect(formStore.list().map(e => e.formId)).toContain(id);
    });

    it('builds projectionLabels from control labels, recursing layout children', async () =>
    {
        await formStore.saveForm(form([
            control({ type: 'text', param: 'a', label: 'Alpha' }),
            control({ type: 'collapsible', param: 'grp', label: 'Group', controls: [control({ type: 'text', param: 'b', label: 'Beta' })] }),
        ]));

        const entry = formStore.list().find(e => e.formId === 'f1');
        expect(entry?.projectionLabels).toMatchObject({ a: 'Alpha', b: 'Beta', grp: 'Group' });
    });

    it('falls back to the param as its own label when none is given', async () =>
    {
        await formStore.saveForm(form([control({ type: 'text', param: 'a' })]));
        expect(formStore.list()[0].projectionLabels?.a).toBe('a');
    });

    it('captures a form-level default for the thumbnail param', async () =>
    {
        await formStore.saveForm(form(
            [control({ type: 'image', param: 'pic', value: 'default.png' })],
            { thumbnailParam: 'pic' }));

        expect(formStore.list()[0].thumbnailDefault).toBe('default.png');
    });

    it('indexes the read-only flag', async () =>
    {
        await formStore.saveForm(form([], { readonly: true }));

        expect(formStore.list()[0].readonly).toBe(true);
    });
});

describe('FormStore.getProjectionParams', () =>
{
    it('returns the indexed projection config for a form', async () =>
    {
        await formStore.saveForm(form([control({ type: 'text', param: 'a', label: 'A' })], { displayParam: ['a'] }));

        expect(formStore.getProjectionParams('f1')).toMatchObject({ displayParam: ['a'], projectionLabels: { a: 'A' } });
    });

    it('returns undefineds for an unknown form', () =>
    {
        expect(formStore.getProjectionParams('missing').displayParam).toBeUndefined();
    });
});

describe('FormStore.deleteForm', () =>
{
    it('removes the form from the index and cascades to its instances', async () =>
    {
        await formStore.saveForm(form([]));
        await instanceStore.save({ formId: 'f1', controls: [] });

        await formStore.deleteForm('f1');

        expect(formStore.list().find(e => e.formId === 'f1')).toBeUndefined();
        expect(instanceStore.list('f1')).toHaveLength(0);
    });
});
