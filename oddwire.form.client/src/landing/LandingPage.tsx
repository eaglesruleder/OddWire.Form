import { useContext, useReducer, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { SwipeAction, SwipeableList, SwipeableListItem, TrailingActions, Type as SwipeableListType } from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

import type { DisplayParam, FormIndexEntry, InstanceIndexEntry, ParamList } from '../_context';

import { FormContext, InstanceContext, FormImageContext, PdfTemplateContext } from '../_context';
import { StripLayout } from '../_components/layout';
import { ControlDropdown } from '../_components/controllist/controls';
import { isCapturedImage, imageValueText } from '../_components/controllist';
import './landing.css';

export function LandingPage()
{
    const { list: listForms, deleteForm } = useContext(FormContext);
    const { list: listInstances, deleteInstance, deleteFormInstances } = useContext(InstanceContext);
    const { deleteTemplate } = useContext(PdfTemplateContext);
    const images = useContext(FormImageContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const forms = listForms();

    const [expandedFormId, setExpandedFormId] = useState<string | null>(() => initialExpandedFormId(forms, searchParams));
    const [deletePromptForm, setDeletePromptForm] = useState<FormIndexEntry | null>(null);
    const [instanceSelection, setInstanceSelection] = useState<{ formId: string; selectedIds: Set<string> } | null>(null);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    const openForm = (form: FormIndexEntry, instances: InstanceIndexEntry[]) =>
    {
        if (instanceSelection?.formId === form.formId)
            return;

        if (form.readonly && instances.length <= 1)
        {
            navigate(openReadonlyFormPath(form, instances));
            return;
        }

        setExpandedFormId(current => current === form.formId ? null : form.formId);
    };

    const openReadonlyForm = (form: FormIndexEntry, instances: InstanceIndexEntry[]) =>
    {
        if (instances.length <= 1)
        {
            navigate(openReadonlyFormPath(form, instances));
            return;
        }

        setExpandedFormId(form.formId);
    };

    const openDeletePrompt = (form: FormIndexEntry) =>
    {
        setDeletePromptForm(form);
    };

    const startInstanceSelection = (form: FormIndexEntry) =>
    {
        setDeletePromptForm(null);
        setExpandedFormId(form.formId);
        setInstanceSelection({ formId: form.formId, selectedIds: new Set() });
    };

    const toggleSelectedInstance = (instanceId: string, checked: boolean) =>
        setInstanceSelection(selection =>
        {
            if (!selection)
                return selection;

            const selectedIds = new Set(selection.selectedIds);
            if (checked)
                selectedIds.add(instanceId);
            else
                selectedIds.delete(instanceId);

            return { ...selection, selectedIds };
        });

    const cancelInstanceSelection = () =>
    {
        setInstanceSelection(null);
    };

    const deleteSelectedInstances = async (form: FormIndexEntry, instances: InstanceIndexEntry[]) =>
    {
        if (!instanceSelection || instanceSelection.selectedIds.size === 0)
            return;

        const selected = instances.filter(instance => instanceSelection.selectedIds.has(instance.instanceId));
        await deleteInstances(form, selected);
        setInstanceSelection(null);
    };

    const deleteAllSavedInstances = async (form: FormIndexEntry) =>
    {
        const instances = listInstances(form.formId);
        await deleteInstanceImages(form, instances);
        await deleteFormInstances(form.formId);
        setDeletePromptForm(null);
        setInstanceSelection(null);
        bumpRender();
    };

    const deleteInstalledForm = async (form: FormIndexEntry) =>
    {
        const ownedImages = await images.imagesFor({ formId: form.formId });

        await Promise.all(ownedImages.map(record => images.deleteImage(record.id)));
        await deleteTemplate(form.formId);
        await deleteForm(form.formId);

        setDeletePromptForm(null);
        setExpandedFormId(current => current === form.formId ? null : current);
        setInstanceSelection(null);
        bumpRender();
    };

    const deleteInstances = async (form: FormIndexEntry, instances: InstanceIndexEntry[]) =>
    {
        await deleteInstanceImages(form, instances);
        await Promise.all(instances.map(instance => deleteInstance(instance.instanceId)));
        bumpRender();
    };

    const deleteInstanceImages = async (form: FormIndexEntry, instances: InstanceIndexEntry[]) =>
    {
        const imageGroups = await Promise.all(
            instances.map(instance => images.imagesFor({ formId: form.formId, instanceId: instance.instanceId }))
        );

        await Promise.all(imageGroups.flat().map(record => images.deleteImage(record.id)));
    };

    return (
        <StripLayout left="⚙" leftLink="/settings" title="OddWire Forms">
            <div className="text-muted mb-3">Select a form</div>

            <div className="d-flex flex-column gap-2">
                {forms.map(form =>
                {
                    const instances = listInstances(form.formId);
                    const expanded = expandedFormId === form.formId;
                    const selection = instanceSelection?.formId === form.formId ? instanceSelection : undefined;
                    const formLabel = form.label ?? form.formId;
                    const formButtonLabel = form.readonly && instances.length <= 1
                    ?   `Open ${formLabel}`
                    :   `${expanded ? 'Collapse' : 'Open'} ${formLabel}`;

                    return (
                    <div key={form.formId} className="d-flex flex-column gap-2">
                        <div className="d-flex gap-2">
                            <Button
                                className="fill d-flex justify-content-between align-items-center"
                                variant="outline-primary"
                                aria-label={formButtonLabel}
                                onClick={() => openForm(form, instances)}
                            >
                                <span>
                                    {formLabel}
                                    {form.version ? <span className="text-muted"> v{form.version}</span> : null}
                                </span>
                                {instances.length > 0 &&
                                <span className="text-muted">{instances.length}</span>
                                }
                            </Button>
                            <FormRowAction
                                form={form}
                                expanded={expanded}
                                instances={instances}
                                selection={selection}
                                onCancelSelection={cancelInstanceSelection}
                                onDeletePrompt={openDeletePrompt}
                                onDeleteSelected={deleteSelectedInstances}
                                onOpenReadonly={openReadonlyForm}
                            />
                            {!expanded && !selection && !form.readonly &&
                            <Link className="btn btn-outline-secondary" to={`/form/${form.formId}`}>New</Link>
                            }
                        </div>

                        {expanded
                        ?   <InstanceList
                                form={form}
                                instances={instances}
                                searchParams={searchParams}
                                selection={selection}
                                onDeleted={bumpRender}
                                onToggleSelected={toggleSelectedInstance}
                            />
                        :   null}
                    </div>
                    );
                }
                    )}

                {forms.length === 0
                ?   <span className="text-muted">No forms available.</span>
                :   null}
            </div>

            {deletePromptForm &&
            <DeleteFormDialog
                form={deletePromptForm}
                instanceCount={listInstances(deletePromptForm.formId).length}
                onCancel={() => setDeletePromptForm(null)}
                onDeleteAllInstances={deleteAllSavedInstances}
                onDeleteForm={deleteInstalledForm}
                onSelectInstances={startInstanceSelection}
            />
            }
        </StripLayout>
        );
}

function FormRowAction({
    form,
    expanded,
    instances,
    selection,
    onCancelSelection,
    onDeletePrompt,
    onDeleteSelected,
    onOpenReadonly,
}: {
    form: FormIndexEntry;
    expanded: boolean;
    instances: InstanceIndexEntry[];
    selection?: { selectedIds: Set<string> };
    onCancelSelection: () => void;
    onDeletePrompt: (form: FormIndexEntry) => void;
    onDeleteSelected: (form: FormIndexEntry, instances: InstanceIndexEntry[]) => Promise<void>;
    onOpenReadonly: (form: FormIndexEntry, instances: InstanceIndexEntry[]) => void;
})
{
    if (selection)
    {
        const hasSelection = selection.selectedIds.size > 0;
        return (
            <Button
                variant={hasSelection ? 'outline-danger' : 'outline-secondary'}
                aria-label={hasSelection ? 'Delete selected instances' : 'Cancel instance selection'}
                onClick={() => hasSelection ? void onDeleteSelected(form, instances) : onCancelSelection()}
            >
                {hasSelection ? 'Delete' : 'Cancel'}
            </Button>
            );
    }

    if (form.readonly)
        return (
            <Button variant="outline-secondary" aria-label={`Open readonly form ${form.label ?? form.formId}`} onClick={() => onOpenReadonly(form, instances)}>
                Open
            </Button>
            );

    if (!expanded && !form.readonly)
        return null;

    return (
        <Button variant="outline-danger" aria-label={`Delete ${form.label ?? form.formId}`} onClick={() => onDeletePrompt(form)}>
            Delete
        </Button>
        );
}

function DeleteFormDialog({
    form,
    instanceCount,
    onCancel,
    onDeleteAllInstances,
    onDeleteForm,
    onSelectInstances,
}: {
    form: FormIndexEntry;
    instanceCount: number;
    onCancel: () => void;
    onDeleteAllInstances: (form: FormIndexEntry) => Promise<void>;
    onDeleteForm: (form: FormIndexEntry) => Promise<void>;
    onSelectInstances: (form: FormIndexEntry) => void;
})
{
    const label = form.label ?? form.formId;

    return (
        <Modal show onHide={onCancel} centered dialogClassName="delete-form-dialog">
            <Modal.Header closeButton>
                <Modal.Title>Delete {label}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex flex-column gap-2">
                    <Button variant="outline-danger" onClick={() => void onDeleteForm(form)}>Delete form</Button>
                    <Button variant="outline-danger" disabled={instanceCount === 0} onClick={() => void onDeleteAllInstances(form)}>Delete all instances</Button>
                    <Button variant="outline-secondary" disabled={instanceCount === 0} onClick={() => onSelectInstances(form)}>Delete instances</Button>
                    <Button variant="outline-secondary" onClick={onCancel}>Cancel</Button>
                </div>
            </Modal.Body>
        </Modal>
        );
}

function openReadonlyFormPath(form: FormIndexEntry, instances: InstanceIndexEntry[]): string
{
    const instance = instances[0];
    return instance ? `/form/${form.formId}/${instance.instanceId}` : `/form/${form.formId}`;
}

function requestedFormId(forms: FormIndexEntry[], searchParams: URLSearchParams): FormIndexEntry | undefined
{
    const requested = searchParams.get('FormID') ?? searchParams.get('formId');

    if (!requested)
        return undefined;

    return forms.find(form => form.formId === requested || form.label === requested);
}

function initialExpandedFormId(forms: FormIndexEntry[], searchParams: URLSearchParams): string | null
{
    return requestedFormId(forms, searchParams)?.formId
        ?? (forms.length === 1 ? forms[0].formId : null);
}

function InstanceList({
    form,
    instances,
    searchParams,
    selection,
    onDeleted,
    onToggleSelected,
}: {
    form: FormIndexEntry;
    instances: InstanceIndexEntry[];
    searchParams: URLSearchParams;
    selection?: { selectedIds: Set<string> };
    onDeleted: () => void;
    onToggleSelected: (instanceId: string, checked: boolean) => void;
})
{
    const filterParams = form.filterParam ?? [];
    const orderParams = paramList(form.orderParam);
    const groupParams = paramList(form.groupParam);
    const routeGroupFilters = routeFilters(groupParams, searchParams);

    const [filters, setFilters] = useState<Record<string, string>>(() => routeFilters(filterParams, searchParams));
    const [orderStep, setOrderStep] = useState(0);
    const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});

    const filtered = selection ? instances : instances.filter(instance =>
        filterParams.every(param => !filters[param] || valueText(instance.filter?.[param]) === filters[param]));
    const ordered = orderInstances(filtered, orderParams, orderStep);
    const groups = groupInstances(ordered, groupParams);

    const cycleOrder = () =>
        setOrderStep(step => (step + 1) % (orderParams.length * 2 + 1));

    const toggleGroup = (label: string) =>
        setGroupOpen(value => ({ ...value, [label]: !isGroupOpen(label, value, routeGroupFilters) }));

    return (
        <div className="d-flex flex-column gap-2 ms-3 mb-3">
            {!selection && (filterParams.length > 0 || orderParams.length > 0) &&
            <div className="d-flex justify-content-end flex-wrap gap-2">
                {filterParams.map(param =>
                    <ControlDropdown
                        key={param}
                        param={param}
                        value={filters[param] ?? ''}
                        stacked
                        label=""
                        placeholder={`${paramLabel(param)}: All`}
                        className="mb-0"
                        controls={filterOptions(instances, param).map(option =>
                            ({ value: option, label: option || `${paramLabel(param)}: All` }))}
                        onChange={value => setFilters(filters => ({ ...filters, [param]: String(value) }))}
                    />
                    )}

                {orderParams.length > 0 &&
                <Button size="sm" className="instance-order-button" variant={orderStep ? 'primary' : 'outline-primary'} onClick={cycleOrder}>
                    Order: {orderLabel(orderParams, orderStep)}
                </Button>
                }
            </div>
            }

            {groups.map(group =>
                groupParams.length > 0
                ?   <div key={group.label} className="d-flex flex-column gap-1">
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            className="d-flex justify-content-between align-items-center"
                            onClick={() => toggleGroup(group.label)}
                        >
                            <span>{isGroupOpen(group.label, groupOpen, routeGroupFilters) ? '▾' : '▸'} {group.label}</span>
                            <span className="text-muted">{group.instances.length}</span>
                        </Button>

                        {(selection || isGroupOpen(group.label, groupOpen, routeGroupFilters)) &&
                        <InstanceLinks form={form} instances={group.instances} selection={selection} onDeleted={onDeleted} onToggleSelected={onToggleSelected} />
                        }
                    </div>
                :   <InstanceLinks key={group.label} form={form} instances={group.instances} selection={selection} onDeleted={onDeleted} onToggleSelected={onToggleSelected} />
                )}

            {ordered.length === 0 && instances.length > 0
            ?   <span className="text-muted">No instances match the current filters.</span>
            :   null}

            {instances.length === 0
            ?   <span className="text-muted">No saved instances yet.</span>
            :   null}

            {!selection && !form.readonly &&
            <Link to={`/form/${form.formId}`}>+ New instance</Link>
            }
        </div>
        );
}

