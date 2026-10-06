# OddWire.Form Client

React 19 + TypeScript + Vite client for the OddWire.Form dynamic form runtime.

## Runtime Shape

The client owns the product behaviour:
- `BrowserRouter` routes `/`, `/form/:formId/:instanceId?`, and `/settings`
- `ContextsProvider` initialises form, instance, and lookup stores
- form definitions are JSON control trees
- instances are sparse `param`-keyed overlays
- `ControlList` walks a control scope and groups adjacent tabs
- `ControlItem` resolves a form control with the instance overlay and dispatches by `type`
- lookup-backed radio/dropdown controls read from the aggregated lookup DB
- looper controls render row-scoped child instances from a template control list
- settings manage global lookup tables, bundled form installs, and monster imports

All persistence is browser-local through `localforage`. The server does not provide form APIs.

## Source Map

- `src/App.tsx` - routes and context provider
- `src/_context/` - stores, types, seed data
- `src/form/FormPage.tsx` - load/render/save active form instance
- `src/landing/` - form and instance picker
- `src/settings/` - DB Manager and Form Manager
- `src/_components/layout/` - strip shell
- `src/_components/controllist/` - renderer, lookup resolver, controls
- `src/mods/5etools/` - monster data mapper/importer
- `public/style/` - global keyword CSS

## Commands

```powershell
npm run dev
npm run build
npm run lint
```

`npm run build` runs `tsc -b` and then `vite build`.

## Embedded runtime package

`npm run build:package` creates the installable library in `dist-package/`; `npm pack` runs that
build automatically and produces the artifact a host installs. React and ReactDOM are peer
dependencies, so an embedding application keeps ownership of its one React tree.

An embedded host imports the public stylesheet and composes the persisted provider with the
route-free surface. The provider uses the same browser-local `localforage` stores and installs the
same default bundled forms (including monster-card) as the standalone app.

```tsx
import { ContextsProvider, FormSurface } from 'oddwire.form.client';
import 'oddwire.form.client/styles.css';

export function CharacterForm()
{
    return (
        <ContextsProvider>
            <FormSurface
                formId="44444444-4444-4444-8444-444444444444"
                instanceId="optional-saved-instance-id"
                onNavigate={path => console.log('Form requested navigation', path)}
            />
        </ContextsProvider>
        );
}
```

`FormSurface` does not mount a React root and does not read router state. Its host supplies the
form identity and optional instance identity. `onNavigate` receives Form's existing route-shaped
intent (for example a freshly saved instance or PDF export); a host may translate it to its own
router, tab/state transition, or ignore it. The standalone `FormPage` is the corresponding React
Router adapter.

`FormSurface` is intentionally the persisted/browser-owned workflow. A projection-driven host that
remains authoritative over its data instead uses `HostedFormSurface`. It accepts a snapshot and
renders the same form schema without loading, saving, autosaving, deleting, or mutating a Form
instance in browser storage. Hosted controls are read-only; tabs and other layout navigation remain
available.

```tsx
import { ContextsProvider, HostedFormSurface, type FormInstance } from 'oddwire.form.client';

const character: FormInstance = {
    formId: '44444444-4444-4444-8444-444444444444',
    instanceId: 'host-owned-identity',
    controls: [{ param: 'name', value: 'Villager' }],
    };

export function CharacterForm()
{
    return (
        <ContextsProvider>
            <HostedFormSurface formId={character.formId!} instance={character} />
        </ContextsProvider>
        );
}
```

`instanceId` in hosted mode is host identity only, never a localforage key. Replacing the `instance`
prop replaces the visible snapshot; OddWire.Form never keeps an editable local copy.

The public package surface is intentionally limited to `ContextsProvider`, `FormSurface`,
`HostedFormSurface`, and the form/control types required to host them. Do not deep-import runtime
internals. Styling is explicit: import `oddwire.form.client/styles.css` once in the host
application. It includes Bootstrap and the previously HTML-loaded Form styles; component-local
styles remain packaged with the runtime.
