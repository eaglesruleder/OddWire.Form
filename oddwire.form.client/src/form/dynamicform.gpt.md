# Doc — Dynamic Form

**Scope:** Feature
**Domain:** oddform
**Status:** Active

---

## Summary

**Goal:** Render a fixed set of typed controls, hold their values in `FormPage` state, and emit each edit by `param`.

**Lifecycle:**
1. FormPage seeds a values map
2. Render controls with `value` + `onChange`
3. User edits a control
4. Control emits `onChange(value, param)`
5. FormPage patches `values[param]`, re-renders
6. Live values shown in a `ControlText` debug bubble

**Rules:**
- State is memory-only — no persistence, lost on refresh
- Controls hold no state; FormPage owns all values
- Write is by `param`; duplicate params collapse to one value
- Hidden controls render nothing

**State:** `Stored: values (Record<param, unknown>) in FormPage — Persisted: never`

---

## Implementation

### FormPage
Owns the hard-coded control tree, the values map, and the single change sink.

- `handleChange(value, param)` — patch `values[param]` immutably, re-render
- Renders `StripLayout > Form >` one of each control, plus a live-values `ControlText` bubble
- Seeds fixed initial values; option lists (`statusOptions`, `priorityOptions`) are local consts

### StripLayout
Headered tablet-portrait shell — masthead title + padded `main`. Strip width and borders live on `#root` (layout.css); this only supplies the header band and body slot.

---

_Not built yet: JSON `ControlList`/`ControlItem`, instance overlay, local context + navigation, MVP+ layout/DB controls._