function routeFilters(params: string[], searchParams: URLSearchParams): Record<string, string>
{
    const values: Record<string, string> = {};

    for (const param of params)
    {
        const value = searchParams.get(param);

        if (value)
            values[param] = value;
    }

    return values;
}

function isGroupOpen(label: string, groupOpen: Record<string, boolean>, routeGroupFilters: Record<string, string>): boolean
{
    if (label in groupOpen)
        return groupOpen[label];

    const routeLabel = Object.values(routeGroupFilters).filter(Boolean).join(' / ');
    return routeLabel !== '' && normaliseRouteValue(label) === normaliseRouteValue(routeLabel);
}

function InstanceLinks({
    form,
    instances,
    selection,
    onDeleted,
    onToggleSelected,
}: {
    form: FormIndexEntry;
    instances: InstanceIndexEntry[];
    selection?: { selectedIds: Set<string> };
    onDeleted: () => void;
    onToggleSelected: (instanceId: string, checked: boolean) => void;
})
{
    const { deleteInstance } = useContext(InstanceContext);
    const images = useContext(FormImageContext);
    const navigate = useNavigate();
    const [zoomSrc, setZoomSrc] = useState<string>();

    // Intent: click the list thumbnail → full-size popup. A captured value has an id → load the full-res blob (fall back to
    // the thumbnail if it's gone); a string value is an external URL shown as-is. preventDefault stops the row's navigation.
    const openZoom = async (value: unknown) =>
    {
        if (isCapturedImage(value))
            setZoomSrc(await images.getObjectUrl(value.id) ?? value.thumbnail);
        else if (typeof value === 'string')
            setZoomSrc(value);
    };

    const deleteSavedInstance = async (instance: InstanceIndexEntry) =>
    {
        const title = displayTitle(instance, form.displayParam);

        if (!window.confirm(`Delete instance "${title}"?`))
            return;

        const ownedImages = await images.imagesFor({ formId: form.formId, instanceId: instance.instanceId });

        await Promise.all(ownedImages.map(record => images.deleteImage(record.id)));
        await deleteInstance(instance.instanceId);
        onDeleted();
    };

    return (
        <SwipeableList className="instance-list" fullSwipe threshold={0.35} type={SwipeableListType.IOS}>
            {instances.map(instance =>
            {
                // Intent: an instance that never overrode the image falls back to the form's shared default (one copy in the
                // form index) — no per-instance duplication, and the default blob is shared for the full-size zoom
                const thumbValue = instance.thumbnail ?? form.thumbnailDefault;
                const thumb = thumbnailSrc(thumbValue);
                const main =
                    <span className="instance-row-main">
                        <span className="instance-row-title">{displayTitle(instance, form.displayParam)}</span>
                        {instance.dateModified ? <span className="instance-row-subtitle">Edited {formatDate(instance.dateModified)}</span> : null}
                    </span>;
                const details =
                    <span className="instance-row-details">
                        {displayDetails(instance, form.displayParam).map(detail =>
                            detail.kind === 'break'
                            ?   <span key={detail.key} className="instance-row-break" />
                            :   <span key={detail.param} className="instance-row-detail">
                                    <span className="instance-row-detail-label">{detail.label}</span>
                                    <span>{detail.value}</span>
                                </span>
                            )}
                    </span>;
                const body = thumb
                ?   <span className="instance-row-thumbwrap">
                        <span className="instance-row-content">{main}{details}</span>
                        <img
                            className="instance-row-thumb"
                            src={thumb}
                            alt=""
                            onClick={selection ? undefined : e => { e.preventDefault(); e.stopPropagation(); void openZoom(thumbValue); }}
                        />
                    </span>
                :   <span className="instance-row-content">{main}{details}</span>;
                const selected = selection?.selectedIds.has(instance.instanceId) ?? false;
                const toggleSelected = () =>
                    onToggleSelected(instance.instanceId, !selected);

                return (
                    <SwipeableListItem
                        key={instance.instanceId}
                        className="instance-row-wrap"
                        onClick={() => selection ? toggleSelected() : navigate(`/form/${form.formId}/${instance.instanceId}`)}
                        trailingActions={selection ? undefined : deleteActions(() => deleteSavedInstance(instance))}
                    >
                        <div className={['instance-row', selection ? 'instance-row-selecting' : ''].filter(Boolean).join(' ')}>
                            {selection &&
                            <input
                                type="checkbox"
                                className="instance-row-checkbox"
                                checked={selected}
                                aria-label={`Select ${displayTitle(instance, form.displayParam)}`}
                                onClick={e => e.stopPropagation()}
                                onChange={e => onToggleSelected(instance.instanceId, e.target.checked)}
                            />
                            }
                            {body}
                        </div>
                    </SwipeableListItem>
                    );
            })}

            <Modal show={!!zoomSrc} onHide={() => setZoomSrc(undefined)} centered size="lg">
                <Modal.Body className="center">
                    {zoomSrc &&
                    <img src={zoomSrc} alt="" style={{ maxWidth: '100%', height: 'auto' }} />
                    }
                </Modal.Body>
            </Modal>
        </SwipeableList>
        );
}

