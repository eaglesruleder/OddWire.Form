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
