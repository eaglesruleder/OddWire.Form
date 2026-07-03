# Doc — Dynamic Form

**Scope:** Feature
**Domain:** oddform
**Status:** Active

---

## Summary

**Goal:** Load a JSON form definition through a context accessor and render its control tree by dispatching each control on `type`.

**Lifecycle:**
1. FormPage asks `FormContext.getForm(id)` for the definition
2. While unresolved, render a loading shell
3. Pass `form.controls` to `ControlList`
4. ControlList renders a `ControlItem` per control, resolving its live value
5. ControlItem gates `hidden`, switches on `type`, renders the Stage 1 control (unknown → fallback)
6. User edits → `onChange(value, param)` → FormPage patches `values[param]`, re-renders

**Rules:**
- State is memory-only — no persistence, lost on refresh
- Type dispatch lives only in `ControlItem`; `ControlList` stays type-agnostic
- Unknown `type` renders a fallback, never crashes
- Hidden controls render nothing (`ControlItem` gates before dispatch)
- Write is by `param`; duplicate params collapse to one value
- No instance overlay yet — `values` is a transitional bridge (Stage 3 replaces it)

**State:** `Stored: form (FormDefinition | null), values (Record<param, unknown>) in FormPage — Persisted: never`

---

## Structure

`FormPage` → `src/form/` · `FormContext` → `src/context/` · `ControlList` + `ControlItem` + `controls/` → `src/_components/controllist/` (this folder). Control leaves + their contracts map is `controls.gpt.md` in `controls/`.

---

## Implementation

### FormContext
Provides the durable `getForm(id): Promise<FormDefinition>` pathway. Stub body ignores the id and returns the imported `testform.json` (single boundary cast). Later grows the folder-scan + write-to-context; only the body changes.

### FormPage
Loads the definition via context, holds the values map, owns the single change sink.

- `getForm(SELECTED_FORM_ID)` in an effect → `form` state; loading shell until resolved
- `handleChange(value, param)` — patch `values[param]` immutably, re-render
- Renders `StripLayout > Form > ControlList`

### ControlList
Iterates a control scope; resolves each live value (`values[param] ?? control.value`) and renders a `ControlItem`. No type knowledge.

### ControlItem
`hidden` → null; `switch(control.type)` → matching Stage 1 control; `default` → `.unsupported-control` fallback.

### StripLayout
Headered tablet-portrait shell — masthead title + padded `main`. Strip width and borders live on `#root` (layout.css); this only supplies the header band and body slot.

---

_Not built yet: instance overlay (Stage 3), real context folder-scan + landing navigation (Stage 4), MVP+ layout/DB controls._