const deleteActions = (onDelete: () => Promise<void>) =>
    <TrailingActions>
        <SwipeAction onClick={() => void onDelete()}>
            <button type="button" className="instance-swipe-delete">Delete</button>
        </SwipeAction>
    </TrailingActions>;

type DisplayDetail =
    | { kind: 'break'; key: string }
    | { kind: 'field'; param: string; label: string; value: string };

function displayTitle(instance: InstanceIndexEntry, params: DisplayParam[] | undefined): string
{
    const orderedParams = displayParams(instance, params);
    const firstParam = orderedParams.find((param): param is string => typeof param === 'string');
    const firstValue = firstParam ? valueText(instance.display[firstParam]) : '';

    return firstValue || 'Untitled instance';
}

function displayDetails(instance: InstanceIndexEntry, params: DisplayParam[] | undefined): DisplayDetail[]
{
    const out: DisplayDetail[] = [];
    let skippedTitle = false;

    for (const param of displayParams(instance, params))
    {
        if (param === null)
        {
            if (skippedTitle)
                out.push({ kind: 'break', key: `break-${out.length}` });
            continue;
        }

        if (!skippedTitle)
        {
            skippedTitle = true;
            continue;
        }

        const field = instance.display[param];
        const value = valueText(field);

        if (value)
            out.push({ kind: 'field', param, label: projectionLabel(field) ?? paramLabel(param), value });
    }

    return trimBreaks(out);
}

function displayParams(instance: InstanceIndexEntry, params: DisplayParam[] | undefined): DisplayParam[]
{
    return params && params.length > 0 ? params : Object.keys(instance.display);
}

function trimBreaks(details: DisplayDetail[]): DisplayDetail[]
{
    while (details[0]?.kind === 'break')
        details.shift();

    while (details[details.length - 1]?.kind === 'break')
        details.pop();

    return details;
}

function formatDate(iso: string): string
{
    return new Date(iso).toLocaleString();
}

function paramList(value: ParamList | undefined): string[]
{
    if (!value)
        return [];

    return Array.isArray(value) ? value : [value];
}

// Intent: the thumbnail rides in the value already — a captured object exposes its data-URI thumbnail; a bare string is an
// external URL usable directly. Anything else → no thumbnail (row falls back to full-width text).
function thumbnailSrc(value: unknown): string | undefined
{
    if (isCapturedImage(value))
        return value.thumbnail;

    return typeof value === 'string' && value !== '' ? value : undefined;
}

function valueText(value: unknown): string
{
    const unwrapped = projectionValue(value);

    if (isCapturedImage(unwrapped))
        return imageValueText(unwrapped);

    return unwrapped == null ? '' : String(unwrapped);
}

function normaliseRouteValue(value: string): string
{
    return value.trim().toLowerCase();
}

function projectionValue(value: unknown): unknown
{
    return isProjectionObject(value) ? value.value : value;
}

function projectionLabel(value: unknown): string | undefined
{
    return isProjectionObject(value) ? value.label : undefined;
}

function isProjectionObject(value: unknown): value is { label?: string; value?: unknown }
{
    return typeof value === 'object' && value !== null && 'value' in value && 'label' in value;
}

function paramLabel(param: string): string
{
    return param
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, ch => ch.toUpperCase());
}

function filterOptions(instances: InstanceIndexEntry[], param: string): string[]
{
    return [
        '',
        ...[...new Set(instances
            .map(instance => valueText(instance.filter?.[param]))
            .filter(Boolean))]
            .sort((a, b) => a.localeCompare(b))
    ];
}

function orderLabel(params: string[], step: number): string
{
    if (step === 0)
        return 'None';

    const index = Math.floor((step - 1) / 2);
    return `${paramLabel(params[index])} ${(step - 1) % 2 === 0 ? '↑' : '↓'}`;
}

function orderInstances(instances: InstanceIndexEntry[], params: string[], step: number): InstanceIndexEntry[]
{
    if (step === 0 || params.length === 0)
        return instances;

    const param = params[Math.floor((step - 1) / 2)];
    const direction = (step - 1) % 2 === 0 ? 1 : -1;

    return [...instances].sort((a, b) => direction * compareValues(orderValue(a, param), orderValue(b, param)));
}

function orderValue(instance: InstanceIndexEntry, param: string): unknown
{
    return instance.order?.[param] ?? instance.display[param] ?? instance.filter?.[param] ?? instance.group?.[param];
}

function compareValues(a: unknown, b: unknown): number
{
    const aText = valueText(a);
    const bText = valueText(b);
    const aNumber = numberValue(aText);
    const bNumber = numberValue(bText);

    if (aNumber !== undefined && bNumber !== undefined)
        return aNumber - bNumber;

    return aText.localeCompare(bText);
}

function numberValue(value: string): number | undefined
{
    const fraction = value.match(/^(\d+)\/(\d+)$/);
    if (fraction)
        return Number(fraction[1]) / Number(fraction[2]);

    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

function groupInstances(instances: InstanceIndexEntry[], params: string[]): { label: string; instances: InstanceIndexEntry[] }[]
{
    if (params.length === 0)
        return [{ label: 'Instances', instances }];

    const byLabel = new Map<string, InstanceIndexEntry[]>();

    for (const instance of instances)
    {
        const label = params.map(param => valueText(instance.group?.[param])).filter(Boolean).join(' / ') || 'Ungrouped';
        byLabel.set(label, [...(byLabel.get(label) ?? []), instance]);
    }

    return [...byLabel.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, groupedInstances]) => ({ label, instances: groupedInstances }));
}
